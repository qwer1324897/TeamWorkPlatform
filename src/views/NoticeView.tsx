import React, { useState, useMemo } from 'react';
import { Search, Home, ChevronLeft, ChevronRight, Bell, AlertCircle, Paperclip, X } from 'lucide-react';
import { NoticeItem } from '../types';

/**
 * NoticeView 컴포넌트
 * 
 * 공지사항 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 공지사항 목록 조회
 * - 검색 기능
 * - 중요 공지 상단 고정
 * - 동적 페이지네이션 (실제 데이터 기반)
 */

// Mock 데이터 (실제로는 DB에서 가져와야 함)
const mockNotices: NoticeItem[] = [
    { id: 1, title: '[중요] 4분기 전사 보안 점검 시행 안내', author: '김태호', date: '2025.11.22', views: 245, isImportant: true, content: '4분기 전사 보안 점검을 아래와 같이 시행하오니 임직원 여러분의 적극적인 협조 부탁드립니다.\n\n1. 기간: 11월 25일 ~ 11월 29일\n2. 대상: 전 임직원 PC 및 노트북\n3. 방법: 보안 프로그램 실행 후 자동 점검' },
    { id: 2, title: '[공지] 연말정산 시스템 오픈 일정', author: '연승민', date: '2025.11.21', views: 189, isImportant: true, content: '2024년 귀속 연말정산 일정을 안내드립니다.\n\n1. 시스템 오픈: 2025년 1월 15일\n2. 제출 기한: 2025년 2월 28일\n3. 준비 서류: 의료비, 교육비, 기부금 영수증 등' },
    { id: 3, title: '사내 카페테리아 신메뉴 출시 이벤트', author: '강동훈', date: '2025.11.20', views: 312, content: '겨울 시즌을 맞아 따뜻한 신메뉴가 출시되었습니다.\n\n- 크림 파스타\n- 미트볼 스파게티\n- 따뜻한 클램 차우더\n\n11월 말까지 20% 할인 이벤트를 진행합니다.' },
    { id: 4, title: '2025년 다이어리/캘린더 배부 안내', author: '남여원', date: '2025.11.19', views: 405, content: '2025년 업무용 다이어리와 캘린더를 각 층 로비에서 배부합니다.\n\n배부 기간: 11월 20일 ~ 소진 시까지\n배부 장소: 각 층 로비 (B1 ~ 10F)' },
    { id: 5, title: '시스템 정기 점검 공지 (11/24)', author: '김태호', date: '2025.11.18', views: 156, content: '안정적인 서비스 제공을 위한 정기 점검이 진행됩니다.\n\n일시: 2025년 11월 24일(일) 02:00 ~ 06:00\n영향: 그룹웨어 접속 불가\n\n업무에 참고 부탁드립니다.' },
    { id: 6, title: '동호회 신규 회원 모집: 테니스부', author: '연승민', date: '2025.11.17', views: 88, content: '건강과 친목을 도모할 테니스부 신규 회원을 모집합니다.\n\n활동: 매주 토요일 오전 9시\n장소: 서초 테니스장\n회비: 월 3만원' },
    { id: 7, title: '사내 주차장 이용 수칙 변경 안내', author: '강동훈', date: '2025.11.16', views: 201, content: '원활한 주차장 이용을 위해 일부 수칙이 변경되었습니다.\n\n1. 지정 주차제 시행\n2. 외부 차량 사전 등록 필수\n3. 장기 주차 시 관리실 신고' },
    { id: 8, title: '임직원 건강검진 미수검자 확인 요청', author: '남여원', date: '2025.11.15', views: 95, content: '아직 건강검진을 받지 않으신 분들은 12월 말까지 완료 부탁드립니다.\n\n미수검 시 복지포인트 차감이 있을 수 있습니다.\n\n문의: 인사팀 (내선 1234)' },
];

// 페이지당 표시할 공지 수
const ITEMS_PER_PAGE = 9;

const NoticeView: React.FC = () => {
    // 선택된 공지
    const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
    // 검색어
    const [searchTerm, setSearchTerm] = useState('');
    // 현재 페이지
    const [currentPage, setCurrentPage] = useState(1);

    /**
     * 필터링 및 정렬된 공지 목록
     * - 중요 공지가 먼저 표시됨
     * - 검색어로 필터링
     */
    const filteredNotices = useMemo(() => {
        let result = [...mockNotices];

        // 검색어 필터링
        if (searchTerm) {
            result = result.filter(notice => 
                notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notice.author.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 중요 공지 먼저 정렬
        result.sort((a, b) => {
            if (a.isImportant && !b.isImportant) return -1;
            if (!a.isImportant && b.isImportant) return 1;
            return 0;
        });

        return result;
    }, [searchTerm]);

    /**
     * 총 페이지 수 계산
     * 요청사항: 실제 데이터 기반으로 페이지네이션 (1페이지만 있으면 1만 표시)
     */
    const totalPages = Math.max(1, Math.ceil(filteredNotices.length / ITEMS_PER_PAGE));

    /**
     * 현재 페이지에 표시할 공지 목록
     */
    const paginatedNotices = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredNotices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredNotices, currentPage]);

    /**
     * 페이지 변경 핸들러
     */
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    /**
     * 검색어 변경 시 첫 페이지로 이동
     */
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* ========================================
                공지사항 목록
            ======================================== */}
            <div className={`flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${selectedNotice ? 'w-1/2' : 'w-full'}`}>
                {/* 헤더 */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 sticky top-0 z-10 backdrop-blur-sm">
                    <div>
                        <div className="flex items-center text-xs text-slate-500 mb-2 font-medium">
                            <Home size={12} className="mr-1" /> 홈 &gt; 게시판 &gt; 공지사항
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">공지사항</h2>
                    </div>
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="제목 또는 작성자 검색" 
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                        />
                        <Search size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                </div>

                {/* 공지 목록 */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 content-start bg-gray-50/20">
                    {paginatedNotices.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                            <Bell size={48} className="mb-4 opacity-30" />
                            <p>{searchTerm ? '검색 결과가 없습니다.' : '공지사항이 없습니다.'}</p>
                        </div>
                    ) : (
                        paginatedNotices.map(notice => (
                            <div 
                                key={notice.id} 
                                onClick={() => setSelectedNotice(notice)}
                                className={`p-6 border rounded-xl cursor-pointer transition-all flex flex-col justify-between h-48 bg-white group relative overflow-hidden
                                    ${selectedNotice?.id === notice.id 
                                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                                        : 'border-gray-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'
                                    }
                                `}
                            >
                                {/* 중요 표시 바 */}
                                {notice.isImportant && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}
                                
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        {notice.isImportant ? (
                                            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                                                <AlertCircle size={10} /> 중요
                                            </span>
                                        ) : (
                                            <span className="bg-gray-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">일반</span>
                                        )}
                                        <span className="text-xs text-slate-400">{notice.date}</span>
                                    </div>
                                    <h3 className={`font-bold text-lg leading-snug transition-colors line-clamp-2 ${selectedNotice?.id === notice.id ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                        {notice.title}
                                    </h3>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-gray-50 pt-4 mt-2">
                                    <span className="flex items-center gap-1 font-medium">
                                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px]">{notice.author[0]}</div> 
                                        {notice.author}
                                    </span>
                                    <span className="bg-gray-50 px-2 py-0.5 rounded text-slate-400">조회 {notice.views}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* 페이지네이션 - 요청사항: 실제 페이지 수에 맞게 표시 */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 bg-white">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        {/* 페이지 버튼들 - 실제 페이지 수만큼만 표시 */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded font-bold text-sm transition-colors ${
                                    currentPage === page 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'hover:bg-gray-100 text-slate-600'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ========================================
                공지 상세 보기
            ======================================== */}
            {selectedNotice && (
                <div className="w-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-slide-in-right z-20">
                    {/* 헤더 */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-blue-50/30 sticky top-0 backdrop-blur-sm">
                        <div className="flex-1 pr-4">
                            {selectedNotice.isImportant && (
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-100 mb-2">
                                    <AlertCircle size={12} /> 중요 공지
                                </span>
                            )}
                            <h2 className="text-xl font-bold text-slate-900 leading-snug">{selectedNotice.title}</h2>
                        </div>
                        <button 
                            onClick={() => setSelectedNotice(null)} 
                            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-blue-100 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* 작성자 정보 */}
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                                {selectedNotice.author[0]}
                            </span> 
                            <span className="font-bold text-slate-800">{selectedNotice.author}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span><span className="text-slate-400 mr-1">등록일</span> {selectedNotice.date}</span>
                            <span><span className="text-slate-400 mr-1">조회</span> {selectedNotice.views}</span>
                        </div>
                    </div>

                    {/* 본문 */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base font-normal">
                            {selectedNotice.content?.replace(/\\n/g, '\n')}
                        </p>
                    </div>

                    {/* 첨부파일 */}
                    <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                            <p className="text-xs font-bold text-slate-400 mb-2 uppercase flex items-center gap-2">
                                <Paperclip size={12} /> Attachment
                            </p>
                            <div className="text-sm text-slate-500 italic flex items-center gap-2">
                                <Bell size={14} /> 첨부파일이 없습니다.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticeView;
