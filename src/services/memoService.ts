import { supabase } from '../lib/supabase';
import { MemoItem } from '../types';

/**
 * memoService
 * 
 * 메모 관련 모든 Supabase 데이터베이스 작업을 처리합니다.
 * 
 * 주요 기능:
 * - 메모 CRUD (생성, 조회, 수정, 삭제)
 * - 메모 고정(pin) 기능
 * - 태그 관리
 */

export const memoService = {
    /**
     * 메모 목록 가져오기
     * updated_at이 없는 경우 created_at 사용
     */
    async getMemos() {
        const { data, error } = await supabase
            .from('memos')
            .select('*')
            .order('created_at', { ascending: false });

        // DB의 snake_case를 camelCase로 변환
        const memos: MemoItem[] = data?.map(memo => ({
            id: memo.id,
            title: memo.title || '',
            content: memo.content || '',
            tags: memo.tags || [],
            // updated_at이 없으면 created_at 또는 현재 날짜 사용
            updatedAt: memo.updated_at 
                ? new Date(memo.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
                : memo.created_at 
                    ? new Date(memo.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
                    : new Date().toLocaleDateString('ko-KR'),
            isPinned: memo.is_pinned || false,
            group: memo.group || '기본 그룹'  // 하위 호환성
        })) || [];

        return { data: memos, error };
    },

    /**
     * 메모 추가
     * tags는 빈 배열이어도 가능
     */
    async createMemo(memo: Omit<MemoItem, 'id' | 'updatedAt'>) {
        const now = new Date().toISOString();
        
        const dbMemo = {
            title: memo.title || '제목 없음',
            content: memo.content || '',
            tags: memo.tags || [],
            is_pinned: memo.isPinned || false,
            updated_at: now,
            // group 컬럼도 저장 (하위 호환성)
            group: memo.group || (memo.tags && memo.tags[0]) || '기본 그룹'
        };

        const { data, error } = await supabase
            .from('memos')
            .insert([dbMemo])
            .select()
            .single();

        if (error) {
            console.error('메모 생성 에러:', error);
            return { data: null, error };
        }

        let newMemo: MemoItem | null = null;
        if (data) {
            newMemo = {
                id: data.id,
                title: data.title || '',
                content: data.content || '',
                tags: data.tags || [],
                updatedAt: data.updated_at 
                    ? new Date(data.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
                    : new Date().toLocaleDateString('ko-KR'),
                isPinned: data.is_pinned || false,
                group: data.group || '기본 그룹'
            };
        }

        return { data: newMemo, error: null };
    },

    /**
     * 메모 수정
     */
    async updateMemo(id: number, memo: Partial<MemoItem>) {
        const dbMemo: Record<string, any> = {};
        
        if (memo.title !== undefined) dbMemo.title = memo.title;
        if (memo.content !== undefined) dbMemo.content = memo.content;
        if (memo.tags !== undefined) dbMemo.tags = memo.tags;
        if (memo.isPinned !== undefined) dbMemo.is_pinned = memo.isPinned;
        if (memo.group !== undefined) dbMemo.group = memo.group;
        
        // 수정 시 항상 updated_at 갱신
        dbMemo.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('memos')
            .update(dbMemo)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('메모 수정 에러:', error);
            return { data: null, error };
        }

        let updatedMemo: MemoItem | null = null;
        if (data) {
            updatedMemo = {
                id: data.id,
                title: data.title || '',
                content: data.content || '',
                tags: data.tags || [],
                updatedAt: data.updated_at 
                    ? new Date(data.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
                    : new Date().toLocaleDateString('ko-KR'),
                isPinned: data.is_pinned || false,
                group: data.group || '기본 그룹'
            };
        }

        return { data: updatedMemo, error: null };
    },

    /**
     * 메모 삭제
     */
    async deleteMemo(id: number) {
        const { error } = await supabase
            .from('memos')
            .delete()
            .eq('id', id);

        return { error };
    }
};
