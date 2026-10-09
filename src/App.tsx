import { useState, useEffect, useCallback } from 'react';
import type { Room, OccupancyRecord, MaintenanceLog } from './types';
import { fetchRooms, fetchOccupancies, fetchMaintenanceLogs } from './lib/dataService';
import { getSupabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { DailyCalendarView } from './components/DailyCalendarView';
import { AcTrackerView } from './components/AcTrackerView';
import { MaintenanceLogView } from './components/MaintenanceLogView';
import { DashboardView } from './components/DashboardView';
import { SupabaseModal } from './components/SupabaseModal';
import { RoomModal } from './components/RoomModal';
import { AcCleanModal } from './components/AcCleanModal';
import { AddRepairModal } from './components/AddRepairModal';
import { RoomCalendarModal } from './components/RoomCalendarModal';
import { Sparkles } from 'lucide-react';

export function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupancies, setOccupancies] = useState<OccupancyRecord[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'ac' | 'repairs' | 'dashboard'>('calendar');

  // Modals state
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [cleaningRoom, setCleaningRoom] = useState<Room | null>(null);
  const [calendarRoom, setCalendarRoom] = useState<Room | null>(null);
  const [isAddRepairOpen, setIsAddRepairOpen] = useState(false);
  const [repairPresetRoomId, setRepairPresetRoomId] = useState<string | undefined>(undefined);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all data
  const loadData = useCallback(async () => {
    try {
      const [fetchedRooms, fetchedOccupancies, fetchedLogs] = await Promise.all([
        fetchRooms(),
        fetchOccupancies(),
        fetchMaintenanceLogs(),
      ]);
      setRooms(fetchedRooms);
      setOccupancies(fetchedOccupancies);
      setLogs(fetchedLogs);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep calendarRoom in sync when rooms update
  useEffect(() => {
    if (calendarRoom) {
      const refreshed = rooms.find((r) => r.id === calendarRoom.id);
      if (refreshed) {
        setCalendarRoom(refreshed);
      }
    }
  }, [rooms, calendarRoom]);

  // Setup Supabase Real-time listener
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('resort-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'api', table: 'rooms' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'api', table: 'occupancies' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'api', table: 'maintenance_logs' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'occupancies' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_logs' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const criticalAcCount = rooms.filter((r) => (r.ac_days_used || 0) >= 90).length;

  const handleOpenRepairForRoom = (roomId: string) => {
    setRepairPresetRoomId(roomId);
    setIsAddRepairOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        criticalAcCount={criticalAcCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">กำลังโหลดข้อมูลระบบรีสอร์ท...</p>
          </div>
        ) : (
          <>
            {activeTab === 'calendar' && (
              <DailyCalendarView
                rooms={rooms}
                occupancies={occupancies}
                onDataChanged={loadData}
                onOpenRepair={handleOpenRepairForRoom}
                onOpenRoomModal={() => setIsRoomModalOpen(true)}
              />
            )}

            {activeTab === 'ac' && (
              <AcTrackerView
                rooms={rooms}
                onOpenCleanModal={(room) => setCleaningRoom(room)}
                onOpenRoomCalendar={(room) => setCalendarRoom(room)}
                onOpenRoomModal={() => setIsRoomModalOpen(true)}
              />
            )}

            {activeTab === 'repairs' && (
              <MaintenanceLogView
                logs={logs}
                rooms={rooms}
                onOpenAddModal={() => {
                  setRepairPresetRoomId(undefined);
                  setIsAddRepairOpen(true);
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                rooms={rooms}
                occupancies={occupancies}
                logs={logs}
                onNavigateTab={setActiveTab}
                onOpenCleanModal={(room) => setCleaningRoom(room)}
                onOpenRoomModal={() => setIsRoomModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        onConfigChanged={() => {
          loadData();
          showToast('บันทึกการตั้งค่าฐานข้อมูลเรียบร้อยแล้ว');
        }}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        rooms={rooms}
        onRoomsUpdated={() => {
          loadData();
          showToast('อัปเดตรายชื่อบ้านพักเรียบร้อย');
        }}
      />

      <AcCleanModal
        room={cleaningRoom}
        onClose={() => setCleaningRoom(null)}
        onSuccess={() => {
          loadData();
          showToast('✓ บันทึกล้างแอร์และรีเซ็ตตัวนับเป็น 0 วัน สำเร็จ!');
        }}
      />

      <AddRepairModal
        isOpen={isAddRepairOpen}
        onClose={() => setIsAddRepairOpen(false)}
        rooms={rooms}
        initialRoomId={repairPresetRoomId}
        onSuccess={() => {
          loadData();
          showToast('✓ บันทึกประวัติงานซ่อมบำรุงเรียบร้อยแล้ว');
        }}
      />

      <RoomCalendarModal
        isOpen={Boolean(calendarRoom)}
        room={calendarRoom}
        onClose={() => setCalendarRoom(null)}
        occupancies={occupancies}
        logs={logs}
        onDataChanged={loadData}
        onOpenCleanModal={(room) => setCleaningRoom(room)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        ระบบบริหารแม่บ้านรีสอร์ท • ปฏิทินเข้าพัก • นับวันล้างแอร์ 90 วัน • บันทึกงานซ่อม &copy; 2026
      </footer>
    </div>
  );
}

export default App;
