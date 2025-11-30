import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Building2, Star, Plus, Trash2, Edit2, X, Save, Loader2, Users, Filter } from 'lucide-react';
import { ContactItem } from '../types';
import { contactService } from '../services/contactService';

/**
 * ContactView 컴포넌트
 * 
 * 연락처 관리 기능을 제공하는 뷰입니다.
 * 
 * 주요 기능:
 * - 연락처 목록 조회 (Supabase DB 연동)
 * - 연락처 추가/수정/삭제
 * - VIP 표시 (노란색 별표로 강조)
 * - 그룹별 필터링
 * - 이름/부서 검색
 */

const ContactView: React.FC = () => {
    // 연락처 목록
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    // 선택된 연락처
    const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
    // 검색어
    const [searchTerm, setSearchTerm] = useState('');
    // 로딩 상태
    const [loading, setLoading] = useState(true);
    // 수정 모드
    const [isEditing, setIsEditing] = useState(false);
    // 추가 모드
    const [isCreating, setIsCreating] = useState(false);
    // 선택된 그룹 필터
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // 폼 상태
    const [formData, setFormData] = useState<Partial<ContactItem>>({});

    /**
     * Supabase에서 연락처 목록을 가져옵니다.
     */
    const fetchContacts = async () => {
        setLoading(true);
        const { data, error } = await contactService.getContacts();
        if (error) {
            console.error('연락처 불러오기 실패:', error);
        } else {
            setContacts(data || []);
        }
        setLoading(false);
    };

    // 컴포넌트 마운트 시 연락처 로드
    useEffect(() => {
        fetchContacts();
    }, []);

    /**
     * 연락처 검색
     */
    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.trim() === '') {
            fetchContacts();
            return;
        }
        const { data } = await contactService.searchContacts(term);
        if (data) setContacts(data);
    };

    /**
     * 연락처 삭제
     */
    const handleDelete = async (id: number) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await contactService.deleteContact(id);
            if (!error) {
                setContacts(contacts.filter(c => c.id !== id));
                setSelectedContact(null);
            }
        }
    };

    /**
     * 연락처 저장 (추가 또는 수정)
     */
    const handleSave = async () => {
        if (!formData.name) {
            alert('이름을 입력해주세요.');
            return;
        }

        if (isCreating) {
            // 추가
            const { data, error } = await contactService.createContact(formData as Omit<ContactItem, 'id'>);
            if (!error && data) {
                setContacts([...contacts, data]);
                setIsCreating(false);
                setSelectedContact(data);
            }
        } else if (isEditing && selectedContact) {
            // 수정
            const { data, error } = await contactService.updateContact(selectedContact.id, formData);
            if (!error && data) {
                setContacts(contacts.map(c => c.id === data.id ? data : c));
                setIsEditing(false);
                setSelectedContact(data);
            }
        }
    };

    /**
     * 새 연락처 추가 시작
     */
    const startCreate = () => {
        setIsCreating(true);
        setIsEditing(false);
        setSelectedContact(null);
        setFormData({
            name: '',
            position: '',
            department: '',
            email: '',
            phone: '',
            company: 'ChungAng SDS',
            group: '팀원',
            isVip: false
        });
    };

    /**
     * 연락처 수정 시작
     */
    const startEdit = (contact: ContactItem) => {
        setIsEditing(true);
        setIsCreating(false);
        setFormData(contact);
    };

    /**
     * VIP 토글
     */
    const handleToggleVip = async (contact: ContactItem) => {
        const { data, error } = await contactService.updateContact(contact.id, { isVip: !contact.isVip });
        if (!error && data) {
            setContacts(contacts.map(c => c.id === data.id ? data : c));
            if (selectedContact?.id === contact.id) {
                setSelectedContact(data);
            }
        }
    };

    // 그룹 목록 추출 (중복 제거)
    const groups = Array.from(new Set(contacts.map(c => c.group).filter(Boolean)));

    // 필터링된 연락처 목록
    const filteredContacts = contacts.filter(contact => {
        if (selectedGroup && contact.group !== selectedGroup) return false;
        return true;
    }).sort((a, b) => {
        // VIP를 먼저 표시
        if (a.isVip && !b.isVip) return -1;
        if (!a.isVip && b.isVip) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">

            {/* ========================================
                좌측 연락처 목록
            ======================================== */}
            <div className="w-96 border-r border-gray-200 flex flex-col bg-white">
                {/* 헤더 */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-500" size={20} />
                            연락처
                            <span className="text-sm font-normal text-slate-400">({contacts.length})</span>
                        </h2>
                        <button
                            onClick={startCreate}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-xs font-bold shadow-sm shadow-blue-200"
                        >
                            <Plus size={14} /> 추가
                        </button>
                    </div>

                    {/* 검색 */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="이름, 부서 검색"
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* 그룹 필터 */}
                <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${!selectedGroup ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        전체
                    </button>
                    {groups.map(group => (
                        <button
                            key={group}
                            onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedGroup === group ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {group}
                        </button>
                    ))}
                </div>

                {/* 연락처 목록 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 py-2 text-xs font-bold text-slate-400 uppercase bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100">
                        전체 연락처 ({filteredContacts.length})
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-blue-500" />
                        </div>
                    ) : (
                        filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => {
                                    if (!isCreating && !isEditing) {
                                        setSelectedContact(contact);
                                    }
                                }}
                                className={`flex items-center gap-4 p-4 border-b border-gray-50 cursor-pointer transition-all hover:pl-5
                                    ${selectedContact?.id === contact.id ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                                `}
                            >
                                {/* 아바타 */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm relative
                                    ${contact.isVip 
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                                        : selectedContact?.id === contact.id 
                                            ? 'bg-blue-200 text-blue-700' 
                                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'
                                    }
                                `}>
                                    {contact.name[0]}
                                    {/* VIP 뱃지 */}
                                    {contact.isVip && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                        </div>
                                    )}
                                </div>

                                {/* 정보 */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-sm truncate flex items-center gap-2 ${selectedContact?.id === contact.id ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {contact.name}
                                        <span className="text-slate-500 font-normal text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                            {contact.position}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{contact.department} | {contact.company}</p>
                                </div>

                                {/* VIP 별표 - 요청사항: 노란색 별표로 VIP 구분 */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleVip(contact); }}
                                    className={`p-1 rounded transition-colors ${contact.isVip ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
                                >
                                    <Star size={18} className={contact.isVip ? 'fill-yellow-400' : ''} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ========================================
                우측 상세 정보
            ======================================== */}
            <div className="flex-1 bg-gray-50/50 flex items-center justify-center p-8 relative">
                {/* 배경 효과 */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply filter opacity-50 pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl mix-blend-multiply filter opacity-50 pointer-events-none"></div>

                {(isCreating || isEditing) ? (
                    // 추가/수정 폼
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/50 backdrop-blur-sm z-10 p-8">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">
                            {isCreating ? '새 연락처 추가' : '연락처 수정'}
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">이름 *</label>
                                    <input 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.name || ''} 
                                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                        placeholder="이름을 입력하세요"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">직책</label>
                                    <input 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.position || ''} 
                                        onChange={e => setFormData({ ...formData, position: e.target.value })} 
                                        placeholder="예: 선임, 수석"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">부서</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.department || ''} 
                                    onChange={e => setFormData({ ...formData, department: e.target.value })} 
                                    placeholder="예: 디지털혁신팀"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">이메일</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.email || ''} 
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    placeholder="example@b2b.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">전화번호</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.phone || ''} 
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                    placeholder="010-0000-0000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">회사</label>
                                    <input 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.company || ''} 
                                        onChange={e => setFormData({ ...formData, company: e.target.value })} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">그룹</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.group || '팀원'} 
                                        onChange={e => setFormData({ ...formData, group: e.target.value })}
                                    >
                                        <option value="팀원">팀원</option>
                                        <option value="협력부서">협력부서</option>
                                        <option value="임원">임원</option>
                                        <option value="외부">외부</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="isVip" 
                                    checked={formData.isVip || false} 
                                    onChange={e => setFormData({ ...formData, isVip: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                />
                                <label htmlFor="isVip" className="text-sm text-slate-700 flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    VIP 고객으로 설정
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-8">
                            <button 
                                onClick={() => { setIsCreating(false); setIsEditing(false); }} 
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition-colors"
                            >
                                <Save size={16} /> 저장
                            </button>
                        </div>
                    </div>
                ) : selectedContact ? (
                    // 상세 보기
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-white/50 backdrop-blur-sm z-10 transform transition-all duration-500 hover:scale-[1.01]">
                        {/* 헤더 */}
                        <div className={`h-48 relative p-6 flex flex-col items-center justify-center text-white overflow-hidden ${
                            selectedContact.isVip 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                        }`}>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            
                            {/* 액션 버튼 */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    onClick={() => startEdit(selectedContact)} 
                                    className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(selectedContact.id)} 
                                    className="text-white/80 hover:text-red-300 p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* 아바타 */}
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center mb-4 shadow-xl group-hover:scale-105 transition-transform">
                                    <span className="text-3xl font-bold text-white">{selectedContact.name[0]}</span>
                                </div>
                                {/* VIP 뱃지 */}
                                {selectedContact.isVip && (
                                    <div className="absolute -top-1 -right-1 bg-white text-yellow-500 p-1.5 rounded-full shadow-md">
                                        <Star size={14} fill="currentColor" />
                                    </div>
                                )}
                            </div>

                            {/* 이름 및 직책 */}
                            <h2 className="text-2xl font-bold mb-1 tracking-tight">{selectedContact.name}</h2>
                            <p className="text-white/80 text-sm font-medium bg-white/20 px-3 py-0.5 rounded-full backdrop-blur-sm">
                                {selectedContact.department} {selectedContact.position}
                            </p>
                        </div>

                        {/* 정보 카드 */}
                        <div className="p-8">
                            <div className="flex justify-center gap-3 mb-8 -mt-2">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 shadow-sm">
                                    {selectedContact.group}
                                </span>
                                {selectedContact.isVip && (
                                    <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-100 shadow-sm flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> VIP 고객
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* 이메일 */}
                                <a 
                                    href={`mailto:${selectedContact.email}`}
                                    className="flex items-center gap-5 p-4 bg-white rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer group border border-gray-100 hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <Mail size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                                        <p className="text-slate-800 font-bold text-base group-hover:text-blue-700 transition-colors">
                                            {selectedContact.email}
                                        </p>
                                    </div>
                                </a>

                                {/* 전화번호 */}
                                <a 
                                    href={`tel:${selectedContact.phone}`}
                                    className="flex items-center gap-5 p-4 bg-white rounded-2xl hover:bg-green-50 transition-colors cursor-pointer group border border-gray-100 hover:border-green-200 hover:shadow-md"
                                >
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm group-hover:bg-green-500 group-hover:text-white transition-all">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phone</p>
                                        <p className="text-slate-800 font-bold text-base group-hover:text-green-700 transition-colors">
                                            {selectedContact.phone}
                                        </p>
                                    </div>
                                </a>

                                {/* 회사 */}
                                <div className="flex items-center gap-5 p-4 bg-white rounded-2xl hover:bg-purple-50 transition-colors cursor-pointer group border border-gray-100 hover:border-purple-200 hover:shadow-md">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-sm group-hover:bg-purple-500 group-hover:text-white transition-all">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Company</p>
                                        <p className="text-slate-800 font-bold text-base">{selectedContact.company}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 빈 상태
                    <div className="text-center text-slate-400 z-10">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <User size={48} className="opacity-30" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600 mb-2">연락처 상세 정보</h3>
                        <p>목록에서 연락처를 선택하여 정보를 확인하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactView;
