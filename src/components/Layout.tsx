import React, { useState, useRef, useEffect } from 'react';
import { ViewState, User } from '../types';
import {
  Mail, Calendar, CheckSquare, HardDrive,
  Bell, MessageCircleQuestion, Bot, StickyNote,
  MapPin, Contact, Video, Layers, Search, LogOut, 
  ChevronDown, Home, Menu, X, Sparkles, Clock, FileText, Check
} from 'lucide-react';

/**
 * Layout 컴포넌트 - Material Design 3 스타일
 * 화려한 그라데이션 배경 + 컬러풀한 요소
 */

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User;
  onLogout?: () => void;
}

const sampleNotifications = [
  { id: 1, type: 'mail', title: '새 메일이 도착했습니다', sub: '김태호님으로부터', time: '5분 전', read: false },
  { id: 2, type: 'calendar', title: '회의가 곧 시작됩니다', sub: '주간 업무 보고 (10:00)', time: '30분 전', read: false },
  { id: 3, type: 'todo', title: '마감일이 다가옵니다', sub: '프로젝트 기획안 제출', time: '1시간 전', read: true },
  { id: 4, type: 'notice', title: '새 공지사항', sub: '4분기 보안 점검 안내', time: '2시간 전', read: true },
];

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: ViewState.MAIN, label: '홈', icon: Home },
    { id: ViewState.MAIL, label: '메일', icon: Mail, badge: 3 },
    { id: ViewState.CALENDAR, label: '일정', icon: Calendar },
    { id: ViewState.TODO, label: '할 일', icon: CheckSquare, badge: 5 },
    { id: ViewState.MEMO, label: '메모', icon: StickyNote },
    { id: ViewState.MEETING_ROOM, label: '회의실', icon: MapPin },
    { id: ViewState.CONTACTS, label: '연락처', icon: Contact },
    { id: ViewState.MEETING, label: 'Meeting', icon: Video },
    { id: ViewState.DRIVE, label: 'Drive', icon: HardDrive },
    { id: ViewState.NOTICE, label: '공지', icon: Bell },
    { id: ViewState.QNA, label: 'Q&A', icon: MessageCircleQuestion },
    { id: ViewState.AI, label: 'AI 비서', icon: Bot, special: true },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    onLogout?.();
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mail': return Mail;
      case 'calendar': return Calendar;
      case 'todo': return CheckSquare;
      case 'notice': return Bell;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'mail': return '#2563eb';
      case 'calendar': return '#7c3aed';
      case 'todo': return '#16a34a';
      case 'notice': return '#f59e0b';
      default: return '#2563eb';
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      
      {/* ========================================
          화려한 배경 디자인
      ======================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 메인 그라데이션 배경 */}
        <div className="absolute inset-0" 
             style={{ 
               background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 25%, #fff1f2 50%, #f0fdfa 75%, #fffbeb 100%)'
             }} />
        
        {/* 애니메이션 블롭들 */}
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-40 animate-blob"
             style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 animate-blob animation-delay-2000"
             style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[20%] w-[800px] h-[800px] rounded-full opacity-35 animate-blob animation-delay-4000"
             style={{ background: 'radial-gradient(circle, #fda4af 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[500px] rounded-full opacity-25 animate-blob animation-delay-3000"
             style={{ background: 'radial-gradient(circle, #86efac 0%, transparent 70%)' }} />
        
        {/* 플로팅 도형들 */}
        <div className="absolute top-[15%] right-[25%] w-20 h-20 border-2 border-blue-200 rounded-2xl rotate-12 opacity-40 animate-float" />
        <div className="absolute top-[45%] left-[10%] w-16 h-16 border-2 border-purple-200 rounded-full opacity-30 animate-float animation-delay-1000" />
        <div className="absolute bottom-[25%] right-[15%] w-24 h-24 border-2 border-pink-200 rounded-3xl -rotate-12 opacity-35 animate-float animation-delay-2000" />
        <div className="absolute top-[70%] left-[25%] w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl rotate-45 opacity-50 animate-float animation-delay-3000" />
        
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 opacity-[0.015]"
             style={{
               backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)',
               backgroundSize: '40px 40px'
             }} />
      </div>

      {/* ========================================
          Navigation Rail (좌측 사이드바) - 아이콘 제거
      ======================================== */}
      <aside className="hidden lg:flex flex-col w-20 bg-white/70 backdrop-blur-xl border-r border-white/50 fixed h-full z-40 shadow-lg">
        {/* 바로 네비게이션 시작 - 상단 패딩만 */}
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-1 px-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative w-full flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all
                    ${isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30' 
                      : 'hover:bg-white/80'
                    }
                    ${item.special ? 'mt-4' : ''}
                  `}
                  title={item.label}
                >
                  <div className={`relative w-14 h-8 flex items-center justify-center rounded-2xl transition-all`}
                       style={{ color: isActive ? '#ffffff' : '#64748b' }}>
                    <Icon size={20} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {item.special && !isActive && (
                      <Sparkles size={10} className="absolute -top-0.5 -right-0.5 text-purple-500" />
                    )}
                  </div>
                  <span className={`text-[11px] font-medium leading-none ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl animate-slide-in-left shadow-2xl">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">비즈니스 협업</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
            <nav className="p-3">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-1 transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ========================================
          메인 콘텐츠 영역
      ======================================== */}
      <div className="flex-1 flex flex-col lg:ml-20 relative z-10">
        
        {/* Top App Bar - 프로필 완전 우측 */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/50 flex items-center px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          
          {/* 모바일 메뉴 */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-3 rounded-xl hover:bg-white/80 transition-colors"
          >
            <Menu size={22} className="text-slate-700" />
          </button>
          
          {/* 프로젝트 타이틀 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Layers size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
              비즈니스 업무 협업 플랫폼
            </h1>
          </div>

          {/* 검색창 - 가운데 */}
          <div className="flex-1 flex justify-center mx-4 lg:mx-8">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="메뉴, 연락처, 파일 검색"
                className="w-full py-2.5 pl-11 pr-4 rounded-full bg-white/80 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* 우측 - 알림 + 프로필 */}
          <div className="flex items-center gap-3">
            
            {/* 알림 */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl hover:bg-white/80 transition-colors"
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden animate-scale-in bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-100">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">알림</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.map((notif) => {
                      const Icon = getNotificationIcon(notif.type);
                      const iconColor = getNotificationColor(notif.type);
                      return (
                        <div key={notif.id} className={`p-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: `${iconColor}15` }}>
                              <Icon size={18} style={{ color: iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!notif.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{notif.sub}</p>
                              <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                            </div>
                            {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <button className="w-full text-center text-sm font-medium py-2 rounded-xl hover:bg-slate-50 text-blue-600 transition-colors">
                      모든 알림 보기
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* 프로필 */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full hover:bg-white/80 transition-colors border border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {user.name[0]}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name} {user.position}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user.department}</p>
                </div>
                <ChevronDown size={16} className={`hidden md:block text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden animate-scale-in bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-100">
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.position} · {user.department}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setShowProfileMenu(false); onNavigate(ViewState.MAIN); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
                      <Home size={18} className="text-slate-400" />
                      <span>홈으로</span>
                    </button>
                    {onLogout && (
                      <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={18} />
                        <span>로그아웃</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="py-6 px-4 lg:px-6 border-t border-white/50 bg-white/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div className="flex gap-6">
              <span className="hover:text-slate-700 cursor-pointer transition-colors">이용약관</span>
              <span className="hover:text-slate-700 cursor-pointer transition-colors">개인정보처리방침</span>
              <span className="hover:text-slate-700 cursor-pointer transition-colors">운영정책</span>
            </div>
            <p>© 2025 비즈니스 업무 협업 플랫폼. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
