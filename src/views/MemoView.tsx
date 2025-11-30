import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, StickyNote, PenSquare, Trash2, Calendar, Save, Loader2, Pin, Tag, Clock } from 'lucide-react';
import { MemoItem } from '../types';
import { memoService } from '../services/memoService';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * MemoView 컴포넌트
 * 
 * 메모 관리 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 메모 목록 조회 (Supabase DB 연동)
 * - 메모 추가/수정/삭제
 * - 메모 고정(pin) 기능
 * - 날짜 표시 형식 개선
 * - 태그 필터링
 */

const MemoView: React.FC = () => {
    // 메모 목록
    const [memos, setMemos] = useState<MemoItem[]>([]);
    // 로딩 상태
    const [loading, setLoading] = useState(true);
    // 선택된 메모
    const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
    // 새 메모 작성 중 여부
    const [isCreating, setIsCreating] = useState(false);
    // 수정 중 여부
    const [isEditing, setIsEditing] = useState(false);
    // 검색어
    const [searchTerm, setSearchTerm] = useState('');
    // 선택된 태그 필터
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    // 저장 중 상태
    const [isSaving, setIsSaving] = useState(false);

    // 폼 상태
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    /**
     * Supabase에서 메모 목록을 가져옵니다.
     */
    const fetchMemos = async () => {
        setLoading(true);
        const { data, error } = await memoService.getMemos();
        if (error) {
            console.error('메모 불러오기 실패:', error);
        } else {
            setMemos(data || []);
        }
        setLoading(false);
    };

    // 컴포넌트 마운트 시 메모 로드
    useEffect(() => {
        fetchMemos();
    }, []);

    /**
     * 새 메모 작성 시작
     */
    const handleNewMemo = () => {
        setSelectedMemo(null);
        setIsCreating(true);
        setIsEditing(false);
        setTitle('');
        setContent('');
    };

    /**
     * 기존 메모 선택
     */
    const handleSelectMemo = (memo: MemoItem) => {
        setSelectedMemo(memo);
        setIsCreating(false);
        setIsEditing(true);
        setTitle(memo.title);
        setContent(memo.content);
    };

    /**
     * 메모 저장 (추가 또는 수정)
     */
    const handleSave = async () => {
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }

        setIsSaving(true);

        try {
            if (selectedMemo) {
                // 수정
                const { data, error } = await memoService.updateMemo(selectedMemo.id, { title, content });
                if (!error && data) {
                    setMemos(memos.map(m => m.id === data.id ? data : m));
                    setSelectedMemo(data);
                }
            } else {
                // 생성
                const { data, error } = await memoService.createMemo({
                    title,
                    content,
                    tags: [],
                    isPinned: false
                });
                if (!error && data) {
                    setMemos([data, ...memos]);
                    setSelectedMemo(data);
                    setIsCreating(false);
                    setIsEditing(true);
                }
            }
        } catch (error) {
            console.error('메모 저장 실패:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * 메모 삭제
     */
    const handleDelete = async () => {
        if (!selectedMemo) return;
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await memoService.deleteMemo(selectedMemo.id);
            if (!error) {
                setMemos(memos.filter(m => m.id !== selectedMemo.id));
                setSelectedMemo(null);
                setIsEditing(false);
                setTitle('');
                setContent('');
            }
        }
    };

    /**
     * 메모 고정/해제 토글
     */
    const handleTogglePin = async (memo: MemoItem) => {
        const { data, error } = await memoService.updateMemo(memo.id, { isPinned: !memo.isPinned });
        if (!error && data) {
            setMemos(memos.map(m => m.id === data.id ? data : m));
            if (selectedMemo?.id === memo.id) {
                setSelectedMemo(data);
            }
        }
    };

    /**
     * 날짜 포맷팅 (yyyy-MM-dd HH:mm)
     */
    const formatDate = (dateString: string) => {
        try {
            // ISO 형식인 경우
            if (dateString.includes('T') || dateString.includes('-')) {
                const date = parseISO(dateString);
                return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
            }
            // 이미 포맷된 경우 그대로 반환
            return dateString;
        } catch {
            return dateString;
        }
    };

    /**
     * 필터링된 메모 목록
     * - 고정된 메모가 먼저 표시
     * - 검색어 필터링
     * - 태그 필터링
     */
    const filteredMemos = memos
        .filter(memo => {
            // 검색어 필터
            if (searchTerm && !memo.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !memo.content.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            // 태그 필터
            if (selectedTag && (!memo.tags || !memo.tags.includes(selectedTag))) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            // 고정된 메모 먼저
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

    // 모든 태그 추출 (중복 제거)
    const allTags = Array.from(new Set(memos.flatMap(m => m.tags || [])));

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">

            {/* ========================================
                좌측 메모 목록
            ======================================== */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
                {/* 헤더 */}
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <StickyNote className="text-yellow-500" /> 메모
                        <span className="text-sm font-normal text-slate-400">({memos.length})</span>
                    </h2>
                    <button
                        onClick={handleNewMemo}
                        className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all shadow-sm active:scale-95 transform hover:-translate-y-0.5 border border-yellow-200"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* 검색 */}
                <div className="p-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="메모 검색" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-shadow" 
                        />
                    </div>
                </div>

                {/* 태그 필터 */}
                {allTags.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${!selectedTag ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            전체
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${selectedTag === tag ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* 메모 목록 */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-yellow-500" />
                        </div>
                    ) : filteredMemos.length === 0 ? (
                        <div className="text-center text-slate-400 p-4 text-sm">
                            {searchTerm ? '검색 결과가 없습니다.' : '메모가 없습니다.'}
                        </div>
                    ) : filteredMemos.map(memo => (
                        <div
                            key={memo.id}
                            onClick={() => handleSelectMemo(memo)}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border relative overflow-hidden group
                                ${selectedMemo?.id === memo.id
                                    ? 'bg-yellow-50 border-yellow-300 shadow-md transform -translate-y-0.5'
                                    : 'bg-white border-gray-100 hover:border-yellow-200 hover:shadow-md hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {/* 고정 표시 */}
                            {memo.isPinned && (
                                <div className="absolute top-2 right-2">
                                    <Pin size={14} className="text-yellow-500 fill-yellow-500" />
                                </div>
                            )}

                            {/* 선택 표시 바 */}
                            {selectedMemo?.id === memo.id && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                            )}

                            {/* 제목 */}
                            <h4 className={`font-bold text-sm mb-1 truncate pr-6 transition-colors ${selectedMemo?.id === memo.id ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                                {memo.title}
                            </h4>

                            {/* 내용 미리보기 */}
                            <p className="text-xs text-slate-500 truncate mb-3">{memo.content || '내용 없음'}</p>

                            {/* 날짜 및 태그 */}
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Clock size={10} /> {formatDate(memo.updatedAt)}
                                </span>
                                {memo.tags && memo.tags.length > 0 && (
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-slate-600 group-hover:bg-yellow-100 transition-colors">
                                        {memo.tags[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ========================================
                우측 메모 에디터
            ======================================== */}
            <div className="flex-1 flex flex-col bg-white relative">
                {/* 배경 패턴 */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>

                {isCreating || selectedMemo ? (
                    <div className="flex flex-col h-full animate-fade-in relative z-10">
                        {/* 에디터 헤더 */}
                        <div className="h-16 border-b border-gray-200 px-8 flex items-center justify-between bg-yellow-50/30 backdrop-blur-sm">
                            <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                {isCreating ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div> 
                                        새 메모 작성 중...
                                    </>
                                ) : (
                                    <>
                                        <Calendar size={14} /> 
                                        {selectedMemo && formatDate(selectedMemo.updatedAt)}
                                    </>
                                )}
                            </span>
                            <div className="flex gap-2">
                                {/* 고정 버튼 */}
                                {selectedMemo && (
                                    <button 
                                        onClick={() => handleTogglePin(selectedMemo)}
                                        className={`p-2 rounded-lg transition-colors ${selectedMemo.isPinned ? 'bg-yellow-100 text-yellow-600' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                        title={selectedMemo.isPinned ? '고정 해제' : '고정'}
                                    >
                                        <Pin size={18} className={selectedMemo.isPinned ? 'fill-yellow-500' : ''} />
                                    </button>
                                )}
                                
                                {/* 저장 버튼 */}
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    저장
                                </button>
                                
                                {/* 삭제 버튼 */}
                                {!isCreating && (
                                    <button 
                                        onClick={handleDelete} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 에디터 본문 */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            {/* 제목 입력 */}
                            <input
                                type="text"
                                placeholder="제목을 입력하세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-4xl font-bold text-slate-900 border-none focus:ring-0 placeholder-gray-300 mb-6 bg-transparent outline-none tracking-tight"
                                autoFocus={isCreating}
                            />

                            {/* 내용 입력 */}
                            <textarea
                                className="w-full h-full resize-none border-none focus:ring-0 text-slate-700 text-lg leading-relaxed bg-transparent outline-none placeholder-gray-300 font-medium"
                                placeholder="내용을 자유롭게 작성하세요..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                ) : (
                    // 빈 상태
                    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/20 relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-100/50 rotate-3 border border-white">
                            <StickyNote size={48} className="text-yellow-600 drop-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">메모를 선택하세요</h3>
                        <p className="text-slate-500 mb-8 max-w-xs text-center leading-relaxed">
                            중요한 아이디어나 할 일을<br />빠르게 기록하고 관리해보세요.
                        </p>
                        <button 
                            onClick={handleNewMemo} 
                            className="px-8 py-3.5 bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-500/30 hover:bg-yellow-600 transition-all hover:-translate-y-1 hover:shadow-xl flex items-center gap-2"
                        >
                            <PenSquare size={18} /> 새 메모 작성하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemoView;
