import React, { useState } from 'react';
import type { Room } from '../types';
import { formatThaiDate } from '../lib/dataService';
import { Wind, AlertTriangle, CheckCircle2, Clock, Sparkles, Filter, Calendar } from 'lucide-react';

interface Props {
  rooms: Room[];
  onOpenCleanModal: (room: Room) => void;
  onFilterHistoryByRoom?: (roomId: string) => void;
}

export const AcTrackerView: React.FC<Props> = ({ rooms, onOpenCleanModal }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'good'>('all');

  const criticalRooms = rooms.filter((r) => (r.ac_days_used || 0) >= 90);
  const warningRooms = rooms.filter((r) => (r.ac_days_used || 0) >= 75 && (r.ac_days_used || 0) < 90);
  const goodRooms = rooms.filter((r) => (r.ac_days_used || 0) < 75);

  const displayedRooms = rooms.filter((r) => {
    const days = r.ac_days_used || 0;
    if (filter === 'critical') return days >= 90;
    if (filter === 'warning') return days >= 75 && days < 90;
    if (filter === 'good') return days < 75;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'all'
              ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/20'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold opacity-80">บ้านพักทั้งหมด</span>
            <Wind className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold">{rooms.length} หลัง</div>
          <p className="text-[11px] opacity-75 mt-0.5">ในระบบรีสอร์ท</p>
        </button>

        <button
          onClick={() => setFilter('critical')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'critical'
              ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-600/20'
              : 'bg-red-50/70 hover:bg-red-100/70 border-red-200 text-red-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">🔴 ครบ 90 วัน (ต้องล้างด่วน!)</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalRooms.length} หลัง</div>
          <p className="text-[11px] text-red-700/80 mt-0.5">ใช้งานครบ 90 วันแล้ว</p>
        </button>

        <button
          onClick={() => setFilter('warning')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'warning'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">🟡 ใกล้ครบกำหนด (75-89 วัน)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{warningRooms.length} หลัง</div>
          <p className="text-[11px] text-amber-700/80 mt-0.5">เตือนเตรียมคิวช่าง</p>
        </button>

        <button
          onClick={() => setFilter('good')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'good'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">🟢 สภาพปกติ (&lt; 75 วัน)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{goodRooms.length} หลัง</div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">ยังไม่ถึงรอบล้าง</p>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">ตัวกรอง:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({rooms.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'critical' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              ต้องล้างด่วน ({criticalRooms.length})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'warning' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              ใกล้ครบ ({warningRooms.length})
            </button>
            <button
              onClick={() => setFilter('good')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filter === 'good' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              ปกติ ({goodRooms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedRooms.map((room) => {
          const days = room.ac_days_used || 0;
          const isCritical = days >= 90;
          const isWarning = days >= 75 && days < 90;
          const percent = Math.min(100, Math.round((days / 90) * 100));

          return (
            <div
              key={room.id}
              className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all flex flex-col justify-between ${
                isCritical
                  ? 'border-red-400 bg-red-50/20 shadow-red-50'
                  : isWarning
                  ? 'border-amber-300 bg-amber-50/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{room.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-blue-500" />
                      {room.ac_model || 'เครื่องปรับอากาศมาตรฐาน'}
                    </p>
                  </div>
                  {isCritical ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      ถึงกำหนดล้าง!
                    </span>
                  ) : isWarning ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      เหลืออีก {90 - days} วัน
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ปกติ
                    </span>
                  )}
                </div>

                {/* Counter & Progress */}
                <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block">ใช้งานแอร์สะสม</span>
                      <span className="text-2xl font-black text-slate-900 leading-none">
                        {days}{' '}
                        <span className="text-sm font-semibold text-slate-500">/ 90 วัน</span>
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>

                  {/* Visual Progress Gauge */}
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical
                          ? 'bg-red-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Overdue or Remaining indicator */}
                  <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between pt-1">
                    <span>
                      {isCritical ? (
                        <b className="text-red-600 font-bold">เกินกำหนดมาแล้ว {days - 90} วัน</b>
                      ) : (
                        `เหลือใช้งานอีก ${90 - days} วันก่อนต้องล้าง`
                      )}
                    </span>
                  </div>
                </div>

                {/* Last Cleaned Info */}
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>ล้างครั้งล่าสุด: </span>
                  <b className="text-slate-700">{formatThaiDate(room.last_ac_cleaned_date)}</b>
                </div>
              </div>

              {/* Action Button: Reset AC */}
              <button
                onClick={() => onOpenCleanModal(room)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 ${
                  isCritical
                    ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50'
                    : isWarning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>บันทึกล้างแอร์แล้ว (รีเซ็ตเป็น 0 วัน)</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
