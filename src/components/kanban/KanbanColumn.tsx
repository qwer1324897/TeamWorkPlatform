import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Trash2, Edit2, X } from 'lucide-react';
import { KanbanColumn, KanbanTask, ContactItem } from '../../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
    column: KanbanColumn;
    tasks: KanbanTask[];
    contacts: ContactItem[];
    isDragOver: boolean;
    onTaskClick: (task: KanbanTask) => void;
    onTaskCreate: (columnId: number, title: string) => void;
    onColumnUpdate: (columnId: number, updates: Partial<KanbanColumn>) => void;
    onColumnDelete: (columnId: number) => void;
    onDragStart: (e: React.DragEvent, task: KanbanTask) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

/**
 * KanbanColumn - 칸반 컬럼 컴포넌트
 * 
 * 컬럼 헤더 (이름, 태스크 수, 색상)
 * 태스크 카드 목록
 * 태스크 추가 버튼
 */

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
    column,
    tasks,
    contacts,
    isDragOver,
    onTaskClick,
    onTaskCreate,
    onColumnUpdate,
    onColumnDelete,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const [showMenu, setShowMenu] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 메뉴 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 이름 수정 시작 시 포커스
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSaveName = () => {
        if (editName.trim() && editName !== column.name) {
            onColumnUpdate(column.id, { name: editName.trim() });
        }
        setIsEditing(false);
    };

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            onTaskCreate(column.id, newTaskTitle.trim());
            setNewTaskTitle('');
            setIsAddingTask(false);
        }
    };

    // 색상 옵션
    const colorOptions = [
        { value: '#6b7280', label: '회색' },
        { value: '#3b82f6', label: '파랑' },
        { value: '#8b5cf6', label: '보라' },
        { value: '#10b981', label: '초록' },
        { value: '#f59e0b', label: '노랑' },
        { value: '#ef4444', label: '빨강' },
    ];

    return (
        <div
            className={`flex flex-col bg-slate-100/80 rounded-xl transition-all min-w-0 ${
                isDragOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''
            }`}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* 컬럼 헤더 */}
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 컬럼 색상 표시 */}
                    <div 
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: column.color }}
                    />
                    
                    {/* 컬럼 이름 */}
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') {
                                    setEditName(column.name);
                                    setIsEditing(false);
                                }
                            }}
                            className="flex-1 px-2 py-1 text-sm font-semibold bg-white rounded border border-blue-400 focus:outline-none"
                        />
                    ) : (
                        <h3 
                            className="font-semibold text-slate-700 truncate cursor-pointer hover:text-slate-900"
                            onClick={() => setIsEditing(true)}
                        >
                            {column.name}
                        </h3>
                    )}
                    
                    {/* 태스크 수 */}
                    <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
                        {tasks.length}
                    </span>
                </div>

                {/* 메뉴 버튼 */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden animate-scale-in">
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <Edit2 size={14} />
                                이름 변경
                            </button>
                            
                            {/* 색상 선택 */}
                            <div className="px-4 py-2 border-t border-slate-100">
                                <p className="text-xs font-medium text-slate-500 mb-2">컬럼 색상</p>
                                <div className="flex gap-1">
                                    {colorOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                onColumnUpdate(column.id, { color: opt.value });
                                            }}
                                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                                                column.color === opt.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                            }`}
                                            style={{ backgroundColor: opt.value }}
                                            title={opt.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onColumnDelete(column.id);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                            >
                                <Trash2 size={14} />
                                컬럼 삭제
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 태스크 목록 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-2 min-h-[200px]">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task)}
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                    />
                ))}

                {/* 빈 상태 드롭 영역 */}
                {tasks.length === 0 && isDragOver && (
                    <div className="h-24 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center justify-center">
                        <span className="text-sm text-blue-500">여기에 드롭</span>
                    </div>
                )}
            </div>

            {/* 태스크 추가 */}
            <div className="p-3 pt-0">
                {isAddingTask ? (
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTask();
                                if (e.key === 'Escape') {
                                    setIsAddingTask(false);
                                    setNewTaskTitle('');
                                }
                            }}
                            placeholder="태스크 제목"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-sm mb-2"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddTask}
                                className="flex-1 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                                추가
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingTask(false);
                                    setNewTaskTitle('');
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            >
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded-lg transition-all text-sm"
                    >
                        <Plus size={16} />
                        태스크 추가
                    </button>
                )}
            </div>
        </div>
    );
};

export default KanbanColumnComponent;

