import React from 'react';
import type { Room, OccupancyRecord, MaintenanceLog } from '../types';
import { getTodayDateString, formatThaiDate } from '../lib/dataService';
import { Home, Wind, AlertTriangle, Wrench, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

interface Props {
  rooms: Room[];
  occupancies: OccupancyRecord[];
  logs: MaintenanceLog[];
  onNavigateTab: (tab: 'calendar' | 'ac' | 'repairs') => void;
  onOpenCleanModal: (room: Room) => void;
}

export const DashboardView: React.FC<Props> = ({
  rooms,
  occupancies,
  logs,
  onNavigateTab,
  onOpenCleanModal,
}) => {
  const today = getTodayDateString();

  const occupiedTodayRooms = rooms.filter((r) =>
    occupancies.some((o) => o.room_id === r.id && o.date === today && o.is_occupied)
  );

  const criticalAcRooms = rooms.filter((r) => (r.ac_days_used || 0) >= 90);
  const warningAcRooms = rooms.filter((r) => (r.ac_days_used || 0) >= 75 && (r.ac_days_used || 0) < 90);

  const occupancyRate = rooms.length > 0 ? Math.round((occupiedTodayRooms.length / rooms.length) * 100) : 0;
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner if AC >= 90 days */}
      {criticalAcRooms.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                แจ้งเตือนเร่งด่วน: มีบ้านพักครบกำหนด 90 วันต้องล้างแอร์! ({criticalAcRooms.length} หลัง)
              </h3>
              <p className="text-xs text-red-100 mt-1">
                {criticalAcRooms.map((r) => `${r.name} (${r.ac_days_used} วัน)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ac')}
            className="px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold shrink-0 shadow-sm transition"
          >
            จัดการรอบล้างแอร์ทันที
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Occupancy */}
        <div
          onClick={() => onNavigateTab('calendar')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">เข้าพักวันนี้</span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {occupiedTodayRooms.length}{' '}
            <span className="text-xs font-semibold text-slate-500">/ {rooms.length} หลัง</span>
          </div>
          <div className="text-xs font-medium text-emerald-700 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>อัตราเข้าพัก {occupancyRate}%</span>
          </div>
        </div>

        {/* Card 2: AC Overdue */}
        <div
          onClick={() => onNavigateTab('ac')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">แอร์ครบ 90 วัน</span>
            <Wind className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">
            {criticalAcRooms.length}{' '}
            <span className="text-xs font-semibold text-slate-500">หลัง</span>
          </div>
          <div className="text-xs text-red-700/80 mt-2 font-medium">
            {criticalAcRooms.length > 0 ? '⚠️ ต้องล้างด่วน' : '✓ ไม่มีแอร์ค้างล้าง'}
          </div>
        </div>

        {/* Card 3: AC Warning (75-89 days) */}
        <div
          onClick={() => onNavigateTab('ac')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">แอร์ใกล้ครบกำหนด</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {warningAcRooms.length}{' '}
            <span className="text-xs font-semibold text-slate-500">หลัง</span>
          </div>
          <div className="text-xs text-amber-700/80 mt-2 font-medium">
            (ใช้แอร์ 75-89 วัน)
          </div>
        </div>

        {/* Card 4: Total Repairs */}
        <div
          onClick={() => onNavigateTab('repairs')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">บันทึกงานซ่อม/เปลี่ยน</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {logs.length}{' '}
            <span className="text-xs font-semibold text-slate-500">รายการ</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            รวมทุกหมวดหมู่
          </div>
        </div>
      </div>

      {/* 2 Column Section: AC Status + Recent Maintenance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: House AC Status Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-600" />
              สรุปจำนวนวันใช้งานแอร์ (สูงสุด 90 วัน)
            </h3>
            <button
              onClick={() => onNavigateTab('ac')}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {rooms.slice(0, 6).map((room) => {
              const days = room.ac_days_used || 0;
              const isCrit = days >= 90;
              const isWarn = days >= 75 && days < 90;

              return (
                <div key={room.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{room.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black ${
                          isCrit ? 'text-red-600' : isWarn ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {days}/90 วัน
                      </span>
                      {isCrit && (
                        <button
                          onClick={() => onOpenCleanModal(room)}
                          className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"
                        >
                          ล้างแล้ว
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCrit ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (days / 90) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Maintenance Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              รายการซ่อม / เปลี่ยนอุปกรณ์ล่าสุด
            </h3>
            <button
              onClick={() => onNavigateTab('repairs')}
              className="text-xs text-amber-700 hover:underline font-semibold flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีประวัติการซ่อมบำรุง</p>
            ) : (
              recentLogs.map((log) => {
                const room = rooms.find((r) => r.id === log.room_id);
                return (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{room?.name || 'บ้านพัก'}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatThaiDate(log.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{log.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>โดย: {log.technician_name}</span>
                      {log.cost > 0 && <span className="font-semibold text-amber-700">฿{log.cost} บ.</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
