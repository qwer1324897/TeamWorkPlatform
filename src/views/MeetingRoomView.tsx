import React, { useState } from 'react';
import { MapPin, Users, Clock, Calendar, X, Check, CheckCircle2 } from 'lucide-react';
import { MeetingRoomItem } from '../types';

const mockRooms: MeetingRoomItem[] = [
  { id: 1, name: '대회의실 A (Vision Hall)', capacity: 20, location: '본관 3F', facilities: ['Projector', 'Video Conf', 'Whiteboard'], isAvailable: true, nextAvailableTime: 'Now' },
  { id: 2, name: '중회의실 B (Creative Lab)', capacity: 8, location: '본관 3F', facilities: ['TV', 'Whiteboard'], isAvailable: false, nextAvailableTime: '14:00' },
  { id: 3, name: '소회의실 C (Focus Room)', capacity: 4, location: '본관 3F', facilities: ['TV'], isAvailable: true, nextAvailableTime: 'Now' },
  { id: 4, name: '임원회의실 (Board Room)', capacity: 12, location: '본관 4F', facilities: ['Premium Audio', 'Catering'], isAvailable: true, nextAvailableTime: 'Now' },
  { id: 5, name: '오픈 스튜디오', capacity: 30, location: '별관 1F', facilities: ['Sound System', 'Stage'], isAvailable: false, nextAvailableTime: '16:00' },
];

const MeetingRoomView: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 9);

  const handleRoomClick = (room: MeetingRoomItem) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 relative">
       
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-6 items-end animate-fade-in-down">
           <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">날짜 선택</label>
               <div className="relative group">
                   <Calendar className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                   <input type="date" className="w-full bg-gray-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" defaultValue="2025-11-22" />
               </div>
           </div>
           <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">인원</label>
               <div className="relative group">
                   <Users className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                   <select className="w-full bg-gray-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all cursor-pointer">
                       <option>4명 이하</option>
                       <option>5 ~ 10명</option>
                       <option>11 ~ 20명</option>
                       <option>20명 이상</option>
                   </select>
               </div>
           </div>
           <div className="flex-1 min-w-[200px]">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">위치</label>
               <div className="relative group">
                   <MapPin className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                   <select className="w-full bg-gray-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all cursor-pointer">
                       <option>전체</option>
                       <option>본관 3F</option>
                       <option>본관 4F</option>
                       <option>별관 1F</option>
                   </select>
               </div>
           </div>
           <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 h-[42px]">
               검색
           </button>
       </div>

       <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-gray-200 bg-gray-50/50">
               <h2 className="font-bold text-lg text-slate-800">회의실 목록</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
               {mockRooms.map(room => (
                   <div 
                        key={room.id} 
                        onClick={() => handleRoomClick(room)}
                        className="border border-gray-200 bg-white rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden"
                   >
                       {room.isAvailable && <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-full -mr-10 -mt-10"></div>}
                       
                       <div className="flex justify-between items-start mb-4 relative z-10">
                           <div>
                               <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{room.name}</h3>
                               <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                   <MapPin size={14} className="text-slate-400" /> {room.location}
                                   <span className="text-gray-300">|</span>
                                   <Users size={14} className="text-slate-400" /> 최대 {room.capacity}명
                               </p>
                           </div>
                           <span className={`px-3 py-1 rounded-full text-xs font-bold border ${room.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                               {room.isAvailable ? '사용 가능' : '사용 중'}
                           </span>
                       </div>

                      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                          {(room.facilities || []).map(fac => (
                              <span key={fac} className="text-xs bg-gray-100 text-slate-600 px-2.5 py-1 rounded-md border border-gray-200 font-medium group-hover:bg-white transition-colors">{fac}</span>
                          ))}
                      </div>

                       <div className="relative z-10">
                           <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium px-0.5">
                               {timeSlots.map(t => <span key={t}>{t}</span>)}
                           </div>
                           <div className="flex h-4 rounded-lg overflow-hidden bg-gray-100 mb-4 ring-1 ring-gray-200">
                               {timeSlots.map((t, idx) => {
                                   const isBooked = (room.id + idx) % 3 === 0; 
                                   return (
                                       <div key={t} className={`flex-1 border-r border-white/50 transition-colors ${isBooked ? 'bg-red-300 pattern-diagonal-lines-sm' : 'bg-green-300 hover:bg-green-400'}`} title={isBooked ? '예약됨' : '예약 가능'}></div>
                                   )
                               })}
                           </div>
                           <div className="flex justify-end">
                               <button 
                                    className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    상세보기 및 예약
                                </button>
                           </div>
                       </div>
                   </div>
               ))}
           </div>
       </div>

       {/* Detailed Reservation Modal */}
       {isModalOpen && selectedRoom && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                   <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                       <div>
                           <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedRoom.name}</h3>
                           <p className="text-slate-500 flex items-center gap-2 text-sm">
                               <MapPin size={14} /> {selectedRoom.location} <span className="text-gray-300">|</span> 최대 {selectedRoom.capacity}명 수용
                           </p>
                       </div>
                       <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                   </div>
                   
                   <div className="p-8 overflow-y-auto">
                       <div className="grid grid-cols-2 gap-8 mb-8">
                          <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">보유 장비</h4>
                              <div className="flex flex-wrap gap-2">
                                  {(selectedRoom.facilities || []).map(fac => (
                                      <span key={fac} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 flex items-center gap-1">
                                          <CheckCircle2 size={12} /> {fac}
                                      </span>
                                  ))}
                              </div>
                          </div>
                           <div>
                               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">예약 현황 (오늘)</h4>
                               <div className="w-full h-10 bg-gray-100 rounded-lg flex overflow-hidden ring-1 ring-gray-200 relative">
                                    {timeSlots.map((t, idx) => {
                                        const isBooked = (selectedRoom.id + idx) % 3 === 0;
                                        return (
                                            <div key={t} className={`flex-1 border-r border-white/50 ${isBooked ? 'bg-red-300' : 'bg-green-300 hover:bg-green-400 cursor-pointer'}`} title={`${t}:00 ${isBooked ? '예약됨' : '가능'}`}></div>
                                        )
                                    })}
                               </div>
                               <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                                    <span>09:00</span>
                                    <span>18:00</span>
                               </div>
                           </div>
                       </div>

                       <div className="space-y-6">
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-2">예약 시간</label>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="relative">
                                       <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                       <select className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                                            <option>09:00</option>
                                            <option>10:00</option>
                                            <option>11:00</option>
                                            <option>13:00</option>
                                       </select>
                                   </div>
                                   <div className="relative">
                                       <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                       <select className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors">
                                            <option>10:00</option>
                                            <option>11:00</option>
                                            <option>12:00</option>
                                            <option>14:00</option>
                                       </select>
                                   </div>
                               </div>
                           </div>
                           
                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-2">회의 주제</label>
                               <input type="text" placeholder="회의 주제를 입력하세요" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                           </div>

                           <div>
                               <label className="block text-sm font-bold text-slate-700 mb-2">참석자 (선택)</label>
                               <div className="relative">
                                   <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                                   <input type="text" placeholder="이름 또는 부서 검색" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                               </div>
                           </div>
                       </div>
                   </div>

                   <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                       <button onClick={closeModal} className="px-6 py-3 text-slate-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">취소</button>
                       <button onClick={() => { alert(`${selectedRoom.name} 예약이 완료되었습니다.`); closeModal(); }} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                           <Check size={18} /> 예약 확정
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default MeetingRoomView;