import React from 'react';
import { getSupabaseConfig } from '../lib/supabase';
import { Calendar, Wind, Wrench, LayoutDashboard, Database, Home } from 'lucide-react';

interface Props {
  activeTab: 'calendar' | 'ac' | 'repairs' | 'dashboard';
  onSelectTab: (tab: 'calendar' | 'ac' | 'repairs' | 'dashboard') => void;
  onOpenSupabaseModal: () => void;
  onOpenRoomModal: () => void;
  criticalAcCount: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenSupabaseModal,
  onOpenRoomModal,
  criticalAcCount,
}) => {
  const config = getSupabaseConfig();
  const isOnline = Boolean(config.url && config.anonKey);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Upper Bar: Brand & System Settings */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                ปฏิทินแม่บ้าน & ล้างแอร์รีสอร์ท
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                ระบบนับวันเข้าพักสะสมเพื่อล้างแอร์รอบ 90 วัน & บันทึกงานซ่อมบำรุง
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Online Status Badge */}
            <button
              onClick={onOpenSupabaseModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title="คลิกเพื่อตั้งค่า Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isOnline ? 'ออนไลน์ (Supabase Realtime)' : 'โหมดทดลอง (Local)'}
              </span>
              <span className="sm:hidden">{isOnline ? 'ออนไลน์' : 'ออฟไลน์'}</span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Manage Rooms Button */}
            <button
              onClick={onOpenRoomModal}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1.5"
              title="จัดการบ้านพัก"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">จัดการบ้านพัก</span>
            </button>
          </div>
        </div>

        {/* Lower Bar: Main Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
          <button
            onClick={() => onSelectTab('calendar')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'calendar'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>ปฏิทินลงวันเข้าพัก</span>
          </button>

          <button
            onClick={() => onSelectTab('ac')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 relative transition ${
              activeTab === 'ac'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>รอบล้างแอร์ (90 วัน)</span>
            {criticalAcCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full shadow-xs animate-bounce">
                {criticalAcCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('repairs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'repairs'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>บันทึกงานซ่อม & เปลี่ยนของ</span>
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>สรุปภาพรวม</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
