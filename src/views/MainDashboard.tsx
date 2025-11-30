import React from 'react';
import { 
  ArrowRight, Calendar as CalIcon, CheckSquare, Bell, Mail, 
  TrendingUp, Clock, Users, Sparkles, ChevronRight,
  FileText, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { ViewState } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

/**
 * MainDashboard - Material Design 3 스타일 대시보드
 * 
 * 데이터 시각화 + M3 카드 시스템 적용
 */

interface MainDashboardProps {
    user: string;
    onNavigate: (view: ViewState) => void;
}

// 주간 업무 통계 데이터
const weeklyData = [
  { name: '월', 메일: 12, 할일: 8, 회의: 3 },
  { name: '화', 메일: 19, 할일: 12, 회의: 5 },
  { name: '수', 메일: 15, 할일: 10, 회의: 4 },
  { name: '목', 메일: 22, 할일: 15, 회의: 6 },
  { name: '금', 메일: 18, 할일: 9, 회의: 3 },
  { name: '토', 메일: 5, 할일: 2, 회의: 0 },
  { name: '일', 메일: 3, 할일: 1, 회의: 0 },
];

// 할 일 현황 데이터
const todoStatusData = [
  { name: '완료', value: 12, color: '#16a34a' },
  { name: '진행중', value: 5, color: '#2563eb' },
  { name: '대기', value: 3, color: '#94a3b8' },
];

// 부서별 메일 데이터
const deptMailData = [
  { name: '마케팅', count: 23 },
  { name: '개발', count: 18 },
  { name: '영업', count: 15 },
  { name: '인사', count: 8 },
  { name: '기타', count: 12 },
];

const MainDashboard: React.FC<MainDashboardProps> = ({ user, onNavigate }) => {
    const today = new Date();
    const dateString = today.toLocaleDateString('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '좋은 아침이에요';
        if (hour < 18) return '좋은 오후예요';
        return '좋은 저녁이에요';
    };

    // 통계 카드 데이터
    const statsCards = [
        { 
            label: '새 메일', 
            value: 3, 
            change: '+2',
            trend: 'up',
            icon: Mail, 
            color: 'var(--md-sys-color-primary)',
            bgColor: 'var(--md-sys-color-primary-container)',
            onClick: () => onNavigate(ViewState.MAIL)
        },
        { 
            label: '오늘 할 일', 
            value: 5, 
            change: '-1',
            trend: 'down',
            icon: CheckSquare, 
            color: 'var(--md-sys-color-success)',
            bgColor: 'var(--md-sys-color-success-container)',
            onClick: () => onNavigate(ViewState.TODO)
        },
        { 
            label: '오늘 일정', 
            value: 2, 
            change: '0',
            trend: 'neutral',
            icon: CalIcon, 
            color: 'var(--md-sys-color-tertiary)',
            bgColor: 'var(--md-sys-color-tertiary-container)',
            onClick: () => onNavigate(ViewState.CALENDAR)
        },
        { 
            label: '새 공지', 
            value: 1, 
            change: '+1',
            trend: 'up',
            icon: Bell, 
            color: 'var(--md-sys-color-warning)',
            bgColor: 'var(--md-sys-color-warning-container)',
            onClick: () => onNavigate(ViewState.NOTICE)
        },
    ];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            
            {/* ========================================
                환영 헤더
            ======================================== */}
            <div className="card-elevated p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <p className="text-sm mb-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {dateString}
                        </p>
                        <h1 className="text-2xl lg:text-3xl font-semibold mb-1" 
                            style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            {getGreeting()}, <span style={{ color: 'var(--md-sys-color-primary)' }}>{user}</span>님
                        </h1>
                        <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            오늘도 행복한 하루 보내세요 ✨
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => onNavigate(ViewState.CALENDAR)}
                        className="btn-filled"
                    >
                        <CalIcon size={18} />
                        일정 확인
                    </button>
                </div>
            </div>

            {/* ========================================
                AI 비서 퀵 액세스
            ======================================== */}
            <button 
                onClick={() => onNavigate(ViewState.AI)}
                className="w-full card-outlined p-4 flex items-center gap-4 text-left group"
                style={{ borderColor: 'var(--md-sys-color-tertiary-container)' }}
            >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                     style={{ background: 'var(--md-sys-color-tertiary-container)' }}>
                    <Sparkles size={24} style={{ color: 'var(--md-sys-color-on-tertiary-container)' }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ 
                                  background: 'var(--md-sys-color-tertiary-container)',
                                  color: 'var(--md-sys-color-on-tertiary-container)'
                              }}>
                            AI 비서
                        </span>
                        <span className="w-2 h-2 rounded-full animate-pulse"
                              style={{ background: 'var(--md-sys-color-success)' }} />
                    </div>
                    <p className="truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        "오후 2시 회의록 요약해줘", "내일 일정 알려줘" 라고 물어보세요...
                    </p>
                </div>
                <ArrowRight size={20} 
                            className="group-hover:translate-x-1 transition-transform"
                            style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
            </button>

            {/* ========================================
                통계 카드
            ======================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <button
                            key={idx}
                            onClick={stat.onClick}
                            className="card-elevated p-5 text-left group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                     style={{ background: stat.bgColor }}>
                                    <Icon size={22} style={{ color: stat.color }} />
                                </div>
                                <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
                                    stat.trend === 'up' ? 'bg-green-50 text-green-600' :
                                    stat.trend === 'down' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {stat.trend === 'up' && <ArrowUpRight size={12} />}
                                    {stat.trend === 'down' && <ArrowDownRight size={12} />}
                                    {stat.change}
                                </div>
                            </div>
                            <p className="text-3xl font-bold mb-1"
                               style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {stat.value}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {stat.label}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* ========================================
                차트 섹션
            ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 주간 업무 통계 (Area Chart) */}
                <div className="lg:col-span-2 card-elevated p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-1"
                                style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                주간 업무 통계
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                이번 주 업무 현황을 한눈에 확인하세요
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ background: '#2563eb' }} />
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>메일</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ background: '#16a34a' }} />
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>할일</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ background: '#8b5cf6' }} />
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>회의</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="colorMail" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorTodo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ 
                                        background: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area type="monotone" dataKey="메일" stroke="#2563eb" fillOpacity={1} fill="url(#colorMail)" strokeWidth={2} />
                                <Area type="monotone" dataKey="할일" stroke="#16a34a" fillOpacity={1} fill="url(#colorTodo)" strokeWidth={2} />
                                <Area type="monotone" dataKey="회의" stroke="#8b5cf6" fillOpacity={0.1} fill="#8b5cf6" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 할 일 현황 (Pie Chart) */}
                <div className="card-elevated p-6">
                    <h3 className="text-lg font-semibold mb-1"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        할 일 현황
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        총 {todoStatusData.reduce((a, b) => a + b.value, 0)}건
                    </p>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={todoStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {todoStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {todoStatusData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs">
                                <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    {item.name} ({item.value})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ========================================
                하단 그리드
            ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 오늘 일정 */}
                <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold"
                            style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            오늘 일정
                        </h3>
                        <button 
                            onClick={() => onNavigate(ViewState.CALENDAR)}
                            className="btn-text text-sm py-1 px-2"
                        >
                            더보기 <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {[
                            { title: '주간 업무 보고', time: '10:00 - 11:30', color: '#2563eb' },
                            { title: '프로젝트 킥오프', time: '14:00 - 15:00', color: '#8b5cf6' },
                        ].map((event, idx) => (
                            <div key={idx} className="flex gap-3 p-3 rounded-xl"
                                 style={{ background: 'var(--md-sys-color-surface-1)' }}>
                                <div className="w-1 rounded-full" style={{ background: event.color }} />
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {event.title}
                                    </p>
                                    <p className="text-sm flex items-center gap-1"
                                       style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <Clock size={12} /> {event.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 최근 활동 */}
                <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold"
                            style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            최근 활동
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            { icon: Mail, text: '새 메일 수신', sub: '4분기 프로젝트 회고', time: '10분 전', color: '#2563eb' },
                            { icon: FileText, text: '문서 업로드', sub: '2025_사업계획.pdf', time: '1시간 전', color: '#16a34a' },
                            { icon: Users, text: '회의 예약', sub: '대회의실 A', time: '2시간 전', color: '#8b5cf6' },
                        ].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                         style={{ background: `${item.color}15` }}>
                                        <Icon size={18} style={{ color: item.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate"
                                           style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                            {item.text}
                                        </p>
                                        <p className="text-xs truncate"
                                           style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                            {item.sub}
                                        </p>
                                    </div>
                                    <span className="text-xs whitespace-nowrap"
                                          style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {item.time}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 부서별 메일 (Bar Chart) */}
                <div className="card-elevated p-6">
                    <h3 className="text-lg font-semibold mb-4"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        부서별 메일
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptMailData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={50} />
                                <Tooltip 
                                    contentStyle={{ 
                                        background: 'white', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ========================================
                공지사항 & 팀원
            ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 공지사항 */}
                <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold"
                            style={{ color: 'var(--md-sys-color-on-surface)' }}>
                            공지사항
                        </h3>
                        <button 
                            onClick={() => onNavigate(ViewState.NOTICE)}
                            className="btn-text text-sm py-1 px-2"
                        >
                            더보기 <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {[
                            { title: '[필독] 4분기 보안 점검 안내', important: true },
                            { title: '연말정산 시스템 오픈 일정', important: false },
                            { title: '사내 카페테리아 메뉴 개편', important: false },
                        ].map((notice, idx) => (
                            <div key={idx} 
                                 className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--md-sys-color-surface-1)]">
                                <span className={`w-2 h-2 rounded-full ${notice.important ? 'bg-red-500' : 'bg-gray-300'}`} />
                                <span className="flex-1 truncate"
                                      style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                    {notice.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 팀원 현황 */}
                <div className="card-elevated p-6">
                    <h3 className="text-lg font-semibold mb-4"
                        style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        팀원 현황
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { name: '연승민', role: '선임', status: 'online' },
                            { name: '강동훈', role: '수석', status: 'online' },
                            { name: '남여원', role: '선임', status: 'away' },
                            { name: '이민규', role: '사원', status: 'offline' },
                        ].map((member, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl"
                                 style={{ background: 'var(--md-sys-color-surface-1)' }}>
                                <div className="relative">
                                    <div className="avatar" style={{ 
                                        background: 'var(--md-sys-color-secondary-container)',
                                        color: 'var(--md-sys-color-on-secondary-container)'
                                    }}>
                                        {member.name[0]}
                                    </div>
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                        member.status === 'online' ? 'bg-green-500' :
                                        member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`} />
                                </div>
                                <div>
                                    <p className="font-medium text-sm"
                                       style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        {member.name}
                                    </p>
                                    <p className="text-xs"
                                       style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        {member.role}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainDashboard;
