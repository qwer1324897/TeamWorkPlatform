import React, { useState } from 'react';
import { KanbanColumn, KanbanTask, ContactItem } from '../../types';
import KanbanColumnComponent from './KanbanColumn';

interface KanbanBoardProps {
    columns: KanbanColumn[];
    tasks: KanbanTask[];
    contacts: ContactItem[];
    getTasksByColumn: (columnId: number) => KanbanTask[];
    onTaskMove: (taskId: number, sourceColumnId: number, destinationColumnId: number, newPosition: number) => void;
    onTaskClick: (task: KanbanTask) => void;
    onTaskCreate: (columnId: number, title: string) => void;
    onColumnUpdate: (columnId: number, updates: Partial<KanbanColumn>) => void;
    onColumnDelete: (columnId: number) => void;
}

/**
 * KanbanBoard - 칸반 보드 컴포넌트
 * 
 * 컬럼들을 가로로 배치하고, 드래그앤드롭을 관리합니다.
 */

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    columns,
    tasks,
    contacts,
    getTasksByColumn,
    onTaskMove,
    onTaskClick,
    onTaskCreate,
    onColumnUpdate,
    onColumnDelete
}) => {
    const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);

    // 드래그 시작
    const handleDragStart = (e: React.DragEvent, task: KanbanTask) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    // 드래그 종료
    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        setDraggedTask(null);
        setDragOverColumnId(null);
    };

    // 컬럼 위에 드래그
    const handleDragOver = (e: React.DragEvent, columnId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumnId(columnId);
    };

    // 드롭
    const handleDrop = (e: React.DragEvent, columnId: number) => {
        e.preventDefault();
        
        if (draggedTask && draggedTask.columnId !== columnId) {
            const tasksInColumn = getTasksByColumn(columnId);
            const newPosition = tasksInColumn.length;
            onTaskMove(draggedTask.id, draggedTask.columnId, columnId, newPosition);
        }
        
        setDraggedTask(null);
        setDragOverColumnId(null);
    };

    const sortedColumns = columns.sort((a, b) => a.position - b.position);

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar">
            <div 
                className="grid h-full gap-4 px-1"
                style={{ 
                    gridTemplateColumns: `repeat(${sortedColumns.length}, minmax(240px, 1fr))` 
                }}
            >
                {sortedColumns.map(column => (
                    <KanbanColumnComponent
                        key={column.id}
                        column={column}
                        tasks={getTasksByColumn(column.id)}
                        contacts={contacts}
                        isDragOver={dragOverColumnId === column.id}
                        onTaskClick={onTaskClick}
                        onTaskCreate={onTaskCreate}
                        onColumnUpdate={onColumnUpdate}
                        onColumnDelete={onColumnDelete}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDrop={(e) => handleDrop(e, column.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
