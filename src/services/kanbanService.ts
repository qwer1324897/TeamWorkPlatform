import { supabase } from '../lib/supabase';
import { Project, KanbanColumn, KanbanTask, TaskComment, ActivityLog } from '../types';

/**
 * kanbanService
 * 
 * 칸반 보드 관련 모든 Supabase 데이터베이스 작업을 처리합니다.
 * 
 * 주요 기능:
 * - 프로젝트 CRUD
 * - 컬럼 CRUD
 * - 태스크 CRUD + 드래그앤드롭 위치 업데이트
 * - 댓글 CRUD
 * - 활동 로그 생성
 */

export const kanbanService = {
    // ========================================
    // 프로젝트 관련
    // ========================================

    /**
     * 프로젝트 목록 가져오기
     */
    async getProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        const projects: Project[] = data?.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            color: p.color,
            createdAt: p.created_at
        })) || [];

        return { data: projects, error };
    },

    /**
     * 프로젝트 생성
     */
    async createProject(project: Omit<Project, 'id' | 'createdAt'>) {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name: project.name,
                description: project.description,
                status: project.status || 'active',
                color: project.color || '#3b82f6'
            }])
            .select()
            .single();

        return { data, error };
    },

    /**
     * 프로젝트 수정
     */
    async updateProject(id: number, updates: Partial<Project>) {
        const { data, error } = await supabase
            .from('projects')
            .update({
                name: updates.name,
                description: updates.description,
                status: updates.status,
                color: updates.color
            })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * 프로젝트 삭제
     */
    async deleteProject(id: number) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // 컬럼 관련
    // ========================================

    /**
     * 프로젝트의 컬럼 목록 가져오기
     */
    async getColumns(projectId: number) {
        const { data, error } = await supabase
            .from('kanban_columns')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true });

        const columns: KanbanColumn[] = data?.map(c => ({
            id: c.id,
            projectId: c.project_id,
            name: c.name,
            color: c.color,
            position: c.position
        })) || [];

        return { data: columns, error };
    },

    /**
     * 컬럼 생성
     */
    async createColumn(column: Omit<KanbanColumn, 'id'>) {
        const { data, error } = await supabase
            .from('kanban_columns')
            .insert([{
                project_id: column.projectId,
                name: column.name,
                color: column.color || '#6b7280',
                position: column.position
            }])
            .select()
            .single();

        return { data, error };
    },

    /**
     * 컬럼 수정
     */
    async updateColumn(id: number, updates: Partial<KanbanColumn>) {
        const dbUpdates: Record<string, any> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.position !== undefined) dbUpdates.position = updates.position;

        const { data, error } = await supabase
            .from('kanban_columns')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * 컬럼 삭제
     */
    async deleteColumn(id: number) {
        const { error } = await supabase
            .from('kanban_columns')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // 태스크 관련
    // ========================================

    /**
     * 프로젝트의 모든 태스크 가져오기 (컬럼별로 그룹화)
     */
    async getTasks(projectId: number) {
        const { data, error } = await supabase
            .from('kanban_tasks')
            .select(`
                *,
                kanban_columns!inner(project_id),
                assignee:contacts(*)
            `)
            .eq('kanban_columns.project_id', projectId)
            .order('position', { ascending: true });

        const tasks: KanbanTask[] = data?.map(t => ({
            id: t.id,
            columnId: t.column_id,
            title: t.title,
            description: t.description,
            assigneeId: t.assignee_id,
            assignee: t.assignee ? {
                id: t.assignee.id,
                name: t.assignee.name,
                position: t.assignee.position,
                department: t.assignee.department,
                email: t.assignee.email,
                phone: t.assignee.phone,
                company: t.assignee.company,
                group: t.assignee.group,
                isVip: t.assignee.is_vip
            } : undefined,
            dueDate: t.due_date,
            priority: t.priority,
            position: t.position,
            tags: t.tags,
            checklist: t.checklist,
            createdAt: t.created_at
        })) || [];

        return { data: tasks, error };
    },

    /**
     * 태스크 생성
     */
    async createTask(task: Omit<KanbanTask, 'id' | 'createdAt'>) {
        const { data, error } = await supabase
            .from('kanban_tasks')
            .insert([{
                column_id: task.columnId,
                title: task.title,
                description: task.description,
                assignee_id: task.assigneeId,
                due_date: task.dueDate,
                priority: task.priority || 'medium',
                position: task.position,
                tags: task.tags || [],
                checklist: task.checklist || []
            }])
            .select(`
                *,
                assignee:contacts(*)
            `)
            .single();

        if (data) {
            const newTask: KanbanTask = {
                id: data.id,
                columnId: data.column_id,
                title: data.title,
                description: data.description,
                assigneeId: data.assignee_id,
                assignee: data.assignee ? {
                    id: data.assignee.id,
                    name: data.assignee.name,
                    position: data.assignee.position,
                    department: data.assignee.department,
                    email: data.assignee.email,
                    phone: data.assignee.phone,
                    company: data.assignee.company,
                    group: data.assignee.group,
                    isVip: data.assignee.is_vip
                } : undefined,
                dueDate: data.due_date,
                priority: data.priority,
                position: data.position,
                tags: data.tags,
                checklist: data.checklist,
                createdAt: data.created_at
            };
            return { data: newTask, error };
        }

        return { data: null, error };
    },

    /**
     * 태스크 수정
     */
    async updateTask(id: number, updates: Partial<KanbanTask>) {
        const dbUpdates: Record<string, any> = {};
        if (updates.columnId !== undefined) dbUpdates.column_id = updates.columnId;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId;
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.position !== undefined) dbUpdates.position = updates.position;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.checklist !== undefined) dbUpdates.checklist = updates.checklist;

        const { data, error } = await supabase
            .from('kanban_tasks')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * 태스크 이동 (드래그앤드롭)
     * 컬럼과 위치를 한 번에 업데이트
     */
    async moveTask(taskId: number, newColumnId: number, newPosition: number) {
        const { data, error } = await supabase
            .from('kanban_tasks')
            .update({
                column_id: newColumnId,
                position: newPosition
            })
            .eq('id', taskId)
            .select()
            .single();

        return { data, error };
    },

    /**
     * 여러 태스크의 위치 일괄 업데이트
     */
    async updateTaskPositions(updates: { id: number; position: number; columnId?: number }[]) {
        const promises = updates.map(update => {
            const dbUpdate: Record<string, any> = { position: update.position };
            if (update.columnId !== undefined) dbUpdate.column_id = update.columnId;
            
            return supabase
                .from('kanban_tasks')
                .update(dbUpdate)
                .eq('id', update.id);
        });

        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error).map(r => r.error);
        
        return { error: errors.length > 0 ? errors[0] : null };
    },

    /**
     * 태스크 삭제
     */
    async deleteTask(id: number) {
        const { error } = await supabase
            .from('kanban_tasks')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // 댓글 관련
    // ========================================

    /**
     * 태스크의 댓글 목록 가져오기
     */
    async getComments(taskId: number) {
        const { data, error } = await supabase
            .from('task_comments')
            .select(`
                *,
                author:contacts(*)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        const comments: TaskComment[] = data?.map(c => ({
            id: c.id,
            taskId: c.task_id,
            authorId: c.author_id,
            author: c.author ? {
                id: c.author.id,
                name: c.author.name,
                position: c.author.position,
                department: c.author.department,
                email: c.author.email,
                phone: c.author.phone,
                company: c.author.company,
                group: c.author.group,
                isVip: c.author.is_vip
            } : undefined,
            content: c.content,
            createdAt: c.created_at
        })) || [];

        return { data: comments, error };
    },

    /**
     * 댓글 추가
     */
    async addComment(taskId: number, authorId: number, content: string) {
        const { data, error } = await supabase
            .from('task_comments')
            .insert([{
                task_id: taskId,
                author_id: authorId,
                content
            }])
            .select(`
                *,
                author:contacts(*)
            `)
            .single();

        return { data, error };
    },

    /**
     * 댓글 삭제
     */
    async deleteComment(id: number) {
        const { error } = await supabase
            .from('task_comments')
            .delete()
            .eq('id', id);

        return { error };
    },

    // ========================================
    // 활동 로그 관련
    // ========================================

    /**
     * 활동 로그 생성
     */
    async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>) {
        const { data, error } = await supabase
            .from('activity_logs')
            .insert([{
                user_id: log.userId,
                action_type: log.actionType,
                target_type: log.targetType,
                target_id: log.targetId,
                description: log.description,
                metadata: log.metadata || {}
            }])
            .select()
            .single();

        return { data, error };
    },

    /**
     * 활동 로그 가져오기
     */
    async getActivityLogs(limit: number = 20) {
        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
                *,
                user:contacts(*)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        const logs: ActivityLog[] = data?.map(l => ({
            id: l.id,
            userId: l.user_id,
            user: l.user ? {
                id: l.user.id,
                name: l.user.name,
                position: l.user.position,
                department: l.user.department,
                email: l.user.email,
                phone: l.user.phone,
                company: l.user.company,
                group: l.user.group,
                isVip: l.user.is_vip
            } : undefined,
            actionType: l.action_type,
            targetType: l.target_type,
            targetId: l.target_id,
            description: l.description,
            metadata: l.metadata,
            createdAt: l.created_at
        })) || [];

        return { data: logs, error };
    }
};

