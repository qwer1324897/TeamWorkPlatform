import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, Circle, Clock, Tag, User, ChevronRight, X, Calendar, Loader2, Trash2, RotateCcw, Edit2, Save } from 'lucide-react';
import { TodoItem } from '../types';
import { todoService } from '../services/todoService';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * TodoView 컴포넌트
 * 
 * 할 일 관리 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 할 일 목록 조회 (필터링: 전체/진행중/완료/휴지통)
 * - 할 일 추가/수정/삭제
 * - 마감일 수정 기능
 * - 휴지통 기능 (삭제 시 휴지통 이동 → 복구 가능)
 * - 날짜 형식: yyyy-MM-dd HH:mm
 */

const TodoView: React.FC = () => {
    // 할 일 목록
    const [todos, setTodos] = useState<TodoItem[]>([]);
    // 로딩 상태
    const [loading, setLoading] = useState(true);
    // 선택된 할 일
    const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
    // 필터 (all: 전체, pending: 진행중, completed: 완료, trash: 휴지통)
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'trash'>('all');
    // 프로젝트 필터
    const [projectFilter, setProjectFilter] = useState<string | null>(null);
    // 추가 모달 표시 여부
    const [showAddModal, setShowAddModal] = useState(false);
    // 상세 패널 수정 모드
    const [isEditingDetail, setIsEditingDetail] = useState(false);

    // 폼 상태
    const [formData, setFormData] = useState<Partial<TodoItem>>({});
    
    // 상세 패널 수정 상태
    const [editDueDate, setEditDueDate] = useState('');
    const [editDescription, setEditDescription] = useState('');

    /**
     * Supabase에서 할 일 목록을 가져옵니다.
     */
    const fetchTodos = async () => {
        setLoading(true);
        const { data, error } = await todoService.getTodos();
        if (error) {
            console.error('할 일 불러오기 실패:', error);
        } else {
            setTodos(data || []);
        }
        setLoading(false);
    };

    // 컴포넌트 마운트 시 할 일 로드
    useEffect(() => {
        fetchTodos();
    }, []);

    /**
     * 할 일 추가
     */
    const handleCreate = async () => {
        if (!formData.title || !formData.dueDate) {
            alert('할 일 내용과 마감일을 입력해주세요.');
            return;
        }

        const newTodo: Omit<TodoItem, 'id'> = {
            title: formData.title,
            description: formData.description || '',
            project: formData.project || '기타',
            dueDate: formData.dueDate,
            status: '대기',
            priority: formData.priority || '중',
            assignee: formData.assignee || '나'
        };

        const { data, error } = await todoService.createTodo(newTodo);
        if (!error && data) {
            setTodos([...todos, data]);
            setShowAddModal(false);
            setFormData({});
        }
    };

    /**
     * 상태 토글 (대기 ↔ 완료)
     */
    const handleUpdateStatus = async (todo: TodoItem) => {
        const newStatus = todo.status === '완료' ? '진행중' : '완료';
        const { data, error } = await todoService.updateTodo(todo.id, { status: newStatus });
        if (!error && data) {
            setTodos(todos.map(t => t.id === todo.id ? data : t));
            if (selectedTodo?.id === todo.id) {
                setSelectedTodo(data);
            }
        }
    };

    /**
     * 휴지통으로 이동 (소프트 삭제)
     * 요청사항: 쓰레기통을 누르면 휴지통 탭으로 이동
     * is_deleted 컬럼을 true로 설정
     */
    const handleMoveToTrash = async (id: number) => {
        const { data, error } = await todoService.moveToTrash(id);
        if (!error && data) {
            setTodos(todos.map(t => t.id === id ? data : t));
            setSelectedTodo(null);
        } else {
            alert('휴지통 이동에 실패했습니다.');
        }
    };

    /**
     * 휴지통에서 복구
     * is_deleted 컬럼을 false로 설정
     */
    const handleRestore = async (id: number) => {
        const { data, error } = await todoService.restoreFromTrash(id);
        if (!error && data) {
            setTodos(todos.map(t => t.id === id ? data : t));
            setSelectedTodo(null);
        } else {
            alert('복구에 실패했습니다.');
        }
    };

    /**
     * 영구 삭제
     */
    const handlePermanentDelete = async (id: number) => {
        if (window.confirm('정말 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            const { error } = await todoService.deleteTodo(id);
            if (!error) {
                setTodos(todos.filter(t => t.id !== id));
                setSelectedTodo(null);
            }
        }
    };

    /**
     * 마감일/설명 수정 저장
     */
    const handleSaveDetail = async () => {
        if (!selectedTodo) return;

        const updates: Partial<TodoItem> = {};
        if (editDueDate) updates.dueDate = editDueDate;
        if (editDescription !== selectedTodo.description) updates.description = editDescription;

        if (Object.keys(updates).length > 0) {
            const { data, error } = await todoService.updateTodo(selectedTodo.id, updates);
            if (!error && data) {
                setTodos(todos.map(t => t.id === data.id ? data : t));
                setSelectedTodo(data);
            }
        }
        setIsEditingDetail(false);
    };

    /**
     * 상세 패널 열 때 수정 상태 초기화
     */
    const handleSelectTodo = (todo: TodoItem) => {
        setSelectedTodo(todo);
        setEditDueDate(todo.dueDate || '');
        setEditDescription(todo.description || '');
        setIsEditingDetail(false);
    };

    /**
     * 필터링된 할 일 목록
     * isDeleted 필드로 휴지통 여부 판단
     */
    const filteredTodos = todos.filter(todo => {
        // 프로젝트 필터
        if (projectFilter && todo.project !== projectFilter) return false;
        
        // 상태 필터 (isDeleted 사용)
        if (filter === 'all') return !todo.isDeleted;
        if (filter === 'pending') return todo.status !== '완료' && !todo.isDeleted;
        if (filter === 'completed') return todo.status === '완료' && !todo.isDeleted;
        if (filter === 'trash') return todo.isDeleted === true;
        
        return true;
    });

    /**
     * 우선순위에 따른 테두리 색상
     */
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case '상': return 'border-l-red-500';
            case '중': return 'border-l-orange-500';
            case '하': return 'border-l-green-500';
            default: return 'border-l-gray-300';
        }
    };

    /**
     * 날짜 포맷팅 (yyyy-MM-dd HH:mm)
     * 요청사항: 날짜 형식 개선
     */
    const formatDueDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
        } catch {
            // 이미 포맷된 날짜거나 파싱 실패 시
            return dateString;
        }
    };

    /**
     * 마감일 경과 여부 확인
     */
    const isOverdue = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return isPast(date) && !isToday(date);
        } catch {
            return false;
        }
    };

    // 프로젝트 목록 추출 (중복 제거, 삭제되지 않은 것만)
    const projects = Array.from(new Set(todos.filter(t => !t.isDeleted).map(t => t.project))).filter(Boolean);

    // 통계 계산 (isDeleted 기준)
    const totalCount = todos.filter(t => !t.isDeleted).length;
    const pendingCount = todos.filter(t => t.status !== '완료' && !t.isDeleted).length;
    const completedCount = todos.filter(t => t.status === '완료' && !t.isDeleted).length;
    const trashCount = todos.filter(t => t.isDeleted === true).length;

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 relative">

            {/* ========================================
                좌측 사이드바
            ======================================== */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4">
                {/* 할 일 추가 버튼 */}
                <button
                    onClick={() => { setShowAddModal(true); setFormData({}); }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all mb-6 flex items-center justify-center gap-2 transform active:scale-95 duration-150 hover:shadow-lg"
                >
                    <Plus size={18} /> 할 일 추가
                </button>

                {/* 필터 버튼들 */}
                <div className="space-y-1">
                    <button 
                        onClick={() => { setFilter('all'); setProjectFilter(null); }} 
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex justify-between transition-colors ${filter === 'all' && !projectFilter ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:bg-gray-200/50'}`}
                    >
                        <span>전체 할 일</span>
                        <span className="bg-gray-100 text-gray-600 px-2 rounded-full text-xs flex items-center">{totalCount}</span>
                    </button>
                    <button 
                        onClick={() => { setFilter('pending'); setProjectFilter(null); }} 
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex justify-between transition-colors ${filter === 'pending' && !projectFilter ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:bg-gray-200/50'}`}
                    >
                        <span>진행 중</span>
                        <span className="bg-blue-100 text-blue-600 px-2 rounded-full text-xs flex items-center">{pendingCount}</span>
                    </button>
                    <button 
                        onClick={() => { setFilter('completed'); setProjectFilter(null); }} 
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex justify-between transition-colors ${filter === 'completed' && !projectFilter ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:bg-gray-200/50'}`}
                    >
                        <span>완료됨</span>
                        <span className="bg-green-100 text-green-600 px-2 rounded-full text-xs flex items-center">{completedCount}</span>
                    </button>
                    {/* 휴지통 탭 (요청사항) */}
                    <button 
                        onClick={() => { setFilter('trash'); setProjectFilter(null); }} 
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex justify-between transition-colors ${filter === 'trash' ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' : 'text-slate-600 hover:bg-gray-200/50'}`}
                    >
                        <span className="flex items-center gap-2"><Trash2 size={16} /> 휴지통</span>
                        {trashCount > 0 && <span className="bg-red-100 text-red-600 px-2 rounded-full text-xs flex items-center">{trashCount}</span>}
                    </button>
                </div>

                {/* 프로젝트 목록 */}
                <div className="mt-8">
                    <h5 className="px-4 text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        Projects <span className="h-px bg-gray-200 flex-1"></span>
                    </h5>
                    <div className="space-y-1 overflow-y-auto max-h-[300px]">
                        {projects.map(proj => (
                            <div
                                key={proj}
                                onClick={() => { setProjectFilter(proj); setFilter('all'); }}
                                className={`px-4 py-2 text-sm flex items-center gap-2 cursor-pointer rounded-lg transition-all
                                    ${projectFilter === proj ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-slate-600 hover:bg-gray-200/50 hover:translate-x-1'}
                                `}
                            >
                                <div className={`w-2 h-2 rounded-full ${projectFilter === proj ? 'bg-indigo-500 ring-2 ring-indigo-200' : 'bg-slate-300'}`}></div> 
                                {proj}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 진행률 표시 */}
                {totalCount > 0 && (
                    <div className="mt-auto p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-700">진행률</span>
                            <span className="text-blue-600 font-bold">{Math.round((completedCount / totalCount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{completedCount}/{totalCount} 완료</p>
                    </div>
                )}
            </div>

            {/* ========================================
                할 일 목록
            ======================================== */}
            <div className={`flex-1 bg-white flex flex-col min-w-0 transition-all ${selectedTodo ? 'border-r border-gray-200' : ''}`}>
                {/* 헤더 */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {filter === 'trash' ? '휴지통' : projectFilter ? projectFilter : '나의 할 일'}
                        {projectFilter && (
                            <button 
                                className="text-xs font-normal text-white bg-slate-400 hover:bg-red-500 rounded-full px-2 py-0.5 transition-colors" 
                                onClick={() => setProjectFilter(null)}
                            >
                                필터 해제 ✕
                            </button>
                        )}
                    </h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="할 일 검색" 
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm w-64 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                        />
                    </div>
                </div>

                {/* 목록 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/30">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : filteredTodos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            {filter === 'trash' ? (
                                <>
                                    <Trash2 size={48} className="mb-4 opacity-30" />
                                    <p>휴지통이 비어있습니다.</p>
                                </>
                            ) : (
                                <p>할 일이 없습니다.</p>
                            )}
                        </div>
                    ) : filteredTodos.map(todo => (
                        <div
                            key={todo.id}
                            onClick={() => handleSelectTodo(todo)}
                            className={`group flex items-center p-4 bg-white border border-gray-100 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/5 border-l-4
                                ${getPriorityColor(todo.priority)}
                                ${selectedTodo?.id === todo.id ? 'ring-2 ring-blue-500 border-l-blue-600 shadow-md z-10' : ''}
                                ${filter === 'trash' ? 'opacity-60' : ''}
                            `}
                        >
                            {/* 체크박스 */}
                            {filter !== 'trash' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(todo); }}
                                    className="mr-4 text-slate-300 hover:text-blue-600 transition-colors transform hover:scale-110 active:scale-95"
                                >
                                    {todo.status === '완료' ? (
                                        <CheckCircle2 size={24} className="text-green-500" />
                                    ) : (
                                        <Circle size={24} />
                                    )}
                                </button>
                            )}
                            
                            {/* 내용 */}
                            <div className="flex-1">
                                <h4 className={`text-base font-bold mb-1 transition-colors ${todo.status === '완료' ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-700'}`}>
                                    {todo.title}
                                </h4>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                        <Tag size={12} /> {todo.project}
                                    </span>
                                    {/* 날짜 형식 개선 (요청사항) */}
                                    <span className={`flex items-center gap-1 ${isOverdue(todo.dueDate) && todo.status !== '완료' ? 'text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded' : ''}`}>
                                        <Clock size={12} /> {formatDueDate(todo.dueDate)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User size={12} /> {todo.assignee}
                                    </span>
                                </div>
                            </div>

                            {/* 우선순위 및 화살표 */}
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    todo.priority === '상' ? 'bg-red-50 text-red-600' :
                                    todo.priority === '중' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                }`}>
                                    {todo.priority}
                                </span>
                                <div className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========================================
                상세 패널
            ======================================== */}
            {selectedTodo && (
                <div className="w-[400px] bg-white flex flex-col animate-slide-in-right border-l border-gray-200 shadow-2xl z-20">
                    <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0">
                        <span className="font-bold text-slate-500 text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> 상세 정보
                        </span>
                        <button onClick={() => setSelectedTodo(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-8 flex-1 overflow-y-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{selectedTodo.title}</h2>
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    selectedTodo.isDeleted ? 'bg-red-50 text-red-700 border-red-200' :
                                    selectedTodo.status === '완료' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    {selectedTodo.isDeleted ? '삭제됨' : selectedTodo.status}
                                </span>
                                <span className="text-slate-300 text-sm">|</span>
                                <span className="text-sm font-medium text-slate-600 bg-gray-100 px-2 py-0.5 rounded">
                                    {selectedTodo.project}
                                </span>
                            </div>

                            <div className="space-y-6">
                                {/* 담당자 */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">담당자</label>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                            {selectedTodo.assignee ? selectedTodo.assignee[0] : '?'}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{selectedTodo.assignee}</span>
                                    </div>
                                </div>

                                {/* 마감일 (수정 가능) - 요청사항 */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center justify-between">
                                        마감일
                                        {filter !== 'trash' && (
                                            <button 
                                                onClick={() => setIsEditingDetail(!isEditingDetail)}
                                                className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Edit2 size={12} /> 수정
                                            </button>
                                        )}
                                    </label>
                                    {isEditingDetail ? (
                                        <input
                                            type="datetime-local"
                                            value={editDueDate ? editDueDate.slice(0, 16) : ''}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className={`flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 transition-all ${isOverdue(selectedTodo.dueDate) && selectedTodo.status !== '완료' ? 'border-red-300 bg-red-50' : 'hover:border-red-400 hover:shadow-md'} cursor-pointer group`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${isOverdue(selectedTodo.dueDate) && selectedTodo.status !== '완료' ? 'bg-red-100 text-red-500' : 'bg-red-50 text-red-500'}`}>
                                                <Clock size={18} />
                                            </div>
                                            <span className={`text-sm font-bold ${isOverdue(selectedTodo.dueDate) && selectedTodo.status !== '완료' ? 'text-red-600' : 'text-slate-800'}`}>
                                                {formatDueDate(selectedTodo.dueDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 설명 (수정 가능) - 요청사항 */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">설명</label>
                                    {isEditingDetail ? (
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="설명을 입력하세요..."
                                            className="w-full p-4 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] resize-none"
                                        />
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-slate-700 leading-relaxed min-h-[120px] shadow-inner whitespace-pre-wrap">
                                            {selectedTodo.description?.replace(/\\n/g, '\n') || '설명이 없습니다.'}
                                        </div>
                                    )}
                                </div>

                                {/* 수정 저장 버튼 */}
                                {isEditingDetail && (
                                    <button
                                        onClick={handleSaveDetail}
                                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} /> 변경사항 저장
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50/50 backdrop-blur-sm flex gap-2">
                        {filter === 'trash' ? (
                            // 휴지통에서: 복구 / 영구삭제
                            <>
                                <button
                                    onClick={() => handleRestore(selectedTodo.id)}
                                    className="flex-1 font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={18} /> 복구하기
                                </button>
                                <button
                                    onClick={() => handlePermanentDelete(selectedTodo.id)}
                                    className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </>
                        ) : (
                            // 일반: 완료처리 / 휴지통으로
                            <>
                                <button
                                    onClick={() => handleUpdateStatus(selectedTodo)}
                                    className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 text-white ${selectedTodo.status === '완료' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {selectedTodo.status === '완료' ? '다시 열기' : '완료 처리'}
                                </button>
                                <button
                                    onClick={() => handleMoveToTrash(selectedTodo.id)}
                                    className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
                                    title="휴지통으로 이동"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================
                할 일 추가 모달
            ======================================== */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden transform transition-all scale-100">
                        <div className="h-16 bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-between px-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 opacity-50 skew-x-12"></div>
                            <h3 className="text-white font-bold text-lg relative z-10 flex items-center gap-2">
                                <Plus className="bg-white/20 rounded-full p-1" size={24} /> 새 할 일 추가
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white relative z-10 bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* 제목 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">할 일 내용</label>
                                <input
                                    type="text"
                                    placeholder="무엇을 해야 하나요?"
                                    className="w-full border-b-2 border-gray-200 focus:border-green-600 py-3 text-xl font-bold outline-none bg-transparent placeholder-gray-300 transition-colors"
                                    autoFocus
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* 마감일 / 우선순위 */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">마감일</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-0 top-2.5 text-slate-400 group-focus-within:text-green-600 transition-colors" size={18} />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-8 py-2 border-b border-gray-200 outline-none font-medium text-slate-700 focus:border-green-600 transition-colors"
                                            value={formData.dueDate || ''}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">우선순위</label>
                                    <select
                                        className="w-full py-2 border-b border-gray-200 outline-none font-medium text-slate-700 bg-transparent focus:border-green-600 transition-colors"
                                        value={formData.priority || '중'}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                    >
                                        <option value="상">상</option>
                                        <option value="중">중</option>
                                        <option value="하">하</option>
                                    </select>
                                </div>
                            </div>

                            {/* 프로젝트 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">프로젝트</label>
                                <input
                                    type="text"
                                    placeholder="프로젝트명 (예: 마케팅)"
                                    className="w-full py-2 border-b border-gray-200 outline-none font-medium text-slate-700 bg-transparent focus:border-green-600 transition-colors"
                                    value={formData.project || ''}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                />
                            </div>

                            {/* 설명 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">설명</label>
                                <textarea
                                    placeholder="상세 내용을 입력하세요..."
                                    className="w-full py-2 border-b border-gray-200 outline-none font-medium text-slate-700 bg-transparent focus:border-green-600 transition-colors resize-none h-20"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">
                                취소
                            </button>
                            <button onClick={handleCreate} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                추가하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoView;
