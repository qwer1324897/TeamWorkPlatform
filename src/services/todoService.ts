import { supabase } from '../lib/supabase';
import { TodoItem } from '../types';

/**
 * todoService
 * 
 * 할 일 관련 모든 Supabase 데이터베이스 작업을 처리합니다.
 * 
 * 주요 기능:
 * - 할 일 CRUD (생성, 조회, 수정, 삭제)
 * - 휴지통 기능 (is_deleted 컬럼 사용)
 * - 복구 기능
 */

export const todoService = {
    /**
     * 할 일 목록 가져오기
     * 모든 할 일을 가져옵니다 (삭제된 것 포함 - UI에서 필터링)
     */
    async getTodos() {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('due_date', { ascending: true });

        // DB의 snake_case를 camelCase로 변환
        const todos: TodoItem[] = data?.map(todo => ({
            id: todo.id,
            title: todo.title,
            description: todo.description || '',
            project: todo.project || '기타',
            dueDate: todo.due_date || '',
            status: todo.status || '대기',
            priority: todo.priority || '중',
            assignee: todo.assignee || '나',
            isDeleted: todo.is_deleted || false  // 휴지통 상태
        })) || [];

        return { data: todos, error };
    },

    /**
     * 할 일 추가
     */
    async createTodo(todo: Omit<TodoItem, 'id'>) {
        const dbTodo = {
            title: todo.title,
            description: todo.description || '',
            project: todo.project || '기타',
            due_date: todo.dueDate,
            status: todo.status || '대기',
            priority: todo.priority || '중',
            assignee: todo.assignee || '나',
            is_deleted: false  // 새 할 일은 삭제되지 않은 상태
        };

        const { data, error } = await supabase
            .from('todos')
            .insert([dbTodo])
            .select()
            .single();

        let newTodo: TodoItem | null = null;
        if (data) {
            newTodo = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                project: data.project || '기타',
                dueDate: data.due_date || '',
                status: data.status || '대기',
                priority: data.priority || '중',
                assignee: data.assignee || '나',
                isDeleted: data.is_deleted || false
            };
        }

        return { data: newTodo, error };
    },

    /**
     * 할 일 수정
     * isDeleted 필드도 수정 가능 (휴지통 이동/복구)
     */
    async updateTodo(id: number, todo: Partial<TodoItem>) {
        const dbTodo: Record<string, any> = {};
        
        if (todo.title !== undefined) dbTodo.title = todo.title;
        if (todo.description !== undefined) dbTodo.description = todo.description;
        if (todo.project !== undefined) dbTodo.project = todo.project;
        if (todo.dueDate !== undefined) dbTodo.due_date = todo.dueDate;
        if (todo.status !== undefined) dbTodo.status = todo.status;
        if (todo.priority !== undefined) dbTodo.priority = todo.priority;
        if (todo.assignee !== undefined) dbTodo.assignee = todo.assignee;
        if (todo.isDeleted !== undefined) dbTodo.is_deleted = todo.isDeleted;  // 휴지통 상태

        const { data, error } = await supabase
            .from('todos')
            .update(dbTodo)
            .eq('id', id)
            .select()
            .single();

        let updatedTodo: TodoItem | null = null;
        if (data) {
            updatedTodo = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                project: data.project || '기타',
                dueDate: data.due_date || '',
                status: data.status || '대기',
                priority: data.priority || '중',
                assignee: data.assignee || '나',
                isDeleted: data.is_deleted || false
            };
        }

        return { data: updatedTodo, error };
    },

    /**
     * 휴지통으로 이동 (소프트 삭제)
     * is_deleted를 true로 설정
     */
    async moveToTrash(id: number) {
        return this.updateTodo(id, { isDeleted: true });
    },

    /**
     * 휴지통에서 복구
     * is_deleted를 false로 설정
     */
    async restoreFromTrash(id: number) {
        return this.updateTodo(id, { isDeleted: false });
    },

    /**
     * 할 일 영구 삭제 (완전 삭제)
     * DB에서 레코드를 완전히 제거합니다
     */
    async deleteTodo(id: number) {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        return { error };
    }
};
