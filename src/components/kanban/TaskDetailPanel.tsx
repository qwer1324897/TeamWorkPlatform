import React, { useState, useEffect } from 'react';
import { 
    X, Calendar, User, Tag, AlertCircle, MessageSquare, 
    Clock, Trash2, CheckSquare, Plus, Send, Loader2
} from 'lucide-react';
import { KanbanTask, KanbanColumn, ContactItem, TaskComment, ChecklistItem } from '../../types';
import { kanbanService } from '../../services/kanbanService';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TaskDetailPanelProps {
    task: KanbanTask;
    contacts: ContactItem[];
    columns: KanbanColumn[];
    onClose: () => void;
    onUpdate: (taskId: number, updates: Partial<KanbanTask>) => void;
    onDelete: (taskId: number) => void;
}

/**
 * TaskDetailPanel - 태스크 상세 패널
 * 
 * 사이드 패널로 표시되며 태스크의 상세 정보를 편집할 수 있습니다.
 * - 제목, 설명 편집
 * - 담당자 변경
 * - 마감일 설정
 * - 우선순위 변경
 * - 체크리스트
 * - 댓글
 */

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    task,
    contacts,
    columns,
    onClose,
    onUpdate,
    onDelete
}) => {
    const [editedTask, setEditedTask] = useState(task);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    // 댓글 로드
    useEffect(() => {
        fetchComments();
    }, [task.id]);

    const fetchComments = async () => {
        setIsLoadingComments(true);
        const { data, error } = await kanbanService.getComments(task.id);
        if (!error && data) {
            setComments(data);
        }
        setIsLoadingComments(false);
    };

    // 자동 저장
    const handleUpdate = (updates: Partial<KanbanTask>) => {
        setEditedTask({ ...editedTask, ...updates });
        onUpdate(task.id, updates);
    };

    // 댓글 추가
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        const { data, error } = await kanbanService.addComment(task.id, 1, newComment);
        if (!error && data) {
            const newCommentItem: TaskComment = {
                id: data.id,
                taskId: data.task_id,
                authorId: data.author_id,
                author: data.author ? {
                    id: data.author.id,
                    name: data.author.name,
                    position: data.author.position,
                    department: data.author.department,
                    email: data.author.email,
                    phone: data.author.phone,
                    company: data.author.company,
                    group: data.author.group,
                    isVip: data.author.is_vip
                } : undefined,
                content: data.content,
                createdAt: data.created_at
            };
            setComments([...comments, newCommentItem]);
            setNewComment('');
        }
    };

    // 체크리스트 아이템 추가
    const handleAddChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: newChecklistItem.trim(),
            completed: false
        };
        
        const newChecklist = [...(editedTask.checklist || []), newItem];
        handleUpdate({ checklist: newChecklist });
        setNewChecklistItem('');
    };

    // 체크리스트 아이템 토글
    const handleToggleChecklistItem = (itemId: string) => {
        const newChecklist = (editedTask.checklist || []).map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        handleUpdate({ checklist: newChecklist });
    };

    // 체크리스트 아이템 삭제
    const handleDeleteChecklistItem = (itemId: string) => {
        const newChecklist = (editedTask.checklist || []).filter(item => item.id !== itemId);
        handleUpdate({ checklist: newChecklist });
    };

    // 우선순위 옵션
    const priorityOptions = [
        { value: 'urgent', label: '긴급', color: 'bg-red-500' },
        { value: 'high', label: '높음', color: 'bg-orange-500' },
        { value: 'medium', label: '보통', color: 'bg-blue-500' },
        { value: 'low', label: '낮음', color: 'bg-slate-400' }
    ];

    const currentColumn = columns.find(c => c.id === editedTask.columnId);

    return (
        <>
            {/* 배경 오버레이 */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
                onClick={onClose}
            />

            {/* 중앙 모달 */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
                {/* 헤더 */}
                <div className="h-14 px-6 flex items-center justify-between border-b border-slate-200 shrink-0 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: currentColumn?.color || '#6b7280' }}
                        />
                        <span className="text-sm text-slate-500">{currentColumn?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onDelete(task.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* 제목 */}
                        <input
                            type="text"
                            value={editedTask.title}
                            onChange={(e) => handleUpdate({ title: e.target.value })}
                            className="w-full text-xl font-bold text-slate-800 bg-transparent border-none outline-none focus:ring-0 placeholder-slate-300"
                            placeholder="태스크 제목"
                        />

                        {/* 메타 정보 그리드 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* 담당자 */}
                            <div className="relative">
                                <label className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <User size={12} /> 담당자
                                </label>
                                <button
                                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                    className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:border-blue-400 transition-colors text-left"
                                >
                                    {editedTask.assignee ? (
                                        <>
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                {editedTask.assignee.name[0]}
                                            </div>
                                            <span className="text-sm text-slate-700">{editedTask.assignee.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-slate-400">담당자 선택</span>
                                    )}
                                </button>

                                {showAssigneeDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                handleUpdate({ assigneeId: undefined, assignee: undefined });
                                                setShowAssigneeDropdown(false);
                                            }}
                                            className="w-full px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 text-left"
                                        >
                                            담당자 없음
                                        </button>
                                        {contacts.map(contact => (
                                            <button
                                                key={contact.id}
                                                onClick={() => {
                                                    handleUpdate({ assigneeId: contact.id, assignee: contact });
                                                    setShowAssigneeDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {contact.name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-700">{contact.name}</p>
                                                    <p className="text-[10px] text-slate-400">{contact.department}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 마감일 */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <Calendar size={12} /> 마감일
                                </label>
                                <input
                                    type="date"
                                    value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                                    onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
                                />
                            </div>

                            {/* 우선순위 */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> 우선순위
                                </label>
                                <select
                                    value={editedTask.priority}
                                    onChange={(e) => handleUpdate({ priority: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
                                >
                                    {priorityOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 컬럼 이동 */}
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                                    <Tag size={12} /> 상태
                                </label>
                                <select
                                    value={editedTask.columnId}
                                    onChange={(e) => handleUpdate({ columnId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
                                >
                                    {columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 설명 */}
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                                설명
                            </label>
                            <textarea
                                value={editedTask.description || ''}
                                onChange={(e) => handleUpdate({ description: e.target.value })}
                                placeholder="태스크에 대한 설명을 입력하세요..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm min-h-[80px] resize-none"
                            />
                        </div>

                        {/* 체크리스트 & 댓글 2열 레이아웃 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 체크리스트 */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <label className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1">
                                    <CheckSquare size={12} /> 체크리스트
                                </label>
                                <div className="space-y-2">
                                    {(editedTask.checklist || []).map(item => (
                                        <div key={item.id} className="flex items-center gap-2 group">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={() => handleToggleChecklistItem(item.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                {item.text}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteChecklistItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            type="text"
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                            placeholder="새 항목 추가..."
                                            className="flex-1 px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
                                        />
                                        <button
                                            onClick={handleAddChecklistItem}
                                            className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 댓글 */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <label className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-1">
                                    <MessageSquare size={12} /> 댓글
                                </label>
                                
                                {isLoadingComments ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="animate-spin text-slate-400" size={24} />
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                        {comments.length === 0 && (
                                            <p className="text-sm text-slate-400 text-center py-4">댓글이 없습니다</p>
                                        )}
                                        {comments.map(comment => (
                                            <div key={comment.id} className="flex gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                    {comment.author?.name[0] || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-slate-700">
                                                            {comment.author?.name || '알 수 없음'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {format(new Date(comment.createdAt), 'M/d HH:mm', { locale: ko })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-0.5">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 댓글 입력 */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        placeholder="댓글 작성..."
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim()}
                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 생성일 표시 */}
                <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1 shrink-0 rounded-b-2xl">
                    <Clock size={12} />
                    {task.createdAt && format(new Date(task.createdAt), 'yyyy년 M월 d일 HH:mm 생성', { locale: ko })}
                </div>
                </div>
            </div>
        </>
    );
};

export default TaskDetailPanel;

