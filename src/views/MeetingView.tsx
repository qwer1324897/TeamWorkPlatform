import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Lock, Calendar, Video, Mic, X, Clock, Users, Link, Copy, Loader2 } from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { MeetingRoomItem } from '../types';

const MeetingView: React.FC = () => {
    const [activeModal, setActiveModal] = useState<'schedule' | 'instant' | 'join' | null>(null);
    const [activeMeetingUrl, setActiveMeetingUrl] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Real Data States
    const [meetingRooms, setMeetingRooms] = useState<MeetingRoomItem[]>([]);
    const [myReservations, setMyReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Schedule Form States
    const [scheduleTitle, setScheduleTitle] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const { data: rooms, error: roomsError } = await meetingService.getMeetingRooms(today);
        const { data: reservations, error: reservationsError } = await meetingService.getMyReservations('나'); // 임시 사용자

        if (roomsError) console.error('Error fetching rooms:', roomsError);
        if (reservationsError) console.error('Error fetching reservations:', reservationsError);

        setMeetingRooms(rooms || []);
        setMyReservations(reservations || []);
        setLoading(false);
    };

    // 30분마다 자동 갱신되는 난수 코드 생성 (데모용)
    const generateMeetingCode = () => {
        return 'b2b-' + Math.random().toString(36).substring(7);
    };

    const startMeeting = (roomName: string) => {
        // Jitsi Meet 무료 서버 사용
        const domain = 'meet.jit.si';
        const url = `https://${domain}/${roomName}`;
        setActiveMeetingUrl(url);
        setActiveModal(null);
    };

    const closeModal = () => {
        setActiveModal(null);
        setJoinCode('');
        setScheduleTitle('');
        setScheduleDate('');
        setScheduleTime('');
        setSelectedRoomId(null);
    };

    const handleCopyLink = (code: string) => {
        navigator.clipboard.writeText(`https://meet.jit.si/${code}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleReserve = async () => {
        if (!selectedRoomId || !scheduleDate || !scheduleTime || !scheduleTitle) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const { error } = await meetingService.reserveMeetingRoom(
            selectedRoomId,
            scheduleDate,
            scheduleTime,
            scheduleTitle,
            '나'
        );

        if (error) {
            alert('예약 실패: ' + error.message);
        } else {
            alert('회의가 예약되었습니다.');
            closeModal();
            fetchData();
        }
    };

    // 화상회의 중일 때 렌더링
    if (activeMeetingUrl) {
        return (
            <div className="relative h-[calc(100vh-100px)] bg-slate-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-fade-in">
                <div className="flex-1 relative">
                    <iframe
                        src={`${activeMeetingUrl}#config.prejoinPageEnabled=false`} // 프리조인 페이지 스킵
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="w-full h-full border-none"
                        title="B2B Meeting"
                    ></iframe>
                </div>
                <button
                    onClick={() => setActiveMeetingUrl(null)}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-50 flex items-center gap-2"
                >
                    <X size={18} /> 회의 종료
                </button>
            </div>
        );
    }

    // 대시보드 화면 렌더링
    return (
        <div className="relative h-[calc(100vh-100px)] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 z-0"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay z-0 animate-pulse"></div>

            <div className="absolute bottom-8 right-8 z-20">
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white text-sm hover:bg-white/20 hover:border-white transition-all backdrop-blur-md shadow-lg"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 새로고침
                </button>
            </div>

            <div className="z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between px-12 gap-16">

                <div className="text-white lg:w-1/2">
                    <div className="inline-block px-3 py-1 bg-indigo-500/30 border border-indigo-400/50 rounded-full text-indigo-200 text-xs font-bold mb-6">
                        기업용 화상회의 솔루션
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight tracking-tight">
                        언제 어디서나<br />
                        끊김 없는 협업
                    </h1>
                    <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                        별도의 프로그램 설치 없이,<br />브라우저에서 바로 고화질 회의를 시작하세요.
                    </p>

                    <div className="flex gap-4 mb-12">
                        <button onClick={() => setActiveModal('schedule')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2 transform hover:-translate-y-1">
                            <Calendar size={20} /> 회의 예약하기
                        </button>
                        <button onClick={() => setActiveModal('instant')} className="px-8 py-4 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 transform hover:-translate-y-1">
                            <Video size={20} /> 즉시 회의 시작
                        </button>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md max-w-md">
                        <p className="text-slate-300 text-sm mb-3 pl-1 font-medium">참여 코드로 입장</p>
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></div>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && startMeeting(joinCode)}
                                placeholder="회의 코드 입력 (예: b2b-meeting)"
                                className="w-full pl-11 pr-12 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <button
                                onClick={() => joinCode && startMeeting(joinCode)}
                                className="absolute right-2 top-2 w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl w-full max-w-md h-[500px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-lg text-slate-800">오늘의 회의</h3>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{myReservations.length}건 예정</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : myReservations.length === 0 ? (
                            <div className="text-center text-slate-400 p-4">예정된 회의가 없습니다.</div>
                        ) : (
                            myReservations.map((res: any) => (
                                <div key={res.id} onClick={() => startMeeting(res.meeting_rooms?.name || 'meeting')} className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{res.time_slot}</div>
                                        <Video size={16} className="text-gray-300 group-hover:text-blue-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1 group-hover:text-blue-600">{res.title}</h4>
                                    <p className="text-xs text-slate-500">장소: {res.meeting_rooms?.name}</p>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                                        <span className="text-xs font-bold text-blue-600 group-hover:underline">참여하기 &gt;</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {activeModal === 'schedule' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20} /> 새 회의 예약</h3>
                            <button onClick={closeModal} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">회의 제목</label>
                                <input
                                    type="text"
                                    placeholder="회의 제목을 입력하세요"
                                    className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:border-blue-600 outline-none transition-colors"
                                    value={scheduleTitle}
                                    onChange={(e) => setScheduleTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">회의실 선택</label>
                                <select
                                    className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                    value={selectedRoomId || ''}
                                    onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                                >
                                    <option value="">회의실을 선택하세요</option>
                                    {meetingRooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name} ({room.capacity}명)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">날짜</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">시간</label>
                                    <select
                                        className="w-full bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-blue-500"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                    >
                                        <option value="">시간 선택</option>
                                        <option value="09:00">09:00 - 10:00</option>
                                        <option value="10:00">10:00 - 11:00</option>
                                        <option value="11:00">11:00 - 12:00</option>
                                        <option value="13:00">13:00 - 14:00</option>
                                        <option value="14:00">14:00 - 15:00</option>
                                        <option value="15:00">15:00 - 16:00</option>
                                        <option value="16:00">16:00 - 17:00</option>
                                        <option value="17:00">17:00 - 18:00</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-gray-200 rounded-xl transition-colors">취소</button>
                            <button onClick={handleReserve} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg transition-all transform hover:-translate-y-0.5">예약 완료</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instant Meeting Modal */}
            {activeModal === 'instant' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden text-center p-10">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Video size={40} className="text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">즉시 회의 시작</h3>
                        <p className="text-slate-500 mb-8">새로운 회의실 코드를 생성했습니다.</p>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700 select-all">{generateMeetingCode()}</span>
                            <button
                                onClick={() => handleCopyLink(generateMeetingCode())}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors relative"
                            >
                                {isCopied ? <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded">복사됨</span> : null}
                                <Copy size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => startMeeting(generateMeetingCode())} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-all">회의실 입장</button>
                            <button onClick={closeModal} className="w-full py-3 text-slate-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingView;