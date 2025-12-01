import React, { useState, useEffect } from 'react';
import { 
    Plus, ChevronDown, Search, Filter, LayoutGrid, 
    Loader2, FolderKanban, Settings, MoreHorizontal
} from 'lucide-react';
import { Project, KanbanColumn, KanbanTask, ContactItem } from '../types';
import { kanbanService } from '../services/kanbanService';
import { contactService } from '../services/contactService';
import KanbanBoard from '../components/kanban/KanbanBoard';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';

/**
 * KanbanView - 칸반 보드 메인 뷰
 * 
 * 프로젝트 선택 후 해당 프로젝트의 칸반 보드를 표시합니다.
 * - 프로젝트 드롭다운 선택
 * - 컬럼 + 태스크 로드
 * - 드래그앤드롭 지원
 * - 태스크 상세 패널
 */

const KanbanView: React.FC = () => {
    // 프로젝트 관련 상태
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    // 칸반 데이터 상태
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [contacts, setContacts] = useState<ContactItem[]>([]);

    // UI 상태
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 초기 데이터 로드
    useEffect(() => {
        fetchProjects();
        fetchContacts();
    }, []);

    // 프로젝트 선택 시 칸반 데이터 로드
    useEffect(() => {
        if (selectedProject) {
            fetchKanbanData(selectedProject.id);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        const { data, error } = await kanbanService.getProjects();
        if (!error && data) {
            setProjects(data);
            // 첫 번째 active 프로젝트 자동 선택
            const activeProject = data.find(p => p.status === 'active');
            if (activeProject) {
                setSelectedProject(activeProject);
            }
        }
        setIsLoading(false);
    };

    const fetchContacts = async () => {
        const { data, error } = await contactService.getContacts();
        if (!error && data) {
            setContacts(data);
        }
    };

    const fetchKanbanData = async (projectId: number) => {
        setIsLoading(true);
        
        const [columnsResult, tasksResult] = await Promise.all([
            kanbanService.getColumns(projectId),
            kanbanService.getTasks(projectId)
        ]);

        if (!columnsResult.error && columnsResult.data) {
            setColumns(columnsResult.data);
        }
        if (!tasksResult.error && tasksResult.data) {
            setTasks(tasksResult.data);
        }

        setIsLoading(false);
    };

    // 태스크를 컬럼별로 그룹화
    const getTasksByColumn = (columnId: number) => {
        return tasks
            .filter(t => t.columnId === columnId)
            .sort((a, b) => a.position - b.position);
    };

    // 태스크 이동 핸들러 (드래그앤드롭)
    const handleTaskMove = async (
        taskId: number, 
        sourceColumnId: number, 
        destinationColumnId: number, 
        newPosition: number
    ) => {
        // Optimistic Update
        const updatedTasks = tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, columnId: destinationColumnId, position: newPosition };
            }
            return t;
        });
        setTasks(updatedTasks);

        // DB 업데이트
        const { error } = await kanbanService.moveTask(taskId, destinationColumnId, newPosition);
        
        if (error) {
            // 실패 시 롤백
            fetchKanbanData(selectedProject!.id);
        } else {
            // 활동 로그 생성
            const task = tasks.find(t => t.id === taskId);
            const sourceColumn = columns.find(c => c.id === sourceColumnId);
            const destColumn = columns.find(c => c.id === destinationColumnId);
            
            if (sourceColumnId !== destinationColumnId) {
                await kanbanService.createActivityLog({
                    userId: 1, // 현재 유저 (시연용)
                    actionType: 'task_moved',
                    targetType: 'task',
                    targetId: taskId,
                    description: `"${task?.title}" 태스크를 "${sourceColumn?.name}"에서 "${destColumn?.name}"(으)로 이동`,
                    metadata: { sourceColumnId, destinationColumnId }
                });
            }
        }
    };

    // 태스크 생성 핸들러
    const handleCreateTask = async (columnId: number, title: string) => {
        const tasksInColumn = getTasksByColumn(columnId);
        const newPosition = tasksInColumn.length;

        const { data, error } = await kanbanService.createTask({
            columnId,
            title,
            priority: 'medium',
            position: newPosition
        });

        if (!error && data) {
            setTasks([...tasks, data]);
            
            // 활동 로그
            const column = columns.find(c => c.id === columnId);
            await kanbanService.createActivityLog({
                userId: 1,
                actionType: 'task_created',
                targetType: 'task',
                targetId: data.id,
                description: `"${title}" 태스크를 "${column?.name}"에 생성`
            });
        }
    };

    // 태스크 수정 핸들러
    const handleUpdateTask = async (taskId: number, updates: Partial<KanbanTask>) => {
        const { error } = await kanbanService.updateTask(taskId, updates);
        
        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
            if (selectedTask?.id === taskId) {
                setSelectedTask({ ...selectedTask, ...updates });
            }
        }
    };

    // 태스크 삭제 핸들러
    const handleDeleteTask = async (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        const { error } = await kanbanService.deleteTask(taskId);
        
        if (!error) {
            setTasks(tasks.filter(t => t.id !== taskId));
            setSelectedTask(null);
            
            // 활동 로그
            await kanbanService.createActivityLog({
                userId: 1,
                actionType: 'task_deleted',
                targetType: 'task',
                targetId: taskId,
                description: `"${task?.title}" 태스크 삭제`
            });
        }
    };

    // 컬럼 생성 핸들러
    const handleCreateColumn = async (name: string) => {
        if (!selectedProject) return;
        
        const newPosition = columns.length;
        const { data, error } = await kanbanService.createColumn({
            projectId: selectedProject.id,
            name,
            color: '#6b7280',
            position: newPosition
        });

        if (!error && data) {
            const newColumn: KanbanColumn = {
                id: data.id,
                projectId: data.project_id,
                name: data.name,
                color: data.color,
                position: data.position
            };
            setColumns([...columns, newColumn]);
        }
    };

    // 컬럼 수정 핸들러
    const handleUpdateColumn = async (columnId: number, updates: Partial<KanbanColumn>) => {
        const { error } = await kanbanService.updateColumn(columnId, updates);
        
        if (!error) {
            setColumns(columns.map(c => c.id === columnId ? { ...c, ...updates } : c));
        }
    };

    // 컬럼 삭제 핸들러
    const handleDeleteColumn = async (columnId: number) => {
        if (!window.confirm('컬럼을 삭제하면 포함된 모든 태스크도 삭제됩니다. 계속하시겠습니까?')) {
            return;
        }

        const { error } = await kanbanService.deleteColumn(columnId);
        
        if (!error) {
            setColumns(columns.filter(c => c.id !== columnId));
            setTasks(tasks.filter(t => t.columnId !== columnId));
        }
    };

    // 검색 필터링
    const filteredTasks = searchTerm
        ? tasks.filter(t => 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : tasks;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col w-full max-w-full overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <div className="flex items-center gap-4">
                    {/* 프로젝트 선택 드롭다운 */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                            className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all shadow-sm"
                        >
                            <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: selectedProject?.color || '#6b7280' }}
                            />
                            <span className="font-semibold text-slate-800">
                                {selectedProject?.name || '프로젝트 선택'}
                            </span>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showProjectDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-scale-in">
                                <div className="p-3 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 uppercase">프로젝트 선택</p>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {projects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => {
                                                setSelectedProject(project);
                                                setShowProjectDropdown(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                                                selectedProject?.id === project.id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-slate-800">{project.name}</p>
                                                <p className="text-xs text-slate-500">{project.status === 'active' ? '진행 중' : project.status === 'completed' ? '완료됨' : '보관됨'}</p>
                                            </div>
                                            {selectedProject?.id === project.id && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 검색 */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="태스크 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <Filter size={18} />
                    </button>
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <Settings size={18} />
                    </button>
                    <button
                        onClick={() => {
                            const name = prompt('새 컬럼 이름을 입력하세요');
                            if (name) handleCreateColumn(name);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus size={16} />
                        컬럼 추가
                    </button>
                </div>
            </div>

            {/* 칸반 보드 */}
            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                            <p className="text-slate-500">칸반 보드를 불러오는 중...</p>
                        </div>
                    </div>
                ) : !selectedProject ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FolderKanban size={64} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">프로젝트를 선택하세요</h3>
                            <p className="text-slate-500">좌측 상단에서 프로젝트를 선택하면 칸반 보드가 표시됩니다.</p>
                        </div>
                    </div>
                ) : (
                    <KanbanBoard
                        columns={columns}
                        tasks={searchTerm ? filteredTasks : tasks}
                        contacts={contacts}
                        getTasksByColumn={getTasksByColumn}
                        onTaskMove={handleTaskMove}
                        onTaskClick={setSelectedTask}
                        onTaskCreate={handleCreateTask}
                        onColumnUpdate={handleUpdateColumn}
                        onColumnDelete={handleDeleteColumn}
                    />
                )}
            </div>

            {/* 태스크 상세 패널 */}
            {selectedTask && (
                <TaskDetailPanel
                    task={selectedTask}
                    contacts={contacts}
                    columns={columns}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                />
            )}

            {/* 프로젝트 드롭다운 외부 클릭 감지 */}
            {showProjectDropdown && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowProjectDropdown(false)}
                />
            )}
        </div>
    );
};

export default KanbanView;

