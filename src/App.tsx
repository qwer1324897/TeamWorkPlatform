import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import MainDashboard from './views/MainDashboard';
import MailView from './views/MailView';
import CalendarView from './views/CalendarView';
import TodoView from './views/TodoView';
import MemoView from './views/MemoView';
import MeetingRoomView from './views/MeetingRoomView';
import ContactView from './views/ContactView';
import MeetingView from './views/MeetingView';
import DriveView from './views/DriveView';
import NoticeView from './views/NoticeView';
import QnaView from './views/QnaView';
import AIView from './views/AIView';
import KanbanView from './views/KanbanView';
import LoginView from './views/LoginView';
import { ViewState, User } from './types';
import { Session } from '@supabase/supabase-js';

/**
 * App 컴포넌트
 * 
 * 애플리케이션의 루트 컴포넌트입니다.
 * 
 * 주요 기능:
 * - Supabase 인증 세션 관리
 * - 사용자 정보를 DB에서 가져오기 (contacts 테이블)
 * - 뷰 라우팅
 * - 로그아웃 처리
 */

function App() {
  // 세션 상태
  const [session, setSession] = useState<Session | null>(null);
  // 현재 뷰 상태
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.MAIN);
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  // 사용자 정보 (DB에서 가져옴)
  const [user, setUser] = useState<User>({
    name: "김태호",
    position: "PM",  // 기본값 (DB에서 가져오면 덮어씀)
    department: "디지털혁신팀"
  });

  /**
   * Supabase에서 사용자 정보(직책 등)를 가져옵니다.
   * contacts 테이블에서 김태호의 정보를 조회합니다.
   */
  const fetchUserInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('name, position, department')
        .eq('name', '김태호')
        .single();

      if (!error && data) {
        setUser({
          name: data.name,
          position: data.position || 'PM',
          department: data.department || '디지털혁신팀'
        });
      }
    } catch (err) {
      console.error('사용자 정보 조회 실패:', err);
    }
  };

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      // 세션이 있으면 사용자 정보 가져오기
      if (session) {
        fetchUserInfo();
      }
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // 로그인 시 사용자 정보 가져오기
      if (session) {
        fetchUserInfo();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 로그아웃 처리
   * Supabase Auth의 signOut을 호출하여 세션을 종료합니다.
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setCurrentView(ViewState.MAIN);
    } catch (err) {
      console.error('로그아웃 실패:', err);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.MAIN:
        return <MainDashboard user={user.name} onNavigate={setCurrentView} />;
      case ViewState.MAIL:
        return <MailView />;
      case ViewState.CALENDAR:
        return <CalendarView />;
      case ViewState.TODO:
        return <TodoView />;
      case ViewState.MEMO:
        return <MemoView />;
      case ViewState.MEETING_ROOM:
        return <MeetingRoomView />;
      case ViewState.CONTACTS:
        return <ContactView />;
      case ViewState.MEETING:
        return <MeetingView />;
      case ViewState.DRIVE:
        return <DriveView />;
      case ViewState.NOTICE:
        return <NoticeView />;
      case ViewState.QNA:
        return <QnaView />;
      case ViewState.AI:
        return <AIView />;
      case ViewState.KANBAN:
        return <KanbanView />;
      default:
        return <MainDashboard user={user.name} onNavigate={setCurrentView} />;
    }
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 로그인되지 않은 경우 로그인 페이지 표시
  if (!session) {
    return <LoginView onLoginSuccess={() => { }} />;
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
