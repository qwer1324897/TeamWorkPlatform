import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Calendar, CheckSquare, StickyNote, Trash2, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService';

/**
 * AIView 컴포넌트
 * 
 * AI 비서 채팅 인터페이스를 제공합니다.
 * 
 * 주요 기능:
 * - 자연어 명령 처리 (일정/할일/메모 추가)
 * - 일반 대화
 * - 추천 명령어 표시
 * - 대화 히스토리
 */

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isCommand?: boolean;
}

// 추천 명령어 목록
const suggestedCommands = [
    { icon: Calendar, text: '내일 오후 2시에 팀 미팅 일정 추가해줘', color: 'text-blue-500 bg-blue-50' },
    { icon: CheckSquare, text: '금요일까지 보고서 작성 할 일 추가해줘', color: 'text-green-500 bg-green-50' },
    { icon: StickyNote, text: '프로젝트 아이디어 메모 저장해줘', color: 'text-yellow-500 bg-yellow-50' },
    { icon: Calendar, text: '이번 주 일정 알려줘', color: 'text-purple-500 bg-purple-50' },
];

const AIView: React.FC = () => {
    // 메시지 목록
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            role: 'assistant',
            content: '안녕하세요! 👋 AI 비서입니다.\n\n일정, 할 일, 메모 관리를 도와드릴게요. 아래 예시처럼 말씀해주세요:\n\n• "내일 오후 3시에 회의 일정 추가해줘"\n• "금요일까지 보고서 작성 할 일 추가해줘"\n• "아이디어 메모 저장해줘"\n\n무엇을 도와드릴까요?',
            timestamp: new Date()
        }
    ]);
    // 입력 메시지
    const [inputMessage, setInputMessage] = useState('');
    // 로딩 상태
    const [isLoading, setIsLoading] = useState(false);
    // 메시지 목록 스크롤 ref
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * 메시지 목록 자동 스크롤
     */
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * 메시지 전송 처리
     */
    const handleSend = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const { response, command } = await aiService.sendMessage(inputMessage);

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                isCommand: command?.action !== 'chat'
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: '⚠️ 죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    /**
     * 추천 명령어 클릭 핸들러
     */
    const handleSuggestedCommand = (command: string) => {
        setInputMessage(command);
        inputRef.current?.focus();
    };

    /**
     * 대화 초기화
     */
    const handleClearChat = () => {
        setMessages([{
            id: Date.now(),
            role: 'assistant',
            content: '안녕하세요! 👋 AI 비서입니다.\n\n무엇을 도와드릴까요?',
            timestamp: new Date()
        }]);
    };

    /**
     * Enter 키 처리
     */
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /**
     * 시간 포맷팅
     */
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            {/* ========================================
                메인 채팅 영역
            ======================================== */}
            <div className="flex-1 flex flex-col relative">
                {/* 배경 효과 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                </div>

                {/* 헤더 */}
                <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 backdrop-blur-sm bg-black/20 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-lg flex items-center gap-2">
                                AI 비서 <Sparkles size={16} className="text-yellow-400" />
                            </h2>
                            <p className="text-xs text-slate-400">일정, 할 일, 메모를 관리해드려요</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="대화 초기화"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>

                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 relative z-10">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-start gap-4 animate-fade-in-up ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* 아바타 */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                message.role === 'assistant' 
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-purple-500/30' 
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                            }`}>
                                {message.role === 'assistant' ? (
                                    <Bot size={20} className="text-white" />
                                ) : (
                                    <User size={20} className="text-white" />
                                )}
                            </div>

                            {/* 메시지 버블 */}
                            <div className={`max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-4 rounded-2xl shadow-lg ${
                                    message.role === 'assistant'
                                        ? message.isCommand
                                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-white'
                                            : 'bg-white/10 backdrop-blur-md border border-white/10 text-white'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed text-sm">
                                        {message.content}
                                    </p>
                                </div>
                                <span className={`text-[10px] text-slate-500 mt-1 block ${message.role === 'user' ? 'text-right' : ''}`}>
                                    {formatTime(message.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* 로딩 표시 */}
                    {isLoading && (
                        <div className="flex items-start gap-4 animate-fade-in">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-4 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin text-blue-400" size={16} />
                                    <span className="text-slate-300 text-sm">생각하는 중...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* 추천 명령어 */}
                {messages.length <= 2 && (
                    <div className="px-8 pb-4 relative z-10">
                        <p className="text-xs text-slate-500 mb-3 font-medium">💡 이렇게 말해보세요</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedCommands.map((cmd, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestedCommand(cmd.text)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/80 hover:text-white transition-all group"
                                >
                                    <cmd.icon size={14} className={`${cmd.color.split(' ')[0]} group-hover:scale-110 transition-transform`} />
                                    <span className="truncate max-w-[200px]">{cmd.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 입력 영역 */}
                <div className="p-6 border-t border-white/10 backdrop-blur-sm bg-black/20 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="메시지를 입력하세요... (예: 내일 회의 일정 추가해줘)"
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-14"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!inputMessage.trim() || isLoading}
                            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={22} />
                            ) : (
                                <Send size={22} />
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 text-center">
                        AI 비서가 일정, 할 일, 메모 관리를 도와드립니다. • Powered by Gemini
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIView;
