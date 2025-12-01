import React, { useState, useEffect, useMemo } from 'react';
import { Search, Star, Paperclip, Inbox, Send, File, AlertCircle, Trash2, Mail, Plus, RefreshCw, X, Reply, Forward, Archive, CornerUpLeft, Loader2 } from 'lucide-react';
import { MailItem, ContactItem } from '../types';
import { mailService } from '../services/mailService';
import { contactService } from '../services/contactService';

/**
 * MailView - Material Design 3 스타일
 */

const MailView: React.FC = () => {
    const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'draft' | 'trash' | 'spam'>('inbox');
    const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [mails, setMails] = useState<MailItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [contactSearchResults, setContactSearchResults] = useState<ContactItem[]>([]);
    const [showContactDropdown, setShowContactDropdown] = useState(false);
    const [composeTo, setComposeTo] = useState('');
    const [composeToEmail, setComposeToEmail] = useState('');
    const [composeTitle, setComposeTitle] = useState('');
    const [composeContent, setComposeContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [quickReplyContent, setQuickReplyContent] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        const { count, error } = await mailService.getUnreadCount();
        if (!error && count !== null) setUnreadCount(count);
    };

    const fetchMails = async () => {
        setIsLoading(true);
        fetchUnreadCount(); // 메일 목록 가져올 때 안 읽은 메일 개수도 갱신
        if (currentFolder === 'draft' || currentFolder === 'spam') {
            setMails([]);
            setIsLoading(false);
            return;
        }
        let folderToFetch: 'inbox' | 'sent' | 'trash' | 'important' = 'inbox';
        if (currentFolder === 'sent') folderToFetch = 'sent';
        else if (currentFolder === 'trash') folderToFetch = 'trash';
        
        const { data: mailsData, error: mailError } = await mailService.getMails(folderToFetch);
        const { data: contactsData, error: contactError } = await contactService.getContacts();

        if (!mailError && mailsData) {
            // 연락처 정보와 매핑하여 VIP 상태 업데이트
            const mergedMails = mailsData.map(mail => {
                const contact = contactsData?.find(c => c.name === mail.sender || c.email === mail.senderEmail);
                return {
                    ...mail,
                    isVip: contact ? contact.isVip : false
                };
            });
            setMails(mergedMails);
        }
        setIsLoading(false);
    };

    const fetchContacts = async () => {
        const { data, error } = await contactService.getContacts();
        if (!error && data) setContacts(data);
    };

    useEffect(() => { fetchContacts(); fetchUnreadCount(); }, []);
    useEffect(() => { fetchMails(); }, [currentFolder]);

    const handleRecipientSearch = (value: string) => {
        setComposeTo(value);
        setShowContactDropdown(true);
        if (value.trim() === '') { setContactSearchResults([]); return; }
        const results = contacts.filter(c => 
            c.name.toLowerCase().includes(value.toLowerCase()) ||
            c.email.toLowerCase().includes(value.toLowerCase())
        );
        setContactSearchResults(results);
    };

    const handleSelectContact = (contact: ContactItem) => {
        setComposeTo(contact.name);
        setComposeToEmail(contact.email);
        setShowContactDropdown(false);
        setContactSearchResults([]);
    };

    const handleSendMail = async () => {
        if (!composeTo || !composeTitle) { alert('받는 사람과 제목을 입력해주세요.'); return; }
        setIsSending(true);
        try {
            const { error } = await mailService.sendMail({
                sender: composeToEmail || composeTo,
                title: composeTitle,
                content: composeContent,
            });
            if (error) throw error;
            alert('메일이 성공적으로 전송되었습니다.');
            setIsComposeOpen(false);
            setComposeTitle(''); setComposeContent(''); setComposeTo(''); setComposeToEmail('');
            if (currentFolder === 'sent') fetchMails();
        } catch (error) {
            alert('메일 전송에 실패했습니다.');
        } finally { setIsSending(false); }
    };

    const handleDeleteMail = async () => {
        if (!selectedMail) return;
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await mailService.deleteMail(selectedMail.id);
            if (!error) { setMails(mails.filter(m => m.id !== selectedMail.id)); setSelectedMail(null); }
        }
    };

    const handleToggleRead = async (mail: MailItem) => {
        const { error } = await mailService.updateMailStatus(mail.id, { isRead: !mail.isRead });
        if (!error) {
            setMails(mails.map(m => m.id === mail.id ? { ...m, isRead: !m.isRead } : m));
            if (selectedMail?.id === mail.id) setSelectedMail({ ...selectedMail, isRead: !mail.isRead });
            fetchUnreadCount(); // 읽음 상태 변경 시 카운트 갱신
        }
    };

    const handleToggleImportant = async (mail: MailItem) => {
        const { error } = await mailService.updateMailStatus(mail.id, { isImportant: !mail.isImportant });
        if (!error) {
            setMails(mails.map(m => m.id === mail.id ? { ...m, isImportant: !m.isImportant } : m));
            if (selectedMail?.id === mail.id) setSelectedMail({ ...selectedMail, isImportant: !mail.isImportant });
        }
    };

    const handleReply = () => {
        if (!selectedMail) return;
        setComposeTo(selectedMail.sender);
        setComposeToEmail(selectedMail.senderEmail || '');
        setComposeTitle(`Re: ${selectedMail.title}`);
        setComposeContent(`\n\n--- 원본 메일 ---\n${selectedMail.content}`);
        setIsComposeOpen(true);
    };

    const handleForward = () => {
        if (!selectedMail) return;
        setComposeTo(''); setComposeToEmail('');
        setComposeTitle(`Fwd: ${selectedMail.title}`);
        setComposeContent(`\n\n--- 전달된 메일 ---\n보낸 사람: ${selectedMail.sender}\n제목: ${selectedMail.title}\n\n${selectedMail.content}`);
        setIsComposeOpen(true);
    };

    const handleQuickReply = async () => {
        if (!selectedMail || !quickReplyContent.trim()) return;
        setIsSending(true);
        try {
            const { error } = await mailService.sendMail({
                sender: selectedMail.senderEmail || selectedMail.sender,
                title: `Re: ${selectedMail.title}`,
                content: quickReplyContent,
            });
            if (error) throw error;
            alert('답장이 전송되었습니다.');
            setQuickReplyContent('');
        } catch { alert('답장 전송에 실패했습니다.'); }
        finally { setIsSending(false); }
    };

    const filteredMails = useMemo(() => {
        return mails.filter(mail => {
            if (searchTerm && !mail.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                !mail.sender.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [mails, searchTerm]);

    const getFolderName = (folder: string) => {
        const names: Record<string, string> = { inbox: '받은 메일함', sent: '보낸 메일함', draft: '임시 보관함', spam: '스팸 메일함', trash: '휴지통' };
        return names[folder] || folder;
    };

    const folderItems = [
        { id: 'inbox' as const, label: '받은 메일함', icon: Inbox, count: unreadCount },
        { id: 'sent' as const, label: '보낸 메일함', icon: Send },
        { id: 'draft' as const, label: '임시 보관함', icon: File },
        { id: 'spam' as const, label: '스팸 메일함', icon: AlertCircle },
        { id: 'trash' as const, label: '휴지통', icon: Trash2 },
    ];

    return (
        <div className="flex h-[calc(100vh-180px)] card-elevated overflow-hidden relative">

            {/* 사이드바 */}
            <div className="w-64 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <div className="p-4">
                    <button
                        onClick={() => { setIsComposeOpen(true); setComposeTo(''); setComposeToEmail(''); setComposeTitle(''); setComposeContent(''); }}
                        className="fab fab-extended w-full"
                        style={{ 
                            background: 'var(--md-sys-color-primary-container)',
                            color: 'var(--md-sys-color-on-primary-container)'
                        }}
                    >
                        <Plus size={20} /> 메일 쓰기
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3">
                    {folderItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => { setCurrentFolder(item.id); setSelectedMail(null); }} 
                            className={`list-item w-full mb-1 flex items-center gap-3 px-4 py-3 ${currentFolder === item.id ? 'active' : ''}`}
                        >
                            <item.icon size={20} className="shrink-0" />
                            <span className="flex-1 text-left text-sm">{item.label}</span>
                            {item.id === 'inbox' && unreadCount > 0 && (
                                <span className="badge ml-auto">{unreadCount}</span>
                            )}
                        </button>
                    ))}

                    <div className="divider my-4" />
                    <p className="px-4 py-2 text-xs font-semibold uppercase"
                       style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        태그
                    </p>
                    {['업무', '공지', '프로젝트', '개인'].map(tag => (
                        <button key={tag} className="list-item w-full mb-1 flex items-center gap-3 px-4 py-2">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${
                                tag === '업무' ? 'bg-blue-500' : tag === '공지' ? 'bg-red-500' : tag === '프로젝트' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="flex-1 text-left text-sm">{tag}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* 메일 목록 */}
            <div className={`flex flex-col border-r transition-all ${selectedMail ? 'w-[340px] shrink-0' : 'flex-1'}`}
                 style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <div className="h-14 border-b flex items-center px-3 gap-2" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <h2 className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {getFolderName(currentFolder)}
                    </h2>
                    <span className="chip-filter text-xs px-2 py-0.5">{filteredMails.length}</span>
                    
                    {/* 검색창 - 메일 미선택시에만 표시 */}
                    {!selectedMail && (
                        <div className="flex-1 max-w-[200px] ml-auto flex items-center gap-2 rounded-full border px-3 py-1.5"
                             style={{ borderColor: 'var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface)' }}>
                            <Search size={14} className="shrink-0" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                            <input
                                type="text"
                                placeholder="메일 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 text-sm bg-transparent outline-none min-w-0"
                                style={{ color: 'var(--md-sys-color-on-surface)' }}
                            />
                        </div>
                    )}
                    
                    <button onClick={fetchMails} className="btn-text p-1.5 ml-auto shrink-0"><RefreshCw size={16} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <Loader2 className="animate-spin" size={32} />
                            <p>메일을 불러오는 중...</p>
                        </div>
                    ) : filteredMails.length > 0 ? (
                        filteredMails.map((mail) => (
                            <div
                                key={mail.id}
                                onClick={() => { setSelectedMail(mail); if (!mail.isRead) handleToggleRead(mail); }}
                                className={`p-4 border-b cursor-pointer transition-all ${
                                    selectedMail?.id === mail.id 
                                        ? 'bg-[var(--md-sys-color-secondary-container)]' 
                                        : 'hover:bg-[var(--md-sys-color-surface-1)]'
                                } ${!mail.isRead ? 'bg-[var(--md-sys-color-primary-container)]/30' : ''}`}
                                style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <button onClick={(e) => { e.stopPropagation(); handleToggleImportant(mail); }}>
                                            <Star size={16} className={mail.isImportant ? 'text-yellow-500 fill-yellow-500' : ''} style={{ color: mail.isImportant ? undefined : 'var(--md-sys-color-outline)' }} />
                                        </button>
                                        <span className={`text-sm truncate ${!mail.isRead ? 'font-semibold' : ''}`} style={{ color: 'var(--md-sys-color-on-surface)' }}>{mail.sender}</span>
                                        {mail.isVip && <span className="chip-filter text-[10px] py-0 px-1.5" style={{ background: 'var(--md-sys-color-warning-container)', color: 'var(--md-sys-color-on-warning-container)' }}>VIP</span>}
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{mail.date}</span>
                                </div>
                                <h4 className={`text-sm mb-1 truncate ${!mail.isRead ? 'font-semibold' : ''}`} style={{ color: 'var(--md-sys-color-on-surface)' }}>{mail.title}</h4>
                                <p className="text-xs truncate" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{mail.preview}</p>
                                {mail.hasAttachment && (
                                    <div className="flex gap-2 mt-2">
                                        <span className="chip-assist text-[10px] py-0.5"><Paperclip size={10} /> 첨부</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <Inbox size={48} className="mb-4 opacity-30" />
                            <p>메일이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 메일 상세 */}
            <div className={`flex-1 min-w-0 flex flex-col ${selectedMail ? 'flex' : 'hidden lg:flex'}`} style={{ background: 'var(--md-sys-color-surface-1)' }}>
                {selectedMail ? (
                    <div className="flex-col h-full flex animate-fade-in">
                        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface)' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-2">
                                    <button onClick={handleReply} className="btn-tonal py-2 px-3"><Reply size={18} /> 답장</button>
                                    <button onClick={handleForward} className="btn-outlined py-2 px-3"><Forward size={18} /></button>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleToggleImportant(selectedMail)} className={`btn-text p-2 ${selectedMail.isImportant ? 'text-yellow-500' : ''}`}><Star size={18} className={selectedMail.isImportant ? 'fill-yellow-500' : ''} /></button>
                                    <button className="btn-text p-2"><Archive size={18} /></button>
                                    <button onClick={handleDeleteMail} className="btn-text p-2 hover:text-red-500"><Trash2 size={18} /></button>
                                    <button onClick={() => setSelectedMail(null)} className="btn-text p-2 xl:hidden"><X size={18} /></button>
                                </div>
                            </div>
                            <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--md-sys-color-on-surface)' }}>{selectedMail.title}</h1>
                            <div className="flex items-center gap-4">
                                <div className={`avatar ${selectedMail.isVip ? '' : ''}`} style={{ 
                                    background: selectedMail.isVip ? 'var(--md-sys-color-warning-container)' : 'var(--md-sys-color-primary-container)',
                                    color: selectedMail.isVip ? 'var(--md-sys-color-on-warning-container)' : 'var(--md-sys-color-on-primary-container)'
                                }}>{selectedMail.sender[0]}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{selectedMail.sender}</span>
                                        {selectedMail.isVip && <span className="chip-filter text-[10px] py-0 px-1.5" style={{ background: 'var(--md-sys-color-warning-container)', color: 'var(--md-sys-color-on-warning-container)' }}>VIP</span>}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>&lt;{selectedMail.senderEmail || 'email@example.com'}&gt;</span>
                                        <span className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{selectedMail.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                {selectedMail.content?.replace(/\\n/g, '\n')}
                            </div>
                            {selectedMail.hasAttachment && (
                                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                    <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>첨부파일</p>
                                    <div className="card-outlined p-3 flex items-center gap-3 max-w-sm cursor-pointer hover:border-[var(--md-sys-color-primary)]">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--md-sys-color-error-container)' }}>
                                            <File size={20} style={{ color: 'var(--md-sys-color-on-error-container)' }} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm" style={{ color: 'var(--md-sys-color-on-surface)' }}>Project_Report.pdf</p>
                                            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>2.4 MB</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface)' }}>
                            <div className="flex gap-3 items-center">
                                <div className="avatar avatar-sm" style={{ background: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>나</div>
                                <div className="flex-1 relative">
                                    <input type="text" placeholder="빠른 답장..." value={quickReplyContent} onChange={(e) => setQuickReplyContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickReply()} className="input-outlined py-2.5 pr-12 rounded-full" />
                                    <button onClick={handleQuickReply} disabled={!quickReplyContent.trim() || isSending} className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-filled py-1.5 px-3 rounded-full disabled:opacity-50"><Send size={14} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--md-sys-color-surface-2)' }}>
                            <Mail size={40} style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
                        </div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--md-sys-color-on-surface)' }}>메일을 선택하세요</h3>
                        <p className="text-sm" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>목록에서 메일을 클릭하여 내용을 확인하세요.</p>
                    </div>
                )}
            </div>

            {/* 메일 작성 모달 */}
            {isComposeOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-8 animate-fade-in" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="card-elevated w-full max-w-3xl h-[75vh] flex flex-col animate-scale-in">
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--md-sys-color-on-surface)' }}>새 메일</h2>
                            <button onClick={() => setIsComposeOpen(false)} className="btn-text p-2"><X size={20} /></button>
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 py-3 border-b flex items-center gap-4" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                <span className="text-sm font-medium w-16" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>받는 사람</span>
                                <div className="flex-1 relative">
                                    <input type="text" className="w-full outline-none" style={{ color: 'var(--md-sys-color-on-surface)' }} placeholder="이름 또는 이메일 검색" value={composeTo} onChange={(e) => handleRecipientSearch(e.target.value)} onFocus={() => setShowContactDropdown(true)} autoFocus />
                                    {composeToEmail && <span className="text-sm ml-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>&lt;{composeToEmail}&gt;</span>}
                                    {showContactDropdown && contactSearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 card-elevated max-h-48 overflow-y-auto z-50">
                                            {contactSearchResults.map(contact => (
                                                <div key={contact.id} onClick={() => handleSelectContact(contact)} className="list-item cursor-pointer">
                                                    <div className={`avatar avatar-sm`} style={{ background: contact.isVip ? 'var(--md-sys-color-warning-container)' : 'var(--md-sys-color-primary-container)', color: contact.isVip ? 'var(--md-sys-color-on-warning-container)' : 'var(--md-sys-color-on-primary-container)' }}>{contact.name[0]}</div>
                                                    <div className="flex-1">
                                                        <span className="font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>{contact.name}</span>
                                                        <span className="text-sm ml-2" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{contact.email}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-3 border-b flex items-center gap-4" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                                <span className="text-sm font-medium w-16" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>제목</span>
                                <input type="text" className="flex-1 outline-none font-medium" style={{ color: 'var(--md-sys-color-on-surface)' }} placeholder="제목을 입력하세요" value={composeTitle} onChange={(e) => setComposeTitle(e.target.value)} />
                            </div>
                            <textarea className="flex-1 p-6 outline-none resize-none" style={{ color: 'var(--md-sys-color-on-surface)' }} placeholder="내용을 작성하세요..." value={composeContent} onChange={(e) => setComposeContent(e.target.value)} />
                        </div>
                        <div className="px-6 py-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
                            <button className="btn-text"><Paperclip size={20} /></button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsComposeOpen(false)} className="btn-outlined">취소</button>
                                <button onClick={handleSendMail} disabled={isSending} className="btn-filled disabled:opacity-50">
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> 보내기</>}
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


