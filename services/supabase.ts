import { createClient } from '@supabase/supabase-js';

// process 객체 타입 선언 (TypeScript 에러 방지)
declare const process: any;

// Vite config에서 define된 process.env 값을 사용
// 값이 없을 경우 앱 크래시를 방지하기 위해 placeholder 값을 사용 (실제 데이터 호출 시에는 에러 발생하겠지만 앱은 켜짐)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is missing. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);