import React, { useState, useMemo } from 'react';
import { Search, Home, ChevronLeft, ChevronRight, MessageSquare, MessageCircle, X, Plus, Send, CheckCircle, Clock } from 'lucide-react';
import { QnaItem } from '../types';

/**
 * QnaView 컴포넌트
 * 
 * Q&A (문의사항) 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 문의사항 목록 조회
 * - 문의 등록 (모달)
 * - 답변 보기
 * - 상태별 필터링 (대기/완료)
 */

// Mock 데이터
const mockQnaList: QnaItem[] = [
    { id: 1, title: '프로젝트 권한 요청 문의드립니다', author: '김태호', date: '2025.11.22', status: '답변완료', category: '권한', content: '새로 합류한 인턴에게 B2B-Portal 프로젝트 접근 권한을 부여해야 합니다.', answer: '권한 부여가 완료되었습니다.' },
    { id: 2, title: 'VPN 접속 오류 해결 방법 문의', author: '연승민', date: '2025.11.21', status: '대기중', category: '기술', content: '재택 근무 중 VPN 접속 시 오류가 발생합니다.' },
    { id: 3, title: '연차 신청 시스템 사용법 문의', author: '강동훈', date: '2025.11.20', status: '답변완료', category: '일반', content: '연차 신청 시 오류가 발생합니다.', answer: '수정이 완료되었습니다.' },
    { id: 4, title: '모바일 앱 설치 관련 문의', author: '남여원', date: '2025.11.19', status: '대기중', category: '기술', content: '사내 모바일 앱이 검색되지 않습니다.' },
    { id: 5, title: '회의실 예약 취소 요청', author: '김태호', date: '2025.11.18', status: '답변완료', category: '일반', content: '회의실 예약을 취소해주세요.', answer: '예약 취소가 완료되었습니다.' },
];

const ITEMS_PER_PAGE = 6;

const QnaView: React.FC = () => {
    const [selectedQna, setSelectedQna] = useState<QnaItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | '대기중' | '답변완료'>('all');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('일반');
    const [qnaList, setQnaList] = useState<QnaItem[]>(mockQnaList);

    const filteredQnaList = useMemo(() => {
        let result = [...qnaList];
        if (statusFilter !== 'all') {
            result = result.filter(qna => qna.status === statusFilter);
        }
        if (searchTerm) {
            result = result.filter(qna =>
                qna.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return result;
    }, [qnaList, statusFilter, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredQnaList.length / ITEMS_PER_PAGE));

    const paginatedQnaList = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredQnaList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredQnaList, currentPage]);

    const handleSubmit = () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }
        const newQna: QnaItem = {
            id: Date.now(),
            title: newTitle,
            author: '나',
            date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            status: '대기중',
            category: newCategory,
            content: newContent
        };
        setQnaList([newQna, ...qnaList]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        setNewCategory('일반');
        alert('문의가 등록되었습니다.');
    };

    const getStatusStyle = (status: string) => {
        if (status === '답변완료') return 'bg-green-50 text-green-700 border-green-200';
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    const getStatusIcon = (status: string) => {
        if (status === '답변완료') return <CheckCircle size={12} />;
        return <Clock size={12} />;
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            <div className={`flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${selectedQna ? 'w-1/2' : 'w-full'}`}>
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 sticky top-0 z-10">
                    <div>
                        <div className="flex items-center text-xs text-slate-500 mb-2 font-medium">
                            <Home size={12} className="mr-1" /> 홈 &gt; 게시판 &gt; Q&A
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Q&A</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); }} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>전체</button>
                            <button onClick={() => { setStatusFilter('대기중'); setCurrentPage(1); }} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${statusFilter === '대기중' ? 'bg-white text-yellow-600 shadow-sm' : 'text-slate-500'}`}>대기중</button>
                            <button onClick={() => { setStatusFilter('답변완료'); setCurrentPage(1); }} className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${statusFilter === '답변완료' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>답변완료</button>
                        </div>
                        <div className="relative group">
                            <input type="text" placeholder="검색" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> 문의하기
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
                    {paginatedQnaList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <MessageSquare size={48} className="mb-4 opacity-30" />
                            <p>문의사항이 없습니다.</p>
                        </div>
                    ) : (
                        paginatedQnaList.map(qna => (
                            <div key={qna.id} onClick={() => setSelectedQna(qna)} className={`p-5 border rounded-xl cursor-pointer transition-all bg-white group ${selectedQna?.id === qna.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-gray-100 hover:border-blue-300 hover:shadow-lg'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(qna.status)} flex items-center gap-1`}>{getStatusIcon(qna.status)} {qna.status}</span>
                                        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">{qna.category}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{qna.date}</span>
                                </div>
                                <h3 className={`font-bold text-base mb-2 ${selectedQna?.id === qna.id ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>{qna.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">{qna.author[0]}</div>
                                    <span className="font-medium">{qna.author}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2 bg-white">
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 hover:bg-gray-100 rounded text-slate-400 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded font-bold text-sm ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-slate-600'}`}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-gray-100 rounded text-slate-400 disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                )}
            </div>

            {selectedQna && (
                <div className="w-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-slide-in-right z-20">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-blue-50/30">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(selectedQna.status)} flex items-center gap-1`}>{getStatusIcon(selectedQna.status)} {selectedQna.status}</span>
                                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-100">{selectedQna.category}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedQna.title}</h2>
                        </div>
                        <button onClick={() => setSelectedQna(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-blue-100 rounded"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">{selectedQna.author[0]}</div>
                                <span className="font-bold text-slate-800">{selectedQna.author}</span>
                                <span className="text-slate-300">|</span>
                                <span>{selectedQna.date}</span>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedQna.content}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageCircle size={18} className="text-green-500" /> 답변</h4>
                            {selectedQna.answer ? (
                                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2 mb-3 text-sm text-green-700">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">관</div>
                                        <span className="font-bold">관리자</span>
                                        <CheckCircle size={14} className="text-green-500" />
                                    </div>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedQna.answer}</p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 text-center">
                                    <Clock size={32} className="mx-auto mb-2 text-yellow-500" />
                                    <p className="text-yellow-700 font-bold">답변 대기 중</p>
                                    <p className="text-sm text-yellow-600 mt-1">담당자가 확인 후 답변드리겠습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-[550px] overflow-hidden">
                        <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-6">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2"><MessageSquare size={20} /> 새 문의 등록</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">카테고리</label>
                                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="일반">일반</option>
                                    <option value="기술">기술</option>
                                    <option value="권한">권한</option>
                                    <option value="기타">기타</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">제목</label>
                                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="문의 제목을 입력하세요" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">문의 내용</label>
                                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="문의 내용을 상세히 작성해주세요" rows={6} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-gray-200 rounded-xl">취소</button>
                            <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-2"><Send size={16} /> 등록하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QnaView;
