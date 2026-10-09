import React, { useState } from 'react';
import type { Room, OccupancyRecord, MaintenanceLog } from '../types';
import { toggleRoomOccupancy, getTodayDateString, formatThaiDate } from '../lib/dataService';
import { X, ChevronLeft, ChevronRight, Wind, AlertTriangle, Sparkles, Check, Clock } from 'lucide-react';

interface Props {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  occupancies: OccupancyRecord[];
  logs: MaintenanceLog[];
  onDataChanged: () => void;
  onOpenCleanModal: (room: Room) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const WEEK_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const RoomCalendarModal: React.FC<Props> = ({
  room,
  isOpen,
  onClose,
  occupancies,
  logs,
  onDataChanged,
  onOpenCleanModal,
}) => {
  const today = getTodayDateString();
  const [todayYear, todayMonth] = today.split('-').map(Number);

  // Calendar view year and month (1-indexed month)
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const acDays = room.ac_days_used || 0;
  const isCritical = acDays >= 90;
  const isWarning = acDays >= 75 && acDays < 90;

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
  };

  // Calendar calculations
  // new Date(year, monthIndex, 1) -> day of week (0=Sunday)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Filter occupancies for this specific room
  const isOccupiedOn = (dateStr: string) => {
    return occupancies.some(
      (o) => o.room_id === room.id && o.date === dateStr && o.is_occupied
    );
  };

  // Check if AC was cleaned on this date for this room
  const getCleaningLogOn = (dateStr: string) => {
    return logs.find(
      (l) => l.room_id === room.id && l.date === dateStr && l.action_type === 'ac_cleaning'
    );
  };

  // Toggle day occupancy
  const handleToggleDay = async (dayNumber: number) => {
    const padMonth = String(viewMonth).padStart(2, '0');
    const padDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${viewYear}-${padMonth}-${padDay}`;

    setTogglingDate(dateStr);
    try {
      await toggleRoomOccupancy(room, dateStr);
      onDataChanged();
    } catch (err) {
      console.error('Error toggling occupancy:', err);
    } finally {
      setTogglingDate(null);
    }
  };

  // Count occupied days in currently viewed month
  const padCurrentMonth = String(viewMonth).padStart(2, '0');
  const monthPrefix = `${viewYear}-${padCurrentMonth}`;
  const occupiedThisMonthCount = occupancies.filter(
    (o) => o.room_id === room.id && o.date.startsWith(monthPrefix) && o.is_occupied
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <Wind className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  ปฏิทินการเข้าพัก & รอบล้างแอร์: {room.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แตะวันที่เพื่อลงย้อนหลังหรือแก้ไข (สีเขียว = ลูกค้าเข้าพัก แอร์นับ 1 วัน)
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Status Ribbon */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">ใช้งานสะสม:</span>
              <span
                className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                  isCritical
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : isWarning
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {acDays} / 90 วัน
              </span>
            </div>

            <div className="text-slate-500 hidden sm:inline">
              ล้างล่าสุด: <b className="text-slate-700">{formatThaiDate(room.last_ac_cleaned_date)}</b>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              onClose();
              onOpenCleanModal(room);
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>บันทึกล้างแอร์แล้ว (รีเซ็ตเป็น 0)</span>
          </button>
        </div>

        {/* Calendar Controller (Month / Year Navigation) */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-800">
              {THAI_MONTHS[viewMonth - 1]} {viewYear + 543}
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              เข้าพักเดือนนี้: <b className="text-emerald-700 font-bold">{occupiedThisMonthCount}</b> วัน
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
            >
              เดือนนี้
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 pb-2 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold">1</span>
            = มีแขกเข้าพัก (นับ 1 วัน)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 text-[9px]">✨</span>
            = วันที่ล้างแอร์
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            แตะที่ช่องวันที่เพื่อสลับสถานะ
          </span>
        </div>

        {/* Calendar Body Grid */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto pt-0">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {/* Weekday headers */}
            {WEEK_DAYS.map((w, idx) => (
              <div
                key={w}
                className={`py-1 text-xs font-bold ${
                  idx === 0 ? 'text-red-500' : idx === 6 ? 'text-purple-600' : 'text-slate-500'
                }`}
              >
                {w}
              </div>
            ))}

            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[64px] bg-slate-50/50 rounded-xl" />
            ))}

            {/* Day slots */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const padMonth = String(viewMonth).padStart(2, '0');
              const padDay = String(dayNum).padStart(2, '0');
              const dateStr = `${viewYear}-${padMonth}-${padDay}`;

              const isOccupied = isOccupiedOn(dateStr);
              const cleaningLog = getCleaningLogOn(dateStr);
              const isToday = dateStr === today;
              const isToggling = togglingDate === dateStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleToggleDay(dayNum)}
                  disabled={isToggling}
                  className={`min-h-[58px] sm:min-h-[68px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition select-none relative group active:scale-95 ${
                    isOccupied
                      ? 'bg-emerald-50 border-emerald-400 hover:bg-emerald-100/80 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {/* Top: Day Number & Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center -ml-0.5 -mt-0.5 text-[11px]'
                          : isOccupied
                          ? 'text-emerald-900 font-extrabold'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Occupied Badge */}
                    {isOccupied && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Middle: Cleaning indicator */}
                  {cleaningLog && (
                    <div
                      className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 rounded px-1 py-0.5 truncate font-medium flex items-center gap-0.5"
                      title={`ล้างแอร์เมื่อวันนี้ โดย ${cleaningLog.technician_name}`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span className="truncate">ล้างแอร์</span>
                    </div>
                  )}

                  {/* Bottom: Status text */}
                  <div className="text-[10px] w-full text-center">
                    {isToggling ? (
                      <span className="text-[9px] text-slate-400">...</span>
                    ) : isOccupied ? (
                      <span className="font-bold text-emerald-700 block truncate">
                        เข้าพัก (1)
                      </span>
                    ) : (
                      <span className="text-slate-300 group-hover:text-slate-400 text-[10px]">
                        + ว่าง
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isCritical ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                แอร์ใช้งานสะสมครบ 90 วันแล้ว ต้องเรียกช่างล้างแอร์ทันที!
              </span>
            ) : isWarning ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" />
                ใกล้ครบ 90 วัน (เหลืออีก {90 - acDays} วัน)
              </span>
            ) : (
              <span>การใช้งานปกติ (เหลืออีก {90 - acDays} วันก่อนล้าง)</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
