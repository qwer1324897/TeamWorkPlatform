import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, Paperclip, Inbox, Send, File, AlertCircle, Trash2, Mail, Plus, RefreshCw, X, Reply, Forward, Archive, CornerUpLeft, Loader2, Check } from 'lucide-react';
import { MailItem, ContactItem } from '../types';
import { mailService } from '../services/mailService';
import { contactService } from '../services/contactService';

/**
 * MailView 컴포넌트
 * 
 * 메일 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 받은 메일함/보낸 메일함/임시보관함/스팸/휴지통 관리
 * - 메일 쓰기 (연락처에서 받는 사람 검색)
 * - 메일 전송 (Supabase DB 연동)
 * - 메일 읽음/중요 표시 토글
 * - 답장/전달 기능
 * - VIP 발신자 강조
 */

const MailView: React.FC = () => {
    // 현재 선택된 폴더
    const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash' | 'spam'>('inbox');
    // 선택된 메일
    const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
    // 검색어
    const [searchTerm, setSearchTerm] = useState('');
    // 메일 작성 모달 표시 여부
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    // 실제 데이터 상태
    const [mails, setMails] = useState<MailItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 연락처 목록 (받는 사람 검색용)
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [contactSearchResults, setContactSearchResults] = useState<ContactItem[]>([]);
    const [showContactDropdown, setShowContactDropdown] = useState(false);

    // 메일 작성 상태
    const [composeTo, setComposeTo] = useState('');
    const [composeToEmail, setComposeToEmail] = useState('');
    const [composeTitle, setComposeTitle] = useState('');
    const [composeContent, setComposeContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    // 빠른 답장 상태
    const [quickReplyContent, setQuickReplyContent] = useState('');

    /**
     * Supabase에서 메일 목록을 가져옵니다.
     * currentFolder에 따라 해당 폴더의 메일만 조회합니다.
     */
    const fetchMails = async () => {
        setIsLoading(true);
        
        // draft, spam은 현재 지원하지 않으므로 빈 배열 반환
        if (currentFolder === 'draft' || currentFolder === 'spam') {
            setMails([]);
            setIsLoading(false);
            return;
        }

        // 폴더 타입 매핑
        let folderToFetch: 'inbox' | 'sent' | 'trash' | 'important' = 'inbox';
        if (currentFolder === 'sent') folderToFetch = 'sent';
        else if (currentFolder === 'trash') folderToFetch = 'trash';

        const { data, error } = await mailService.getMails(folderToFetch);

        if (error) {
            console.error('메일 목록 조회 실패:', error);
        } else {
            setMails(data || []);
        }
        setIsLoading(false);
    };

    /**
     * 연락처 목록을 가져옵니다.
     * 메일 작성 시 받는 사람 검색에 사용됩니다.
     */
    const fetchContacts = async () => {
        const { data, error } = await contactService.getContacts();
        if (!error && data) {
            setContacts(data);
        }
    };

    // 컴포넌트 마운트 시 연락처 목록 로드
    useEffect(() => {
        fetchContacts();
    }, []);

    // 폴더 변경 시 메일 목록 새로고침
    useEffect(() => {
        fetchMails();
    }, [currentFolder]);

    /**
     * 받는 사람 입력 시 연락처 검색
     * 이름 또는 이메일로 검색합니다.
     */
    const handleRecipientSearch = (value: string) => {
        setComposeTo(value);
        setShowContactDropdown(true);
        
        if (value.trim() === '') {
            setContactSearchResults([]);
            return;
        }

        // 연락처에서 이름 또는 이메일로 검색
        const results = contacts.filter(contact => 
            contact.name.toLowerCase().includes(value.toLowerCase()) ||
            contact.email.toLowerCase().includes(value.toLowerCase())
        );
        setContactSearchResults(results);
    };

    /**
     * 연락처 선택 시 받는 사람 필드에 자동 입력
     */
    const handleSelectContact = (contact: ContactItem) => {
        setComposeTo(contact.name);
        setComposeToEmail(contact.email);
        setShowContactDropdown(false);
        setContactSearchResults([]);
    };

    /**
     * 메일 전송 처리
     * Supabase mails 테이블에 저장합니다.
     */
    const handleSendMail = async () => {
        if (!composeTo || !composeTitle) {
            alert('받는 사람과 제목을 입력해주세요.');
            return;
        }

        setIsSending(true);

        try {
            // 메일 데이터 구성
            const newMail = {
                sender: composeToEmail || composeTo, // 받는 사람 이메일
                title: composeTitle,
                content: composeContent,
            };

            const { error } = await mailService.sendMail(newMail);
            if (error) throw error;

            alert('메일이 성공적으로 전송되었습니다.');
            
            // 폼 초기화 및 모달 닫기
            setIsComposeOpen(false);
            setComposeTitle('');
            setComposeContent('');
            setComposeTo('');
            setComposeToEmail('');
            
            // 보낸 메일함이면 목록 새로고침
            if (currentFolder === 'sent') fetchMails();
        } catch (error) {
            console.error('메일 전송 실패:', error);
            alert('메일 전송에 실패했습니다.');
        } finally {
            setIsSending(false);
        }
    };

    /**
     * 메일 삭제 처리
     */
    const handleDeleteMail = async () => {
        if (!selectedMail) return;
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await mailService.deleteMail(selectedMail.id);
            if (!error) {
                setMails(mails.filter(m => m.id !== selectedMail.id));
                setSelectedMail(null);
            } else {
                alert('삭제에 실패했습니다.');
            }
        }
    };

    /**
     * 메일 읽음 상태 토글
     */
    const handleToggleRead = async (mail: MailItem) => {
        const { error } = await mailService.updateMailStatus(mail.id, { isRead: !mail.isRead });
        if (!error) {
            setMails(mails.map(m => m.id === mail.id ? { ...m, isRead: !m.isRead } : m));
            if (selectedMail?.id === mail.id) {
                setSelectedMail({ ...selectedMail, isRead: !mail.isRead });
            }
        }
    };

    /**
     * 메일 중요 표시 토글
     */
    const handleToggleImportant = async (mail: MailItem) => {
        const { error } = await mailService.updateMailStatus(mail.id, { isImportant: !mail.isImportant });
        if (!error) {
            setMails(mails.map(m => m.id === mail.id ? { ...m, isImportant: !m.isImportant } : m));
            if (selectedMail?.id === mail.id) {
                setSelectedMail({ ...selectedMail, isImportant: !mail.isImportant });
            }
        }
    };

    /**
     * 답장 모달 열기
     */
    const handleReply = () => {
        if (!selectedMail) return;
        setComposeTo(selectedMail.sender);
        setComposeToEmail(selectedMail.senderEmail || '');
        setComposeTitle(`Re: ${selectedMail.title}`);
        setComposeContent(`\n\n--- 원본 메일 ---\n${selectedMail.content}`);
        setIsComposeOpen(true);
    };

    /**
     * 전달 모달 열기
     */
    const handleForward = () => {
        if (!selectedMail) return;
        setComposeTo('');
        setComposeToEmail('');
        setComposeTitle(`Fwd: ${selectedMail.title}`);
        setComposeContent(`\n\n--- 전달된 메일 ---\n보낸 사람: ${selectedMail.sender}\n제목: ${selectedMail.title}\n\n${selectedMail.content}`);
        setIsComposeOpen(true);
    };

    /**
     * 빠른 답장 전송
     */
    const handleQuickReply = async () => {
        if (!selectedMail || !quickReplyContent.trim()) return;
        
        setIsSending(true);
        try {
            const newMail = {
                sender: selectedMail.senderEmail || selectedMail.sender,
                title: `Re: ${selectedMail.title}`,
                content: quickReplyContent,
            };

            const { error } = await mailService.sendMail(newMail);
            if (error) throw error;

            alert('답장이 전송되었습니다.');
            setQuickReplyContent('');
        } catch (error) {
            alert('답장 전송에 실패했습니다.');
        } finally {
            setIsSending(false);
        }
    };

    // 검색 필터링된 메일 목록
    const filteredMails = useMemo(() => {
        return mails.filter(mail => {
            if (searchTerm && !mail.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !mail.sender.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [mails, searchTerm]);

    // 읽지 않은 메일 수
    const unreadCount = mails.filter(m => !m.isRead && m.folder === 'inbox').length;

    /**
     * 폴더 변경 핸들러
     */
    const handleFolderChange = (folder: typeof currentFolder) => {
        setCurrentFolder(folder);
        setSelectedMail(null);
    };

    /**
     * 폴더 이름 한글 변환
     */
    const getFolderName = (folder: string) => {
        const names: Record<string, string> = {
            inbox: '받은 메일함',
            sent: '보낸 메일함',
            draft: '임시 보관함',
            spam: '스팸 메일함',
            trash: '휴지통'
        };
        return names[folder] || folder;
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 relative">

            {/* ========================================
                사이드바 네비게이션
            ======================================== */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                {/* 메일 쓰기 버튼 */}
                <div className="p-5">
                    <button
                        onClick={() => {
                            setIsComposeOpen(true);
                            setComposeTo('');
                            setComposeToEmail('');
                            setComposeTitle('');
                            setComposeContent('');
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={20} strokeWidth={2.5} /> 메일 쓰기
                    </button>
                </div>

                {/* 폴더 목록 */}
                <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                    <button 
                        onClick={() => handleFolderChange('inbox')} 
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentFolder === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <div className="flex items-center gap-3"><Inbox size={18} /> 받은 메일함</div>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => handleFolderChange('sent')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentFolder === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <Send size={18} /> 보낸 메일함
                    </button>
                    <button 
                        onClick={() => handleFolderChange('draft')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentFolder === 'draft' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <File size={18} /> 임시 보관함
                    </button>
                    <button 
                        onClick={() => handleFolderChange('spam')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentFolder === 'spam' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <AlertCircle size={18} /> 스팸 메일함
                    </button>
                    <button 
                        onClick={() => handleFolderChange('trash')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentFolder === 'trash' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-gray-200'}`}
                    >
                        <Trash2 size={18} /> 휴지통
                    </button>

                    {/* 태그 섹션 */}
                    <div className="pt-8 pb-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Tags <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                    {['업무', '공지', '프로젝트', '개인'].map(tag => (
                        <button 
                            key={tag} 
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-gray-200 transition-colors"
                        >
                            <span className={`w-2.5 h-2.5 rounded-md ${
                                tag === '업무' ? 'bg-blue-500' :
                                tag === '공지' ? 'bg-red-500' :
                                tag === '프로젝트' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span> {tag}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ========================================
                메일 목록
            ======================================== */}
            <div className={`flex flex-col min-w-0 border-r border-gray-200 bg-white transition-all duration-300 ${selectedMail ? 'w-[400px] hidden xl:flex xl:flex-none' : 'w-full'}`}>
                {/* 목록 헤더 */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-5 bg-white shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-lg text-slate-800">
                            {getFolderName(currentFolder)}
                        </h2>
                        <span className="text-slate-400 text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                            {filteredMails.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="메일 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-48 transition-all"
                            />
                        </div>
                        <button 
                            onClick={fetchMails} 
                            className="p-2 text-slate-500 hover:bg-gray-100 rounded-lg" 
                            title="새로고침"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* 메일 목록 */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <Loader2 className="animate-spin" size={32} />
                            <p>메일을 불러오는 중...</p>
                        </div>
                    ) : filteredMails.length > 0 ? (
                        filteredMails.map((mail) => (
                            <div
                                key={mail.id}
                                onClick={() => {
                                    setSelectedMail(mail);
                                    // 읽음 처리
                                    if (!mail.isRead) {
                                        handleToggleRead(mail);
                                    }
                                }}
                                className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors group relative
                                    ${selectedMail?.id === mail.id ? 'bg-blue-50 border-l-4 border-l-blue-600 pl-[12px]' : 'border-l-4 border-l-transparent pl-[12px]'}
                                    ${!mail.isRead ? 'bg-slate-50/50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {/* 중요 표시 */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleImportant(mail); }}
                                            className="text-slate-300 hover:text-yellow-400 transition-colors"
                                        >
                                            <Star size={14} className={mail.isImportant ? 'text-yellow-400 fill-yellow-400' : ''} />
                                        </button>
                                        {/* VIP 발신자 강조 */}
                                        <span className={`text-sm truncate ${!mail.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                            {mail.sender}
                                        </span>
                                        {mail.isVip && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded font-bold border border-yellow-100">
                                                VIP
                                            </span>
                                        )}
                                        {mail.tag && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium border border-gray-200">
                                                {mail.tag}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2 font-medium">
                                        {mail.date}
                                    </span>
                                </div>
                                <h4 className={`text-sm mb-1 truncate pr-8 ${!mail.isRead ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                    {mail.title}
                                </h4>
                                <p className="text-xs text-slate-500 truncate">{mail.preview}</p>

                                <div className="flex gap-2 mt-2.5">
                                    {mail.hasAttachment && (
                                        <span className="flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                            <Paperclip size={10} /> 첨부
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Inbox size={48} className="mb-4 opacity-20" />
                            <p>메일이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================
                메일 상세 보기
            ======================================== */}
            <div className={`flex-[1.5] bg-gray-50 flex flex-col ${selectedMail ? 'flex' : 'hidden xl:flex'}`}>
                {selectedMail ? (
                    <div className="flex-col h-full bg-white flex animate-fade-in relative z-0">
                        {/* 상세 헤더 */}
                        <div className="px-8 py-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                            <div className="flex justify-between items-start mb-6">
                                {/* 액션 버튼들 */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleReply}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-slate-600 transition-colors" 
                                        title="답장"
                                    >
                                        <Reply size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {}} 
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-slate-600 transition-colors" 
                                        title="전체 답장"
                                    >
                                        <CornerUpLeft size={18} />
                                    </button>
                                    <button 
                                        onClick={handleForward}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-slate-600 transition-colors" 
                                        title="전달"
                                    >
                                        <Forward size={18} />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleToggleImportant(selectedMail)}
                                        className={`p-2 hover:bg-gray-100 rounded transition-colors ${selectedMail.isImportant ? 'text-yellow-500' : 'text-slate-500'}`}
                                        title="중요 표시"
                                    >
                                        <Star size={18} className={selectedMail.isImportant ? 'fill-yellow-500' : ''} />
                                    </button>
                                    <button 
                                        className="p-2 hover:bg-gray-100 rounded text-slate-500" 
                                        title="보관"
                                    >
                                        <Archive size={18} />
                                    </button>
                                    <button 
                                        onClick={handleDeleteMail} 
                                        className="p-2 hover:bg-gray-100 rounded text-slate-500 hover:text-red-500" 
                                        title="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedMail(null)} 
                                        className="p-2 hover:bg-gray-100 rounded text-slate-500 xl:hidden" 
                                        title="닫기"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-6">
                                {selectedMail.title}
                            </h1>

                            {/* 발신자 정보 */}
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white ring-1 ring-gray-100 ${
                                    selectedMail.isVip 
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                }`}>
                                    {selectedMail.sender[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold text-slate-900 text-base">{selectedMail.sender}</span>
                                        {selectedMail.isVip && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded font-bold border border-yellow-100">
                                                VIP
                                            </span>
                                        )}
                                        <span className="text-slate-400 text-sm">
                                            &lt;{selectedMail.senderEmail || 'email@example.com'}&gt;
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-xs text-slate-500">받는사람: 나 (김태호)</span>
                                        <span className="text-xs text-slate-400 font-medium">{selectedMail.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 메일 본문 */}
                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-base font-normal">
                                {selectedMail.content}
                            </div>

                            {/* 첨부파일 */}
                            {selectedMail.hasAttachment && (
                                <div className="mt-10 pt-6 border-t border-gray-100">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Paperclip size={14} /> 첨부파일 (1)
                                    </h5>
                                    <div className="flex items-center p-3 border border-gray-200 rounded-xl bg-gray-50 w-full max-w-sm cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                                        <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                                            <File size={20} />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                                Project_Report_vFinal.pdf
                                            </p>
                                            <p className="text-xs text-slate-500">2.4 MB</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 빠른 답장 */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                    나
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="빠른 답장 작성..."
                                        value={quickReplyContent}
                                        onChange={(e) => setQuickReplyContent(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuickReply()}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                    />
                                    <button
                                        onClick={handleQuickReply}
                                        disabled={!quickReplyContent.trim() || isSending}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-gray-100">
                                <Mail size={48} className="text-blue-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">메일을 선택하세요</h3>
                            <p className="text-slate-500 text-sm">왼쪽 목록에서 메일을 클릭하여 내용을 확인하세요.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================
                메일 작성 모달
            ======================================== */}
            {isComposeOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-10">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">
                        {/* 모달 헤더 */}
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
                            <span className="text-white font-bold flex items-center gap-2">
                                <Send size={18} /> 새 메일 작성
                            </span>
                            <button 
                                onClick={() => setIsComposeOpen(false)} 
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 모달 내용 */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* 받는 사람 입력 (연락처 검색) */}
                            <div className="px-6 py-4 border-b border-gray-100 relative">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-slate-500 w-16">받는 사람</span>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            className="w-full outline-none text-slate-800 font-medium"
                                            placeholder="이름 또는 이메일로 검색"
                                            value={composeTo}
                                            onChange={(e) => handleRecipientSearch(e.target.value)}
                                            onFocus={() => setShowContactDropdown(true)}
                                            autoFocus
                                        />
                                        {composeToEmail && (
                                            <span className="text-slate-400 text-sm ml-2">
                                                &lt;{composeToEmail}&gt;
                                            </span>
                                        )}
                                        
                                        {/* 연락처 검색 결과 드롭다운 */}
                                        {showContactDropdown && contactSearchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
                                                {contactSearchResults.map(contact => (
                                                    <div
                                                        key={contact.id}
                                                        onClick={() => handleSelectContact(contact)}
                                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                                            contact.isVip ? 'bg-yellow-500' : 'bg-blue-500'
                                                        }`}>
                                                            {contact.name[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800">{contact.name}</span>
                                                                {contact.isVip && (
                                                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-slate-500">{contact.email}</span>
                                                        </div>
                                                        <span className="text-xs text-slate-400">{contact.department}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 제목 입력 */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-500 w-16">제목</span>
                                <input
                                    type="text"
                                    className="flex-1 outline-none text-slate-800 font-bold text-lg"
                                    placeholder="제목을 입력하세요"
                                    value={composeTitle}
                                    onChange={(e) => setComposeTitle(e.target.value)}
                                />
                            </div>

                            {/* 본문 입력 */}
                            <textarea
                                className="flex-1 p-6 outline-none text-slate-700 resize-none text-base leading-relaxed"
                                placeholder="내용을 작성하세요..."
                                value={composeContent}
                                onChange={(e) => setComposeContent(e.target.value)}
                            ></textarea>
                        </div>

                        {/* 모달 푸터 */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-200 rounded text-slate-500">
                                    <Paperclip size={20} />
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsComposeOpen(false)} 
                                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleSendMail}
                                    disabled={isSending}
                                    className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>보내기 <Send size={16} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MailView;
