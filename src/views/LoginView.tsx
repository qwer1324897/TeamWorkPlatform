import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * LoginView 컴포넌트
 * 
 * 서비스 소개와 로그인 기능을 제공하는 랜딩 페이지입니다.
 * 
 * 구조:
 * - Section 1: 히어로 섹션 - 메인 슬로건 + 동적 애니메이션 배경
 * - Section 2: 문제 제기 섹션 - 업무 비효율성 통계
 * - Section 3: 솔루션 섹션 - All-in-1 플랫폼 소개
 * - Section 4: AI 비서 섹션 - 핵심 기능 소개
 * - Section 5: 로그인 섹션 - 시작하기
 */

interface LoginViewProps {
    onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
    // 로그인 폼 상태 관리
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 로그인 처리 함수
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let loginEmail = email;
            if (!email.includes('@')) {
                loginEmail = `${email}@b2b.com`;
            }

            const { error } = await authService.signIn(loginEmail, password);

            if (error) {
                console.error('로그인 에러:', error);
                setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
            } else {
                onLoginSuccess();
            }
        } catch (err) {
            console.error('예상치 못한 에러:', err);
            setError('시스템 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-y-auto scroll-smooth relative">
            
            {/* ========================================
                글로벌 동적 배경 - 모든 섹션에 적용
            ======================================== */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {/* 메인 그라데이션 블롭들 - 움직이는 효과 */}
                <div className="absolute top-[10%] left-[5%] w-[700px] h-[700px] bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-[150px] animate-blob" />
                <div className="absolute top-[30%] right-[10%] w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[130px] animate-blob animation-delay-2000" />
                <div className="absolute top-[60%] left-[20%] w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 rounded-full blur-[120px] animate-blob animation-delay-4000" />
                <div className="absolute top-[80%] right-[5%] w-[550px] h-[550px] bg-gradient-to-r from-blue-600/15 to-purple-600/15 rounded-full blur-[140px] animate-blob animation-delay-3000" />
                <div className="absolute top-[120%] left-[10%] w-[600px] h-[600px] bg-gradient-to-r from-pink-500/15 to-orange-500/15 rounded-full blur-[130px] animate-blob animation-delay-1000" />
                <div className="absolute top-[150%] right-[15%] w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-[120px] animate-blob animation-delay-5000" />
                <div className="absolute top-[200%] left-[25%] w-[650px] h-[650px] bg-gradient-to-r from-violet-500/15 to-blue-500/15 rounded-full blur-[140px] animate-blob animation-delay-2000" />
                <div className="absolute top-[250%] right-[20%] w-[550px] h-[550px] bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 rounded-full blur-[130px] animate-blob animation-delay-4000" />
                <div className="absolute top-[300%] left-[15%] w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[120px] animate-blob animation-delay-3000" />
                
                {/* 플로팅 도형들 - 다양한 위치에 배치 */}
                <div className="absolute top-[5%] left-[8%] w-24 h-24 border border-cyan-500/30 rotate-45 animate-float" />
                <div className="absolute top-[15%] right-[12%] w-20 h-20 border-2 border-purple-500/25 rounded-full animate-float animation-delay-1000" />
                <div className="absolute top-[25%] left-[85%] w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-lg animate-float animation-delay-2000 rotate-12" />
                <div className="absolute top-[35%] right-[80%] w-28 h-28 border-2 border-pink-500/20 rounded-2xl animate-float animation-delay-3000 -rotate-12" />
                <div className="absolute top-[45%] left-[5%] w-10 h-10 bg-cyan-500/30 rounded-full animate-pulse" />
                <div className="absolute top-[55%] right-[6%] w-8 h-8 bg-purple-500/40 rounded-full animate-pulse animation-delay-1000" />
                <div className="absolute top-[65%] left-[90%] w-20 h-20 border border-indigo-500/30 rotate-45 animate-float animation-delay-4000" />
                <div className="absolute top-[75%] right-[88%] w-14 h-14 border-2 border-emerald-500/25 rounded-full animate-float animation-delay-2000" />
                <div className="absolute top-[85%] left-[7%] w-12 h-12 bg-gradient-to-br from-pink-500/20 to-transparent rounded-lg animate-float animation-delay-5000 rotate-45" />
                <div className="absolute top-[95%] right-[10%] w-6 h-6 bg-blue-500/30 rounded-full animate-pulse animation-delay-3000" />
                <div className="absolute top-[110%] left-[92%] w-18 h-18 border border-cyan-500/25 rounded-xl animate-float animation-delay-1000 rotate-12" />
                <div className="absolute top-[130%] right-[85%] w-10 h-10 bg-violet-500/30 rounded-full animate-pulse animation-delay-4000" />
                <div className="absolute top-[150%] left-[6%] w-22 h-22 border-2 border-purple-500/20 rotate-45 animate-float animation-delay-2000" />
                <div className="absolute top-[170%] right-[8%] w-16 h-16 border border-emerald-500/30 rounded-full animate-float animation-delay-5000" />
                
                {/* 그리드 패턴 오버레이 */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
                
                {/* 별 효과 */}
                <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-white/60 rounded-full animate-twinkle" />
                <div className="absolute top-[40%] right-[25%] w-1.5 h-1.5 bg-white/50 rounded-full animate-twinkle animation-delay-1000" />
                <div className="absolute top-[60%] left-[70%] w-1 h-1 bg-white/40 rounded-full animate-twinkle animation-delay-2000" />
                <div className="absolute top-[80%] right-[60%] w-1 h-1 bg-white/50 rounded-full animate-twinkle animation-delay-3000" />
                <div className="absolute top-[100%] left-[40%] w-1.5 h-1.5 bg-white/60 rounded-full animate-twinkle animation-delay-4000" />
                <div className="absolute top-[120%] right-[35%] w-1 h-1 bg-white/40 rounded-full animate-twinkle animation-delay-5000" />
            </div>

            {/* ========================================
                Section 1: 히어로 섹션
            ======================================== */}
            <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
                {/* 메인 슬로건 */}
                <div className="relative z-10 text-center px-4">
                    <div className="mb-10">
                        <Sparkles className="w-14 h-14 mx-auto text-cyan-400 animate-pulse" />
                    </div>
                    <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold tracking-tight">
                        <span className="text-white block mb-6">비즈니스의 모든 순간,</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-gradient">
                            AI가 협력합니다
                        </span>
                    </h1>
                </div>

                {/* 스크롤 인디케이터 */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-7 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                        <div className="w-1 h-2.5 bg-white/60 rounded-full animate-scroll-indicator" />
                    </div>
                    <p className="text-white/40 text-xs mt-3 text-center">스크롤하여 더 알아보기</p>
                </div>
            </section>

            {/* ========================================
                Section 2: 문제 제기 섹션
            ======================================== */}
            <section className="min-h-screen flex items-center justify-center relative py-24">
                <div className="container mx-auto px-4 z-10 text-center max-w-5xl">
                    <div className="space-y-8 mb-16">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                            <span className="text-white block mb-5">업무의 60%는</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                                단순 반복입니다
                            </span>
                        </h2>

                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            이메일 확인, 일정 관리, 문서 작성 및 결재…<br />
                            소중한 시간이 반복 작업에 쓰이고 있지 않나요?
                        </p>
                    </div>

                    {/* 통계 카드들 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="text-5xl lg:text-6xl font-bold text-red-400 mb-4">4.5시간</div>
                            <div className="text-base text-gray-300 font-medium">일 평균 반복 업무 시간</div>
                            <div className="text-sm text-gray-500 mt-2">하루의 절반 이상이 단순 작업에</div>
                        </div>
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="text-5xl lg:text-6xl font-bold text-orange-400 mb-4">15%</div>
                            <div className="text-base text-gray-300 font-medium">단순 실수로 인한 수정 소요</div>
                            <div className="text-sm text-gray-500 mt-2">오타, 누락 등 피할 수 있었던 실수들</div>
                        </div>
                        <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                            <div className="text-5xl lg:text-6xl font-bold text-purple-400 mb-4">0%</div>
                            <div className="text-base text-gray-300 font-medium">창의적 업무에 쓰는 시간</div>
                            <div className="text-sm text-gray-500 mt-2">정작 중요한 것엔 시간이 없다</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                Section 3: 솔루션 - All-in-1 플랫폼
            ======================================== */}
            <section className="min-h-screen flex items-center justify-center relative py-24">
                <div className="container mx-auto px-4 z-10 text-center max-w-4xl">
                    <div className="mb-6">
                        <span className="text-cyan-400 text-lg font-bold tracking-widest">01</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                            All-in-One 플랫폼
                        </span>
                    </h3>
                    <p className="text-2xl md:text-3xl text-white mb-4 font-medium">
                        메일, 일정, 미팅 및 협업
                    </p>
                    <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
                        흩어진 업무 도구들을 하나로.<br />
                        단일 플랫폼에서 모든 것을 관리하세요.
                    </p>

                    {/* 기능 아이콘 그리드 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-2xl mx-auto">
                        {['메일', '일정', '할 일', '메모', '연락처', '드라이브', '회의실', 'AI 비서'].map((item) => (
                            <div key={item} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1">
                                <div className="text-base font-bold text-white">{item}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                Section 4: 완벽한 AI 비서
            ======================================== */}
            <section className="min-h-screen flex items-center justify-center relative py-24">
                <div className="container mx-auto px-4 z-10 text-center max-w-4xl">
                    <div className="mb-6">
                        <span className="text-purple-400 text-lg font-bold tracking-widest">02</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            완벽한 AI 비서
                        </span>
                    </h3>
                    <p className="text-xl md:text-2xl text-white mb-6 font-medium leading-relaxed max-w-3xl mx-auto">
                        메일 확인, 일정 관리, 파일 정리,<br />
                        문서 작성 및 결재 요청…
                    </p>
                    <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        단순 반복 업무는 이제 AI 비서에게 맡기세요.<br />
                        자연어로 명령하면 AI가 즉시 처리합니다.
                    </p>

                    {/* AI 명령 예시 */}
                    <div className="mt-12 space-y-3 max-w-lg mx-auto">
                        {[
                            '"내일 오전 10시에 회의 잡아줘"',
                            '"이번 주 미완료 할 일 정리해줘"',
                            '"김태호님께 보고서 검토 요청 메일 보내줘"'
                        ].map((cmd, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-white/5 border border-purple-500/20 text-left hover:bg-white/10 transition-all">
                                <span className="text-purple-300 text-base font-medium">{cmd}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ========================================
                Section 5: 로그인 섹션
            ======================================== */}
            <section className="min-h-screen flex items-center justify-center relative py-24">
                <div className="container mx-auto px-4 z-10 text-center max-w-md">
                    <div className="mb-6">
                        <span className="text-green-400 text-lg font-bold tracking-widest">03</span>
                    </div>
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-400">
                            지금 바로 시작하세요
                        </span>
                    </h3>

                    {/* 로그인 폼 */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-white">로그인</h2>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* 아이디 입력 */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs text-gray-400 ml-1 font-medium">아이디 (이메일)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                                        placeholder="아이디를 입력하세요"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 비밀번호 입력 */}
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs text-gray-400 ml-1 font-medium">비밀번호</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm"
                                        placeholder="비밀번호를 입력하세요"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 에러 메시지 */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            {/* 로그인 버튼 */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 text-sm"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        시작하기 <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoginView;
