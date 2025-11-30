import { supabase } from '../lib/supabase';
import { ContactItem } from '../types';

/**
 * contactService
 * 
 * 연락처 관련 모든 Supabase 데이터베이스 작업을 처리합니다.
 * 
 * 주요 기능:
 * - 연락처 CRUD (생성, 조회, 수정, 삭제)
 * - 연락처 검색
 * - VIP 토글
 * 
 * 주의: DB 컬럼은 snake_case (is_vip), 프론트엔드는 camelCase (isVip)
 */

export const contactService = {
    /**
     * 연락처 목록 가져오기
     * DB의 snake_case를 camelCase로 변환
     */
    async getContacts() {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('name', { ascending: true });

        // snake_case → camelCase 변환
        const contacts: ContactItem[] = data?.map(contact => ({
            id: contact.id,
            name: contact.name || '',
            position: contact.position || '',
            department: contact.department || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            group: contact.group || '팀원',
            isVip: contact.is_vip || false  // DB: is_vip → 프론트: isVip
        })) || [];

        return { data: contacts, error };
    },

    /**
     * 연락처 검색
     */
    async searchContacts(query: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .or(`name.ilike.%${query}%,department.ilike.%${query}%,company.ilike.%${query}%`)
            .order('name', { ascending: true });

        // snake_case → camelCase 변환
        const contacts: ContactItem[] = data?.map(contact => ({
            id: contact.id,
            name: contact.name || '',
            position: contact.position || '',
            department: contact.department || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            group: contact.group || '팀원',
            isVip: contact.is_vip || false
        })) || [];

        return { data: contacts, error };
    },

    /**
     * 연락처 추가
     * camelCase → snake_case 변환하여 DB에 저장
     */
    async createContact(contact: Omit<ContactItem, 'id'>) {
        const dbContact = {
            name: contact.name,
            position: contact.position,
            department: contact.department,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            group: contact.group,
            is_vip: contact.isVip || false  // 프론트: isVip → DB: is_vip
        };

        const { data, error } = await supabase
            .from('contacts')
            .insert([dbContact])
            .select()
            .single();

        let newContact: ContactItem | null = null;
        if (data) {
            newContact = {
                id: data.id,
                name: data.name || '',
                position: data.position || '',
                department: data.department || '',
                email: data.email || '',
                phone: data.phone || '',
                company: data.company || '',
                group: data.group || '팀원',
                isVip: data.is_vip || false
            };
        }

        return { data: newContact, error };
    },

    /**
     * 연락처 수정
     * camelCase → snake_case 변환하여 DB에 저장
     */
    async updateContact(id: number, contact: Partial<ContactItem>) {
        // camelCase → snake_case 변환
        const dbContact: Record<string, any> = {};
        
        if (contact.name !== undefined) dbContact.name = contact.name;
        if (contact.position !== undefined) dbContact.position = contact.position;
        if (contact.department !== undefined) dbContact.department = contact.department;
        if (contact.email !== undefined) dbContact.email = contact.email;
        if (contact.phone !== undefined) dbContact.phone = contact.phone;
        if (contact.company !== undefined) dbContact.company = contact.company;
        if (contact.group !== undefined) dbContact.group = contact.group;
        if (contact.isVip !== undefined) dbContact.is_vip = contact.isVip;  // 핵심: isVip → is_vip

        const { data, error } = await supabase
            .from('contacts')
            .update(dbContact)
            .eq('id', id)
            .select()
            .single();

        let updatedContact: ContactItem | null = null;
        if (data) {
            updatedContact = {
                id: data.id,
                name: data.name || '',
                position: data.position || '',
                department: data.department || '',
                email: data.email || '',
                phone: data.phone || '',
                company: data.company || '',
                group: data.group || '팀원',
                isVip: data.is_vip || false
            };
        }

        return { data: updatedContact, error };
    },

    /**
     * 연락처 삭제
     */
    async deleteContact(id: number) {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        return { error };
    },

    /**
     * VIP 상태 토글
     * 편의 함수로 VIP 상태만 변경
     */
    async toggleVip(id: number, currentVipStatus: boolean) {
        return this.updateContact(id, { isVip: !currentVipStatus });
    }
};
