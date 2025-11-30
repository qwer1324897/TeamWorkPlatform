import { supabase } from '../lib/supabase';
import { MeetingRoomItem } from '../types';

export const meetingService = {
    // 회의실 목록 가져오기 (예약 현황 포함)
    async getMeetingRooms(date: string) {
        // 1. 회의실 목록 조회
        const { data: rooms, error: roomsError } = await supabase
            .from('meeting_rooms')
            .select('*')
            .order('name', { ascending: true });

        if (roomsError) return { error: roomsError };

        // 2. 해당 날짜의 예약 목록 조회
        const { data: reservations, error: reservationsError } = await supabase
            .from('meeting_reservations')
            .select('*')
            .eq('date', date);

        if (reservationsError) return { error: reservationsError };

        // 3. 데이터 병합
        const meetingRooms: MeetingRoomItem[] = rooms?.map(room => {
            const roomReservations = reservations?.filter(r => r.room_id === room.id) || [];
            const timeSlots = roomReservations.map(r => r.time_slot);

            // 현재 시간 기준으로 상태 결정 (단순화: 예약이 꽉 차면 '사용중', 아니면 '사용가능')
            // 실제로는 현재 시간과 비교해야 함
            const isFull = timeSlots.length >= 9; // 9 to 18 (9 hours)
            const status = isFull ? '사용중' : '사용가능';

            return {
                id: room.id,
                name: room.name,
                capacity: room.capacity,
                location: room.location,
                equipment: room.equipment || [],
                status: status,
                currentMeeting: null, // 현재 진행중인 회의 정보는 시간 비교 로직 필요 (생략)
                nextMeeting: null, // 다음 회의 정보 (생략)
                reservations: timeSlots
            };
        }) || [];

        return { data: meetingRooms, error: null };
    },

    // 회의실 예약하기
    async reserveMeetingRoom(roomId: number, date: string, timeSlot: string, title: string, organizer: string) {
        const { data, error } = await supabase
            .from('meeting_reservations')
            .insert([{
                room_id: roomId,
                date: date,
                time_slot: timeSlot,
                title: title,
                organizer: organizer
            }])
            .select()
            .single();

        return { data, error };
    },

    // 내 예약 목록 가져오기
    async getMyReservations(organizer: string) {
        const { data, error } = await supabase
            .from('meeting_reservations')
            .select(`
        *,
        meeting_rooms (name)
      `)
            .eq('organizer', organizer)
            .order('date', { ascending: false });

        return { data, error };
    }
};
