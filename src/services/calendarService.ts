import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../types';

export const calendarService = {
    // 일정 목록 가져오기
    async getEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_date', { ascending: true });

        // DB의 snake_case를 camelCase로 변환
        const events = data?.map(event => ({
            id: event.id,
            title: event.title,
            startDate: new Date(event.start_date),
            endDate: new Date(event.end_date),
            type: event.type,
            color: event.color
        })) || [];

        return { data: events, error };
    },

    // 일정 추가
    async createEvent(event: Omit<CalendarEvent, 'id'>) {
        const dbEvent = {
            title: event.title,
            start_date: event.startDate.toISOString(),
            end_date: event.endDate.toISOString(),
            type: event.type,
            color: event.color
        };

        const { data, error } = await supabase
            .from('events')
            .insert([dbEvent])
            .select()
            .single();

        let newEvent: CalendarEvent | null = null;
        if (data) {
            newEvent = {
                id: data.id,
                title: data.title,
                startDate: new Date(data.start_date),
                endDate: new Date(data.end_date),
                type: data.type,
                color: data.color
            };
        }

        return { data: newEvent, error };
    },

    // 일정 수정
    async updateEvent(id: number, event: Partial<CalendarEvent>) {
        const dbEvent: any = {};
        if (event.title) dbEvent.title = event.title;
        if (event.startDate) dbEvent.start_date = event.startDate.toISOString();
        if (event.endDate) dbEvent.end_date = event.endDate.toISOString();
        if (event.type) dbEvent.type = event.type;
        if (event.color) dbEvent.color = event.color;

        const { data, error } = await supabase
            .from('events')
            .update(dbEvent)
            .eq('id', id)
            .select()
            .single();

        let updatedEvent: CalendarEvent | null = null;
        if (data) {
            updatedEvent = {
                id: data.id,
                title: data.title,
                startDate: new Date(data.start_date),
                endDate: new Date(data.end_date),
                type: data.type,
                color: data.color
            };
        }

        return { data: updatedEvent, error };
    },

    // 일정 삭제
    async deleteEvent(id: number) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        return { error };
    }
};
