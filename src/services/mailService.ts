import { supabase } from '../lib/supabase';
import { MailItem } from '../types';

/**
 * mailService
 * 
 * 메일 관련 모든 Supabase 데이터베이스 작업을 처리합니다.
 * 컴포넌트에서 직접 Supabase를 호출하지 않고, 이 서비스를 통해 처리합니다.
 * 
 * 주요 기능:
 * - 메일 목록 조회 (폴더별)
 * - 메일 상세 조회
 * - 메일 전송 (DB에 저장)
 * - 메일 상태 변경 (읽음, 중요, 폴더 이동)
 * - 메일 삭제
 */

export const mailService = {
    /**
     * 메일 목록 가져오기
     * 
     * @param category - 조회할 폴더 타입 ('inbox' | 'sent' | 'trash' | 'important')
     * @returns 메일 목록 배열과 에러 객체
     * 
     * 사용 예시:
     * const { data, error } = await mailService.getMails('inbox');
     */
    async getMails(category: 'inbox' | 'sent' | 'trash' | 'important' = 'inbox') {
        // 기본 쿼리: mails 테이블에서 모든 필드 선택, 생성일 기준 내림차순 정렬
        let query = supabase
            .from('mails')
            .select('*')
            .order('created_at', { ascending: false });

        // 카테고리에 따라 필터 조건 추가
        if (category === 'inbox') {
            // 받은 메일함: folder가 'inbox'인 것만
            query = query.eq('folder', 'inbox');
        } else if (category === 'sent') {
            // 보낸 메일함: folder가 'sent'인 것만
            query = query.eq('folder', 'sent');
        } else if (category === 'trash') {
            // 휴지통: folder가 'trash'인 것만
            query = query.eq('folder', 'trash');
        } else if (category === 'important') {
            // 중요 메일: is_important가 true인 것만
            query = query.eq('is_important', true);
        }

        const { data, error } = await query;

        // DB 데이터를 프론트엔드 타입(MailItem)으로 변환
        // snake_case → camelCase 변환
        const mails: MailItem[] = data?.map(mail => ({
            id: mail.id,
            folder: mail.folder,
            sender: mail.sender,
            senderEmail: mail.sender_email,
            title: mail.title,
            content: mail.content || '',
            preview: mail.preview || mail.content?.substring(0, 50) + '...',
            date: formatDate(mail.created_at),
            isRead: mail.is_read,
            tag: mail.tag,
            isImportant: mail.is_important,
            hasAttachment: mail.has_attachment,
            isVip: mail.is_vip,
            isMentioned: mail.is_mentioned
        })) || [];

        return { data: mails, error };
    },

    /**
     * 메일 상세 조회
     * 
     * @param id - 조회할 메일의 ID
     * @returns 단일 메일 객체와 에러 객체
     */
    async getMail(id: number) {
        const { data, error } = await supabase
            .from('mails')
            .select('*')
            .eq('id', id)
            .single();

        let mail: MailItem | null = null;
        if (data) {
            mail = {
                id: data.id,
                folder: data.folder,
                sender: data.sender,
                senderEmail: data.sender_email,
                title: data.title,
                content: data.content,
                preview: data.preview,
                date: formatDate(data.created_at),
                isRead: data.is_read,
                tag: data.tag,
                isImportant: data.is_important,
                hasAttachment: data.has_attachment,
                isVip: data.is_vip,
                isMentioned: data.is_mentioned
            };
        }

        return { data: mail, error };
    },

    /**
     * 메일 보내기 (DB에 저장)
     * 
     * 실제 이메일 전송이 아닌, DB에 'sent' 폴더로 메일을 저장합니다.
     * 시연용으로 가상의 메일 시스템을 구현한 것입니다.
     * 
     * @param mail - 전송할 메일 데이터 (recipient: 받는 사람, title: 제목, content: 내용)
     * @returns 저장된 메일 데이터와 에러 객체
     */
    async sendMail(mail: { sender: string; title: string; content: string }) {
        // DB에 저장할 메일 데이터 구성
        // 주의: mails 테이블에는 recipient 컬럼이 없으므로,
        // 보낸 메일함에서는 sender 필드에 "나 → 받는사람" 형식으로 저장
        const dbMail = {
            sender: `나 → ${mail.sender}`,           // 발신자 → 수신자 형식
            sender_email: 'th.kim@b2b.com',          // 발신자 이메일
            title: mail.title,                       // 제목
            content: mail.content,                   // 본문
            preview: mail.content ? mail.content.substring(0, 100) : '', // 미리보기 (본문 앞 100자)
            folder: 'sent',                          // 폴더: 보낸 메일함
            is_read: true,                           // 보낸 메일은 읽음 처리
            is_important: false,                     // 기본값: 중요하지 않음
            has_attachment: false,                   // 기본값: 첨부파일 없음
            is_vip: false,                           // 기본값
            tag: '업무'                              // 기본 태그
        };

        const { data, error } = await supabase
            .from('mails')
            .insert([dbMail])
            .select()
            .single();

        return { data, error };
    },

    /**
     * 메일 상태 변경
     * 
     * 메일의 읽음/중요/폴더 상태를 변경합니다.
     * 
     * @param id - 변경할 메일의 ID
     * @param updates - 변경할 필드들 (isRead, isImportant, folder 중 일부)
     * @returns 에러 객체
     * 
     * 사용 예시:
     * // 읽음 처리
     * await mailService.updateMailStatus(1, { isRead: true });
     * 
     * // 중요 표시
     * await mailService.updateMailStatus(1, { isImportant: true });
     * 
     * // 휴지통으로 이동
     * await mailService.updateMailStatus(1, { folder: 'trash' });
     */
    async updateMailStatus(id: number, updates: Partial<MailItem>) {
        // camelCase → snake_case 변환
        const dbUpdates: Record<string, any> = {};
        if (updates.isRead !== undefined) dbUpdates.is_read = updates.isRead;
        if (updates.isImportant !== undefined) dbUpdates.is_important = updates.isImportant;
        if (updates.folder !== undefined) dbUpdates.folder = updates.folder;

        const { error } = await supabase
            .from('mails')
            .update(dbUpdates)
            .eq('id', id);

        return { error };
    },

    /**
     * 메일 삭제 (완전 삭제)
     * 
     * 메일을 DB에서 완전히 삭제합니다.
     * 휴지통으로 이동이 아닌 영구 삭제입니다.
     * 
     * @param id - 삭제할 메일의 ID
     * @returns 에러 객체
     */
    async deleteMail(id: number) {
        const { error } = await supabase
            .from('mails')
            .delete()
            .eq('id', id);

        return { error };
    },

    /**
     * 메일을 휴지통으로 이동
     * 
     * 완전 삭제가 아닌 휴지통으로 이동합니다.
     * 
     * @param id - 이동할 메일의 ID
     * @returns 에러 객체
     */
    async moveToTrash(id: number) {
        return this.updateMailStatus(id, { folder: 'trash' });
    }
};

/**
 * 날짜 포맷팅 헬퍼 함수
 * 
 * ISO 날짜 문자열을 사용자 친화적인 형식으로 변환합니다.
 * - 오늘: 시간만 표시 (예: 14:30)
 * - 올해: 월/일만 표시 (예: 11/22)
 * - 작년 이전: 연/월/일 표시 (예: 2024/11/22)
 * 
 * @param dateString - ISO 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // 오늘이면 시간만 표시
    if (mailDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // 올해면 월/일만 표시
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
    
    // 작년 이전이면 연/월/일 표시
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}
