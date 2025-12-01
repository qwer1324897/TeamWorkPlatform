import React from 'react';
import { Calendar, User, AlertCircle, CheckSquare } from 'lucide-react';
import { KanbanTask } from '../../types';

interface TaskCardProps {
    task: KanbanTask;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

/**
 * TaskCard - 칸반 태스크 카드 컴포넌트
 * 
 * 드래그 가능한 태스크 카드를 렌더링합니다.
 * - 제목, 태그, 담당자, 마감일, 우선순위 표시
 * - 체크리스트 진행률 표시
 */

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onClick,
    onDragStart,
    onDragEnd
}) => {
    // 우선순위 스타일
    const priorityStyles: Record<string, { color: string; bgColor: string; label: string }> = {
        urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: '긴급' },
        high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: '높음' },
        medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: '보통' },
        low: { color: 'text-slate-500', bgColor: 'bg-slate-100', label: '낮음' }
    };

    const priority = priorityStyles[task.priority] || priorityStyles.medium;

    // 마감일 포맷팅
    const formatDueDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        const formatted = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        
        if (diffDays < 0) return { text: formatted, isOverdue: true };
        if (diffDays === 0) return { text: '오늘', isOverdue: false };
        if (diffDays <= 3) return { text: formatted, isNear: true };
        return { text: formatted };
    };

    const dueDate = formatDueDate(task.dueDate);

    // 체크리스트 진행률
    const checklistProgress = task.checklist && task.checklist.length > 0
        ? {
            completed: task.checklist.filter(item => item.completed).length,
            total: task.checklist.length
          }
        : null;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
        >
            {/* 태그 */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {task.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600"
                        >
                            {tag}
                        </span>
                    ))}
                    {task.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-400">
                            +{task.tags.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* 제목 */}
            <h4 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {task.title}
            </h4>

            {/* 메타 정보 */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 우선순위 */}
                    {task.priority !== 'medium' && (
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${priority.bgColor} ${priority.color}`}>
                            <AlertCircle size={10} />
                            {priority.label}
                        </span>
                    )}

                    {/* 마감일 */}
                    {dueDate && (
                        <span className={`flex items-center gap-1 text-[11px] ${
                            dueDate.isOverdue ? 'text-red-500 font-medium' : 
                            dueDate.isNear ? 'text-orange-500' : 'text-slate-500'
                        }`}>
                            <Calendar size={10} />
                            {dueDate.text}
                        </span>
                    )}

                    {/* 체크리스트 진행률 */}
                    {checklistProgress && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <CheckSquare size={10} />
                            {checklistProgress.completed}/{checklistProgress.total}
                        </span>
                    )}
                </div>

                {/* 담당자 */}
                {task.assignee && (
                    <div 
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        title={task.assignee.name}
                    >
                        {task.assignee.name[0]}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;

