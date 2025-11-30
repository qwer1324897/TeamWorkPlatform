import React, { useState, useRef, useEffect } from 'react';
import { ViewState, User } from '../types';
import {
  Mail, Calendar, CheckSquare, HardDrive,
  Bell, MessageCircleQuestion, Bot, StickyNote,
  MapPin, Contact, Video, Layers, Search, LogOut, ChevronDown, Home
} from 'lucide-react';

/**
 * Layout 컴포넌트
 * 
 * 애플리케이션의 전체 레이아웃을 구성합니다.
 * 
 * 주요 기능:
 * - 헤더: 로고, 검색창, 사용자 프로필 (로그아웃 드롭다운)
 * - 네비게이션: 메뉴 탭
 * - 푸터: 이용약관, 저작권 정보
 */

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User;
  onLogout?: () => void;  // 로그아웃 핸들러 (선택적)
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, user, onLogout }) => {
  // 프로필 드롭다운 표시 여부
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // 드롭다운 ref (외부 클릭 감지용)
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // '홈' 메뉴를 제거하고 메일부터 시작하도록 수정
  const navItems = [
    { id: ViewState.MAIL, label: '메일', icon: Mail },
    { id: ViewState.CALENDAR, label: '일정', icon: Calendar },
    { id: ViewState.TODO, label: '할 일', icon: CheckSquare },
    { id: ViewState.MEMO, label: '메모', icon: StickyNote },
    { id: ViewState.MEETING_ROOM, label: '회의실', icon: MapPin },
    { id: ViewState.CONTACTS, label: '연락처', icon: Contact },
    { id: ViewState.MEETING, label: 'Meeting', icon: Video },
    { id: ViewState.DRIVE, label: 'Drive', icon: HardDrive },
    { id: ViewState.NOTICE, label: '공지사항', icon: Bell },
    { id: ViewState.QNA, label: 'Q&A', icon: MessageCircleQuestion },
    { id: ViewState.AI, label: 'AI', icon: Bot },
  ];

  /**
   * 드롭다운 외부 클릭 시 닫기
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * 로그아웃 처리
   */
  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800 selection:bg-blue-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-[1920px] mx-auto">
          <div className="h-16 px-6 flex items-center justify-between">
            {/* 로고 영역 */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => onNavigate(ViewState.MAIN)}
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
                <Layers size={22} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                비즈니스 업무 협업 플랫폼
              </span>
            </div>

            {/* 검색창 영역 */}
            <div className="hidden lg:flex items-center flex-1 max-w-lg mx-12">
              <div className="relative w-full group">
                <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="임직원, 메뉴, 파일 검색"
                  className="w-full bg-gray-100/80 border border-transparent focus:bg-white rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner hover:bg-gray-100"
                />
              </div>
            </div>

            {/* 사용자 프로필 영역 (로그아웃 드롭다운 포함) */}
            <div className="flex items-center space-x-6">
              <div className="relative" ref={profileMenuRef}>
                {/* 프로필 버튼 */}
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity py-2 px-3 rounded-xl hover:bg-gray-100"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800">{user.name} {user.position}</p>
                    <p className="text-xs text-slate-500 font-medium">{user.department}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200 shadow-sm ring-2 ring-white">
                    {user.name[0]}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* 프로필 드롭다운 메뉴 */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.position} · {user.department}</p>
                    </div>
                    
                    {/* 메뉴 항목 */}
                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); onNavigate(ViewState.MAIN); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                      >
                        <Home size={16} className="text-slate-400" />
                        <span>홈으로</span>
                      </button>
                      
                      {/* 로그아웃 버튼 */}
                      {onLogout && (
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>로그아웃</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 네비게이션 탭 */}
          <div className="px-6 pb-0 overflow-x-auto no-scrollbar">
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    px-4 py-3 flex items-center space-x-2 text-sm font-medium transition-all relative whitespace-nowrap rounded-t-lg
                    group
                    ${currentView === item.id
                      ? 'text-blue-600 bg-blue-50/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50/80'}
                  `}
                >
                  <item.icon
                    size={18}
                    className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}
                    strokeWidth={currentView === item.id ? 2.5 : 2}
                  />
                  <span>{item.label}</span>
                  {currentView === item.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full shadow-[0_-2px_6px_rgba(37,99,235,0.4)] animate-fade-in" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 animate-fade-in">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-[1920px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <div className="flex gap-6 mb-4 md:mb-0 font-medium">
            <span className="hover:text-slate-600 cursor-pointer transition-colors">이용약관</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">개인정보처리방침</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">운영정책</span>
          </div>
          <p>Copyright 2025 Business Collaboration Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
