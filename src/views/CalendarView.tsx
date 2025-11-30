import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Settings, Search, Plus, X, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, Trash2, Edit2, Loader2 } from 'lucide-react';
import { CalendarEvent } from '../types';
import { calendarService } from '../services/calendarService';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * CalendarView 컴포넌트
 * 
 * 일정 관리 기능을 제공하는 달력 뷰입니다.
 * 
 * 주요 기능:
 * - 월간 달력 표시
 * - 일정 추가/수정/삭제 (Supabase DB 연동)
 * - 카테고리별 필터링 (개인/팀/전사)
 * - 날짜 클릭으로 바로 일정 추가
 * - 모달 외부 클릭 시 닫기
 */

// 일정 색상 옵션
const COLOR_OPTIONS = [
    { value: 'bg-blue-100 text-blue-700 border-l-4 border-blue-600', label: '파랑', color: 'bg-blue-500' },
    { value: 'bg-purple-100 text-purple-700 border-l-4 border-purple-600', label: '보라', color: 'bg-purple-500' },
    { value: 'bg-green-100 text-green-700 border-l-4 border-green-600', label: '초록', color: 'bg-green-500' },
    { value: 'bg-orange-100 text-orange-700 border-l-4 border-orange-600', label: '주황', color: 'bg-orange-500' },
    { value: 'bg-red-100 text-red-700 border-l-4 border-red-600', label: '빨강', color: 'bg-red-500' },
    { value: 'bg-gray-100 text-gray-700 border-l-4 border-gray-600', label: '회색', color: 'bg-gray-500' },
];

const CalendarView: React.FC = () => {
    // 현재 표시 중인 월
    const [currentDate, setCurrentDate] = useState(new Date());
    // 일정 목록
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    // 로딩 상태
    const [loading, setLoading] = useState(true);
    // 일정 추가/수정 모달 표시 여부
    const [showAddModal, setShowAddModal] = useState(false);
    // 선택된 일정 (상세 보기용)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    // 수정 모드 여부
    const [isEditing, setIsEditing] = useState(false);
    // 클릭한 날짜 (새 일정 추가 시 기본값)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // 카테고리 필터 상태 (체크박스 연동)
    const [filters, setFilters] = useState({
        personal: true,  // 개인 일정
        team: true,      // 팀 일정
        company: true    // 전사 일정
    });

    // 폼 상태
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({});

    // 모달 외부 클릭 감지를 위한 ref
    const modalRef = useRef<HTMLDivElement>(null);

    /**
     * Supabase에서 일정 목록을 가져옵니다.
     */
    const fetchEvents = async () => {
        setLoading(true);
        const { data, error } = await calendarService.getEvents();
        if (error) {
            console.error('일정 불러오기 실패:', error);
        } else {
            setEvents(data || []);
        }
        setLoading(false);
    };

    // 컴포넌트 마운트 시 일정 로드
    useEffect(() => {
        fetchEvents();
    }, []);

    /**
     * 모달 외부 클릭 시 닫기 처리
     * 요청사항: 빈 공간을 클릭했을 때 창이 닫히도록
     */
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                // 모달 외부 클릭 시 모든 모달 닫기
                setSelectedEvent(null);
                setShowAddModal(false);
            }
        };

        // 모달이 열려있을 때만 이벤트 리스너 등록
        if (selectedEvent || showAddModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedEvent, showAddModal]);

    /**
     * 일정 저장 (추가 또는 수정)
     */
    const handleSave = async () => {
        if (!formData.title || !formData.startDate || !formData.endDate) {
            alert('제목과 날짜를 입력해주세요.');
            return;
        }

        // 기본값 설정
        const eventToSave = {
            ...formData,
            type: formData.type || 'personal',
            color: formData.color || COLOR_OPTIONS[0].value
        };

        if (isEditing && selectedEvent) {
            // 수정 모드
            const { data, error } = await calendarService.updateEvent(selectedEvent.id, eventToSave);
            if (!error && data) {
                setEvents(events.map(e => e.id === data.id ? data : e));
                setIsEditing(false);
                setSelectedEvent(null);
                setShowAddModal(false);
            }
        } else {
            // 추가 모드
            const { data, error } = await calendarService.createEvent(eventToSave as Omit<CalendarEvent, 'id'>);
            if (!error && data) {
                setEvents([...events, data]);
                setShowAddModal(false);
            }
        }
    };

    /**
     * 일정 삭제
     */
    const handleDelete = async (id: number) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await calendarService.deleteEvent(id);
            if (!error) {
                setEvents(events.filter(e => e.id !== id));
                setSelectedEvent(null);
            }
        }
    };

    /**
     * 새 일정 추가 모달 열기
     */
    const startCreate = (date?: Date) => {
        const targetDate = date || new Date();
        setShowAddModal(true);
        setIsEditing(false);
        setSelectedEvent(null);
        setFormData({
            title: '',
            startDate: targetDate,
            endDate: addDays(targetDate, 0), // 같은 날 종료
            type: 'personal',
            color: COLOR_OPTIONS[0].value
        });
    };

    /**
     * 기존 일정 수정 모달 열기
     */
    const startEdit = (event: CalendarEvent) => {
        setIsEditing(true);
        setFormData(event);
        setShowAddModal(true);
        setSelectedEvent(null);
    };

    /**
     * 월 이동
     */
    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    /**
     * 달력 날짜 배열 생성
     */
    const generateCalendarDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const days = [];
        let day = startDate;

        while (day <= endDate) {
            days.push({
                day: format(day, 'd'),
                currentMonth: isSameMonth(day, monthStart),
                date: new Date(day)
            });
            day = addDays(day, 1);
        }
        return days;
    };

    /**
     * 필터링된 일정 목록
     * 체크박스 상태에 따라 일정을 필터링합니다.
     */
    const filteredEvents = events.filter(event => {
        if (event.type === 'personal' && !filters.personal) return false;
        if (event.type === 'team' && !filters.team) return false;
        if (event.type === 'company' && !filters.company) return false;
        return true;
    });

    /**
     * 날짜 클릭 핸들러
     * 요청사항: 달력에서 해당 일자를 클릭하면 바로 일정을 추가할 수 있게
     */
    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        startCreate(date);
    };

    const calendarDays = generateCalendarDays();
    const year = currentDate.getFullYear();
    const currentMonthName = format(currentDate, 'M월', { locale: ko });

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 relative">

            {/* ========================================
                좌측 사이드바
            ======================================== */}
            <div className="w-72 bg-gray-50 border-r border-gray-200 p-6 hidden md:flex flex-col">
                {/* 일정 등록 버튼 */}
                <button
                    onClick={() => startCreate()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors mb-8 flex items-center justify-center gap-2 transform active:scale-95 duration-150"
                >
                    <Plus size={18} /> 일정 등록
                </button>

                {/* 미니 달력 */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg text-slate-800">{year}년 {currentMonthName}</span>
                        <div className="flex gap-1">
                            <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-200 rounded text-slate-500">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-200 rounded text-slate-500">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 mb-2">
                        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                    </div>
                    <div className="grid grid-cols-7 text-center gap-y-3">
                        {calendarDays.slice(0, 35).map((d, i) => {
                            const isSelected = isSameDay(d.date, currentDate);
                            const isToday = isSameDay(d.date, new Date());
                            return (
                                <div
                                    key={i}
                                    onClick={() => setCurrentDate(d.date)}
                                    className={`text-sm w-8 h-8 flex items-center justify-center rounded-full mx-auto cursor-pointer transition-all
                                        ${!d.currentMonth ? 'text-gray-300' : 'text-slate-700 hover:bg-blue-100'}
                                        ${isSelected ? 'bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md' : ''}
                                        ${isToday && !isSelected ? 'ring-2 ring-blue-400' : ''}
                                    `}
                                >
                                    {d.day}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 내 캘린더 (필터 체크박스) */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 text-sm">내 캘린더</h4>
                    <div className="space-y-2">
                        {/* 개인 일정 필터 */}
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input 
                                type="checkbox" 
                                checked={filters.personal}
                                onChange={(e) => setFilters({ ...filters, personal: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            기본 캘린더 (개인)
                        </label>
                        {/* 팀 일정 필터 */}
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input 
                                type="checkbox" 
                                checked={filters.team}
                                onChange={(e) => setFilters({ ...filters, team: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                            프로젝트 일정 (팀)
                        </label>
                        {/* 전사 일정 필터 */}
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input 
                                type="checkbox" 
                                checked={filters.company}
                                onChange={(e) => setFilters({ ...filters, company: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            전사 일정
                        </label>
                    </div>
                </div>
            </div>

            {/* ========================================
                메인 캘린더 영역
            ======================================== */}
            <div className="flex-1 flex flex-col bg-white">
                {/* 헤더 */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800">{year}년 {currentMonthName}</h2>
                        <div className="flex gap-2">
                            <button onClick={() => navigateMonth('prev')} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-500">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 text-slate-600">
                                오늘
                            </button>
                            <button onClick={() => navigateMonth('next')} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-slate-500">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 뷰 전환 버튼 */}
                        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                            <button className="px-3 py-1 bg-white shadow-sm rounded-md text-sm font-bold text-slate-800">월간</button>
                            <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-800">주간</button>
                            <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-800">일간</button>
                        </div>
                        <div className="relative">
                            <input type="text" placeholder="일정 검색" className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                        <button className="p-2 text-slate-500 hover:bg-gray-100 rounded-lg">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                        <div key={day} className={`py-3 text-center text-sm font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* 달력 그리드 */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
                    {loading ? (
                        <div className="col-span-7 row-span-6 flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : calendarDays.map((dateObj, idx) => {
                        // 해당 날짜의 일정 (필터링 적용)
                        const dayEvents = filteredEvents.filter(e => isSameDay(e.startDate, dateObj.date));
                        const isToday = isSameDay(dateObj.date, new Date());

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDateClick(dateObj.date)}
                                className={`border-b border-r border-gray-100 p-1 relative hover:bg-blue-50/30 transition-colors min-h-[100px] flex flex-col gap-1 overflow-hidden cursor-pointer
                                    ${!dateObj.currentMonth ? 'bg-gray-50/30' : ''}
                                `}
                            >
                                {/* 날짜 숫자 */}
                                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ml-1 mt-1
                                    ${!dateObj.currentMonth ? 'text-gray-300' : (idx % 7 === 0 ? 'text-red-500' : idx % 7 === 6 ? 'text-blue-500' : 'text-slate-700')}
                                    ${isToday ? 'bg-blue-600 text-white shadow-md' : ''}
                                `}>
                                    {dateObj.day}
                                </span>

                                {/* 일정 목록 */}
                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                                    {dayEvents.slice(0, 3).map(evt => (
                                        <div
                                            key={evt.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); }}
                                            className={`text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-[1.02] ${evt.color}`}
                                        >
                                            {evt.type !== 'personal' && <span className="font-bold mr-1">{format(evt.startDate, 'HH:mm')}</span>}
                                            {evt.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <span className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3}개 더</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ========================================
                일정 추가/수정 모달
            ======================================== */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div 
                        ref={modalRef}
                        className="bg-white rounded-2xl shadow-2xl w-[500px] overflow-hidden transform transition-all scale-100"
                    >
                        <div className="h-14 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between px-6">
                            <h3 className="text-white font-bold">{isEditing ? '일정 수정' : '새 일정 등록'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* 제목 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">제목</label>
                                <input
                                    type="text"
                                    placeholder="일정 제목을 입력하세요"
                                    className="w-full border-b-2 border-gray-200 focus:border-blue-600 py-2 text-lg font-bold outline-none bg-transparent"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            {/* 날짜/시간 */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">시작 일시</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-0 top-2.5 text-slate-400" size={16} />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-6 py-2 border-b border-gray-200 outline-none font-medium text-slate-700"
                                            value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">종료 일시</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-0 top-2.5 text-slate-400" size={16} />
                                        <input
                                            type="datetime-local"
                                            className="w-full pl-6 py-2 border-b border-gray-200 outline-none font-medium text-slate-700"
                                            value={formData.endDate ? format(formData.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
                                            onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 유형 선택 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">유형</label>
                                <select
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.type || 'personal'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="personal">개인</option>
                                    <option value="team">팀</option>
                                    <option value="company">전사</option>
                                </select>
                            </div>

                            {/* 색상 선택 */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">색상</label>
                                <div className="flex gap-2">
                                    {COLOR_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setFormData({ ...formData, color: option.value })}
                                            className={`w-8 h-8 rounded-full ${option.color} transition-transform hover:scale-110 ${formData.color === option.value ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                                            title={option.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">
                                취소
                            </button>
                            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================
                일정 상세 보기 모달
            ======================================== */}
            {selectedEvent && !showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div 
                        ref={modalRef}
                        className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden"
                    >
                        {/* 헤더 (색상 배경) */}
                        <div className={`h-32 p-6 flex flex-col justify-between text-slate-800 relative overflow-hidden ${selectedEvent.color?.split(' ')[0] || 'bg-blue-100'}`}>
                            <div className="flex justify-between items-start z-10">
                                <span className="px-2 py-1 bg-white/50 backdrop-blur-sm rounded text-xs font-bold uppercase">
                                    {selectedEvent.type === 'personal' ? '개인' : selectedEvent.type === 'team' ? '팀' : '전사'}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => startEdit(selectedEvent)} className="p-1 hover:bg-black/10 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-black/10 rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold z-10 leading-tight">{selectedEvent.title}</h2>
                        </div>

                        {/* 상세 정보 */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-start gap-4">
                                <Clock className="text-slate-400 mt-1" size={20} />
                                <div>
                                    <p className="font-bold text-slate-800">
                                        {format(selectedEvent.startDate, 'yyyy년 M월 d일', { locale: ko })}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {format(selectedEvent.startDate, 'HH:mm')} - {format(selectedEvent.endDate, 'HH:mm')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <AlignLeft className="text-slate-400 mt-1" size={20} />
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    이 일정에 대한 상세 설명이 여기에 표시됩니다.
                                </p>
                            </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => startEdit(selectedEvent)} 
                                className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-slate-600 hover:bg-gray-100 transition-colors"
                            >
                                수정
                            </button>
                            <button 
                                onClick={() => handleDelete(selectedEvent.id)} 
                                className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
