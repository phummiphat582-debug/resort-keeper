import React, { useState } from 'react';
import type { Room, OccupancyRecord } from '../types';
import { toggleRoomOccupancy, formatThaiDate, getTodayDateString } from '../lib/dataService';
import { Calendar as CalendarIcon, Check, Plus, Wrench, AlertTriangle, ChevronLeft, ChevronRight, Grid, List, Home } from 'lucide-react';

interface Props {
  rooms: Room[];
  occupancies: OccupancyRecord[];
  onDataChanged: () => void;
  onOpenRepair: (roomId: string) => void;
  onOpenRoomModal: () => void;
}

export const DailyCalendarView: React.FC<Props> = ({
  rooms,
  occupancies,
  onDataChanged,
  onOpenRepair,
  onOpenRoomModal,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [togglingRoomId, setTogglingRoomId] = useState<string | null>(null);

  const today = getTodayDateString();

  // Parse current selected year and month
  const [year, month] = selectedDate.split('-').map(Number);

  // Helper to change day by offset
  const shiftDay = (offset: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + offset);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Helper to check if room is occupied on a specific date
  const isRoomOccupied = (roomId: string, dateStr: string) => {
    return occupancies.some((o) => o.room_id === roomId && o.date === dateStr && o.is_occupied);
  };

  // Toggle handler
  const handleToggle = async (room: Room, targetDate: string) => {
    setTogglingRoomId(room.id);
    try {
      await toggleRoomOccupancy(room, targetDate);
      onDataChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingRoomId(null);
    }
  };

  // Generate days in month for matrix view
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/90 shadow-sm max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Home className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">ยังไม่มีข้อมูลบ้านพักในระบบ</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            เริ่มต้นใช้งานโดยการเพิ่มบ้านพักหลังแรกของรีสอร์ทคุณ (เช่น บ้าน 1, บ้าน 101, วิลล่าริมน้ำ)
          </p>
        </div>
        <button
          onClick={onOpenRoomModal}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มบ้านพักหลังแรก</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Mode switcher & Date Selector */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => shiftDay(-1)}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedDate(today)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedDate === today ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 hover:bg-white'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => shiftDay(1)}
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition"
              title="วันถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <span className="text-xs font-medium text-slate-500">
            ({formatThaiDate(selectedDate)})
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'daily'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>โหมดบันทึกรายวัน (แม่บ้าน)</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'monthly'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>โหมดตารางทั้งเดือน (Matrix)</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DAILY QUICK TAP (ออกแบบมาให้แม่บ้านใช้บนมือถือง่ายที่สุด) */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>สถานะบ้านพักวันที่: </span>
              <span className="text-emerald-700 font-bold">{formatThaiDate(selectedDate)}</span>
            </h3>
            <span className="text-xs text-slate-500">
              เข้าพักวันนี้:{' '}
              <b className="text-emerald-700 font-bold">
                {rooms.filter((r) => isRoomOccupied(r.id, selectedDate)).length}
              </b>{' '}
              / {rooms.length} หลัง
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const occupied = isRoomOccupied(room.id, selectedDate);
              const isToggling = togglingRoomId === room.id;
              const acDays = room.ac_days_used || 0;
              const isAcCritical = acDays >= 90;
              const isAcWarning = acDays >= 75 && acDays < 90;

              return (
                <div
                  key={room.id}
                  className={`relative rounded-2xl p-5 border-2 transition-all shadow-sm ${
                    occupied
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-emerald-100'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{room.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{room.ac_model || 'เครื่องปรับอากาศ'}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        occupied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {occupied ? '✓ มีแขกเข้าพัก (1)' : 'ห้องว่าง (0)'}
                    </span>
                  </div>

                  {/* AC Status Badge on Card */}
                  <div className="mb-4 bg-white/80 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 flex items-center gap-1">
                        <span>❄️ ใช้งานแอร์:</span>
                        <b
                          className={`font-bold ${
                            isAcCritical
                              ? 'text-red-600'
                              : isAcWarning
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {acDays} / 90 วัน
                        </b>
                      </span>
                      {isAcCritical && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          ต้องล้างแอร์!
                        </span>
                      )}
                      {isAcWarning && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                          ใกล้ครบกำหนด
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          isAcCritical
                            ? 'bg-red-500'
                            : isAcWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (acDays / 90) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Big Tap Button for Housekeepers */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleToggle(room, selectedDate)}
                      disabled={isToggling}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm ${
                        occupied
                          ? 'bg-slate-800 hover:bg-slate-900 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isToggling ? (
                        <span className="text-xs">กำลังบันทึก...</span>
                      ) : occupied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>แตะเพื่อเปลี่ยนเป็น [ห้องว่าง]</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>แตะลง [1] มีผู้เข้าพัก (+1 วันแอร์)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenRepair(room.id)}
                      className="w-full py-1.5 text-xs text-slate-500 hover:text-amber-700 hover:bg-amber-50/60 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>แจ้งซ่อม / เปลี่ยนอุปกรณ์บ้านนี้</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MONTHLY MATRIX GRID (ตารางทั้งเดือนสำหรับผู้จัดการรีสอร์ท) */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">
              ตารางการเข้าพักประจำเดือน: {month}/{year + 543}
            </h4>
            <span className="text-xs text-slate-500">
              แตะที่ช่องวันที่เพื่อสลับสถานะ [1 = เข้าพัก] หรือ [- = ว่าง]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[140px] shadow-sm">
                    บ้านพัก
                  </th>
                  {daysList.map((d) => {
                    const padD = String(d).padStart(2, '0');
                    const padM = String(month).padStart(2, '0');
                    const cellDate = `${year}-${padM}-${padD}`;
                    const isCellToday = cellDate === today;
                    return (
                      <th
                        key={d}
                        className={`p-2 text-center font-bold min-w-[36px] ${
                          isCellToday ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
                        }`}
                      >
                        {d}
                      </th>
                    );
                  })}
                  <th className="p-3 text-center font-bold text-emerald-800 bg-emerald-50 min-w-[70px]">
                    รวมวัน
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => {
                  let monthlyOccupiedCount = 0;

                  return (
                    <tr key={room.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 shadow-sm border-r border-slate-100 truncate max-w-[140px]">
                        {room.name}
                      </td>

                      {daysList.map((d) => {
                        const padD = String(d).padStart(2, '0');
                        const padM = String(month).padStart(2, '0');
                        const cellDate = `${year}-${padM}-${padD}`;
                        const occupied = isRoomOccupied(room.id, cellDate);
                        const isCellToday = cellDate === today;

                        if (occupied) monthlyOccupiedCount++;

                        return (
                          <td
                            key={d}
                            onClick={() => handleToggle(room, cellDate)}
                            className={`p-1 text-center cursor-pointer select-none transition ${
                              isCellToday ? 'bg-emerald-50/50' : ''
                            } hover:bg-emerald-100/60`}
                            title={`${room.name} วันที่ ${d}/${month}: ${occupied ? 'เข้าพัก' : 'ว่าง'}`}
                          >
                            {occupied ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-[11px] shadow-xs">
                                1
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/40">
                        {monthlyOccupiedCount} วัน
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
