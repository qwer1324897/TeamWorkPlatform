import { supabase } from '../lib/supabase';

export const authService = {
    // 로그인
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    // 로그아웃
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // 현재 세션 가져오기
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },

    // 사용자 정보 가져오기
    async getUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    }
};
