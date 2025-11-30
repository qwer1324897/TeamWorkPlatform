import { GoogleGenerativeAI } from '@google/generative-ai';
import { calendarService } from './calendarService';
import { todoService } from './todoService';
import { memoService } from './memoService';
import { addDays, addWeeks, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, setHours, setMinutes, format } from 'date-fns';

/**
 * aiService
 * 
 * AI 비서 기능을 제공하는 서비스입니다.
 * Google Gemini API를 사용하여 자연어 명령을 처리합니다.
 * 
 * 주요 기능:
 * - 자연어 명령 파싱 (일정/할일/메모 추가/수정/삭제)
 * - 날짜 인식 (오늘, 내일, 모레, 금요일, 3일 뒤, 7월 1일 등)
 * - DB 연동 (Supabase)
 * - 일반 대화 응답
 */

// API 키 (요청사항: 하드코딩)
const GEMINI_API_KEY = 'AIzaSyCEpThf5hPpPolZYE_xoHeOmW2r95Iv6Zw';

// Gemini 모델 초기화 (요청사항: gemini-pro → gemini-1.5-flash)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * 명령 파싱 결과 타입
 */
interface ParsedCommand {
    action: 'add' | 'update' | 'delete' | 'list' | 'chat';  // 액션 타입
    entity: 'event' | 'todo' | 'memo' | null;               // 엔티티 타입
    title?: string;                                          // 제목
    date?: Date;                                             // 날짜
    time?: string;                                           // 시간
    content?: string;                                        // 내용
    originalMessage: string;                                 // 원본 메시지
}

/**
 * 한국어 날짜 표현을 Date 객체로 변환
 * 
 * 지원하는 표현:
 * - 오늘, 내일, 모레
 * - 월요일, 화요일, ... 일요일
 * - 다음 주 월요일
 * - 3일 뒤, 1주일 뒤
 * - 7월 1일, 12월 25일
 * - 2025년 1월 15일
 */
function parseKoreanDate(text: string): Date | null {
    const now = new Date();
    const lowerText = text.toLowerCase();

    // 오늘, 내일, 모레
    if (lowerText.includes('오늘')) return now;
    if (lowerText.includes('내일')) return addDays(now, 1);
    if (lowerText.includes('모레')) return addDays(now, 2);

    // 요일 (이번 주)
    const dayMap: Record<string, () => Date> = {
        '월요일': () => nextMonday(now),
        '화요일': () => nextTuesday(now),
        '수요일': () => nextWednesday(now),
        '목요일': () => nextThursday(now),
        '금요일': () => nextFriday(now),
        '토요일': () => nextSaturday(now),
        '일요일': () => nextSunday(now),
    };

    for (const [day, getDate] of Object.entries(dayMap)) {
        if (lowerText.includes(day)) {
            return getDate();
        }
    }

    // N일 뒤, N일 후
    const daysLaterMatch = lowerText.match(/(\d+)\s*(일|days?)\s*(뒤|후)/);
    if (daysLaterMatch) {
        return addDays(now, parseInt(daysLaterMatch[1]));
    }

    // N주 뒤, N주일 뒤
    const weeksLaterMatch = lowerText.match(/(\d+)\s*(주|주일|weeks?)\s*(뒤|후)/);
    if (weeksLaterMatch) {
        return addWeeks(now, parseInt(weeksLaterMatch[1]));
    }

    // M월 D일 형식 (예: 7월 1일, 12월 25일)
    const monthDayMatch = lowerText.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1; // 0-indexed
        const day = parseInt(monthDayMatch[2]);
        const result = new Date(now.getFullYear(), month, day);
        // 이미 지난 날짜면 내년으로
        if (result < now) {
            result.setFullYear(result.getFullYear() + 1);
        }
        return result;
    }

    // YYYY년 M월 D일 형식
    const fullDateMatch = lowerText.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (fullDateMatch) {
        return new Date(
            parseInt(fullDateMatch[1]),
            parseInt(fullDateMatch[2]) - 1,
            parseInt(fullDateMatch[3])
        );
    }

    return null;
}

/**
 * 시간 문자열 파싱 (예: "10시", "오후 3시", "14:30")
 */
function parseTime(text: string): { hours: number; minutes: number } | null {
    // 오전/오후 N시 형식
    const ampmMatch = text.match(/(오전|오후)\s*(\d{1,2})\s*시\s*(\d{1,2})?\s*(분)?/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[2]);
        const minutes = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;
        if (ampmMatch[1] === '오후' && hours < 12) hours += 12;
        if (ampmMatch[1] === '오전' && hours === 12) hours = 0;
        return { hours, minutes };
    }

    // N시 M분 형식
    const timeMatch = text.match(/(\d{1,2})\s*시\s*(\d{1,2})?\s*(분)?/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        return { hours, minutes };
    }

    // HH:MM 형식
    const colonMatch = text.match(/(\d{1,2}):(\d{2})/);
    if (colonMatch) {
        return {
            hours: parseInt(colonMatch[1]),
            minutes: parseInt(colonMatch[2])
        };
    }

    return null;
}

/**
 * 자연어 명령을 파싱하여 구조화된 데이터로 변환
 */
function parseCommand(message: string): ParsedCommand {
    const lowerMessage = message.toLowerCase();

    // 기본 결과 (일반 대화)
    const result: ParsedCommand = {
        action: 'chat',
        entity: null,
        originalMessage: message
    };

    // 액션 감지
    const addKeywords = ['추가', '등록', '만들', '생성', '잡아', '넣어'];
    const deleteKeywords = ['삭제', '지워', '취소', '제거'];
    const listKeywords = ['보여', '알려', '뭐', '조회'];

    let detectedAction: 'add' | 'delete' | 'list' | null = null;
    for (const keyword of addKeywords) {
        if (lowerMessage.includes(keyword)) {
            detectedAction = 'add';
            break;
        }
    }
    if (!detectedAction) {
        for (const keyword of deleteKeywords) {
            if (lowerMessage.includes(keyword)) {
                detectedAction = 'delete';
                break;
            }
        }
    }
    if (!detectedAction) {
        for (const keyword of listKeywords) {
            if (lowerMessage.includes(keyword)) {
                detectedAction = 'list';
                break;
            }
        }
    }

    if (!detectedAction) return result;

    result.action = detectedAction;

    // 엔티티 감지
    if (lowerMessage.includes('일정') || lowerMessage.includes('회의') || lowerMessage.includes('미팅') || lowerMessage.includes('약속')) {
        result.entity = 'event';
    } else if (lowerMessage.includes('할일') || lowerMessage.includes('할 일') || lowerMessage.includes('업무') || lowerMessage.includes('태스크')) {
        result.entity = 'todo';
    } else if (lowerMessage.includes('메모') || lowerMessage.includes('노트')) {
        result.entity = 'memo';
    }

    if (!result.entity) return { ...result, action: 'chat' };

    // 날짜 파싱
    const parsedDate = parseKoreanDate(message);
    if (parsedDate) {
        result.date = parsedDate;
    }

    // 시간 파싱
    const parsedTime = parseTime(message);
    if (parsedTime && result.date) {
        result.date = setHours(result.date, parsedTime.hours);
        result.date = setMinutes(result.date, parsedTime.minutes);
        result.time = `${parsedTime.hours}:${String(parsedTime.minutes).padStart(2, '0')}`;
    }

    // 제목 추출 (따옴표 안의 텍스트 또는 마지막 명사구)
    const quotedMatch = message.match(/['""](.+?)['""]|['"](.+?)['"]/);
    if (quotedMatch) {
        result.title = quotedMatch[1] || quotedMatch[2];
    } else {
        // 간단한 제목 추출 (날짜/시간/액션 키워드 제거 후)
        let title = message;
        // 날짜 관련 단어 제거
        title = title.replace(/오늘|내일|모레|월요일|화요일|수요일|목요일|금요일|토요일|일요일/g, '');
        title = title.replace(/\d+\s*(일|주|월|년)\s*(뒤|후)/g, '');
        title = title.replace(/\d+월\s*\d+일/g, '');
        // 시간 관련 제거
        title = title.replace(/(오전|오후)?\s*\d+시(\s*\d+분)?/g, '');
        title = title.replace(/\d+:\d+/g, '');
        // 액션/엔티티 키워드 제거
        title = title.replace(/일정|회의|미팅|약속|할일|할 일|메모|추가|등록|만들|생성|잡아|넣어|해줘|해 줘|에/g, '');
        title = title.trim();
        if (title.length > 2) {
            result.title = title;
        }
    }

    return result;
}

/**
 * 파싱된 명령을 실행하여 DB에 반영
 */
async function executeCommand(command: ParsedCommand): Promise<string> {
    try {
        if (command.action === 'add') {
            if (command.entity === 'event') {
                // 일정 추가
                if (!command.title) {
                    return '일정 제목을 알려주세요. 예: "내일 오후 2시에 팀 미팅 일정 추가해줘"';
                }
                const startDate = command.date || new Date();
                const endDate = addDays(startDate, 0); // 같은 날 종료
                
                const { error } = await calendarService.createEvent({
                    title: command.title,
                    startDate: startDate,
                    endDate: endDate,
                    type: 'personal',
                    color: 'bg-blue-100 text-blue-700 border-l-4 border-blue-600'
                });

                if (error) throw error;

                const dateStr = format(startDate, 'M월 d일 HH:mm');
                return `✅ 일정이 추가되었습니다!\n\n📅 **${command.title}**\n⏰ ${dateStr}`;
            }

            if (command.entity === 'todo') {
                // 할 일 추가
                if (!command.title) {
                    return '할 일 내용을 알려주세요. 예: "금요일까지 보고서 작성 할 일 추가해줘"';
                }
                const dueDate = command.date || addDays(new Date(), 1);

                const { error } = await todoService.createTodo({
                    title: command.title,
                    dueDate: format(dueDate, "yyyy-MM-dd'T'HH:mm"),
                    status: '대기',
                    priority: '중',
                    project: '기타',
                    assignee: '나',
                    description: ''
                });

                if (error) throw error;

                const dateStr = format(dueDate, 'M월 d일');
                return `✅ 할 일이 추가되었습니다!\n\n📝 **${command.title}**\n📆 마감일: ${dateStr}`;
            }

            if (command.entity === 'memo') {
                // 메모 추가
                const title = command.title || '새 메모';
                const content = command.content || command.originalMessage;

                const { error } = await memoService.createMemo({
                    title: title,
                    content: content,
                    tags: [],
                    isPinned: false
                });

                if (error) throw error;

                return `✅ 메모가 저장되었습니다!\n\n📝 **${title}**`;
            }
        }

        if (command.action === 'list') {
            if (command.entity === 'event') {
                const { data } = await calendarService.getEvents();
                if (!data || data.length === 0) {
                    return '등록된 일정이 없습니다.';
                }
                const upcoming = data.slice(0, 5);
                let response = '📅 **다가오는 일정**\n\n';
                upcoming.forEach(event => {
                    response += `• ${event.title} - ${format(event.startDate, 'M/d HH:mm')}\n`;
                });
                return response;
            }

            if (command.entity === 'todo') {
                const { data } = await todoService.getTodos();
                if (!data || data.length === 0) {
                    return '등록된 할 일이 없습니다.';
                }
                const pending = data.filter(t => t.status !== '완료').slice(0, 5);
                let response = '📝 **진행 중인 할 일**\n\n';
                pending.forEach(todo => {
                    response += `• ${todo.title}\n`;
                });
                return response;
            }
        }

        // 일반 대화로 처리
        return '';
    } catch (error) {
        console.error('명령 실행 오류:', error);
        return '⚠️ 명령 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
}

export const aiService = {
    /**
     * AI 메시지 전송 및 응답 받기
     * 
     * 1. 자연어 명령 파싱 시도
     * 2. 명령이면 DB에 반영하고 결과 반환
     * 3. 일반 대화면 Gemini API로 응답 생성
     */
    async sendMessage(message: string) {
        try {
            // 1. 명령 파싱
            const command = parseCommand(message);

            // 2. 명령 실행 (add, delete, list 등)
            if (command.action !== 'chat' && command.entity) {
                const result = await executeCommand(command);
                if (result) {
                    return { response: result, command };
                }
            }

            // 3. 일반 대화 - Gemini API 호출
            const systemPrompt = `당신은 "AI 비서"입니다. 비즈니스 협업 플랫폼에서 사용자를 도와주는 친절한 AI 어시스턴트입니다.
            
            다음과 같은 업무를 도와줄 수 있습니다:
            - 일정 관리 (추가/조회/삭제)
            - 할 일 관리 (추가/조회/삭제)
            - 메모 작성
            - 업무 관련 질문 답변
            
            항상 친절하고 전문적으로 응답해주세요. 한국어로 응답해주세요.`;

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: '안녕하세요! AI 비서입니다. 일정, 할 일, 메모 관리를 도와드리겠습니다. 무엇을 도와드릴까요?' }],
                    },
                ],
            });

            const result = await chat.sendMessage(message);
            const response = result.response.text();

            return { response, command: null };
        } catch (error: any) {
            console.error('AI 서비스 오류:', error);
            
            // API 에러 메시지 처리
            if (error.message?.includes('404')) {
                return { 
                    response: '⚠️ AI 모델 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
                    command: null
                };
            }

            return { 
                response: '⚠️ 죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
                command: null
            };
        }
    }
};

export default aiService;
