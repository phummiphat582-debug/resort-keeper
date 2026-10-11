import React, { useState, useEffect, useMemo } from 'react';
import type { Room, OccupancyRecord, MaintenanceLog } from '../types';
import {
  toggleRoomOccupancy,
  getTodayDateString,
  formatThaiDate,
  deleteMaintenanceLog,
  resetRoomAcCleaning,
} from '../lib/dataService';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Wind,
  Sparkles,
  Check,
  Clock,
  Calendar,
  Trash2,
  History,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface Props {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  occupancies: OccupancyRecord[];
  logs: MaintenanceLog[];
  onDataChanged: () => void;
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
}) => {
  const today = getTodayDateString();
  const [todayYear, todayMonth] = today.split('-').map(Number);

  // Calendar view year and month (1-indexed month)
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  // Interaction mode on calendar tap: 'occupancy' (default) or 'clean' (tap to log AC cleaning on that day)
  const [tapMode, setTapMode] = useState<'occupancy' | 'clean'>('occupancy');

  // Inline AC Cleaning Form state (replaces overlapping popups)
  const [showCleanForm, setShowCleanForm] = useState(false);
  const [cleanDate, setCleanDate] = useState(today);
  const [cleanTech, setCleanTech] = useState('ช่างแอร์');
  const [cleanCost, setCleanCost] = useState('500');
  const [cleanNotes, setCleanNotes] = useState('ล้างแอร์รอบ 90 วัน เรียบร้อย (ทำความสะอาดฟิลเตอร์ + คอยล์เย็น)');
  const [isSubmittingClean, setIsSubmittingClean] = useState(false);
  const [cleanSuccessToast, setCleanSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    setShowCleanForm(false);
    setCleanSuccessToast(null);
    setCleanDate(today);
  }, [room?.id, isOpen, today]);

  // Early return if not open
  if (!isOpen || !room) return null;

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
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Filter occupancies for this specific room
  const isOccupiedOn = (dateStr: string) => {
    return occupancies.some(
      (o) => o.room_id === room.id && o.date === dateStr && o.is_occupied
    );
  };

  // Get all AC cleanings for this room, sorted latest first
  const roomCleanings = logs
    .filter((l) => l.room_id === room.id && l.action_type === 'ac_cleaning')
    .sort((a, b) => b.date.localeCompare(a.date));

  const latestCleaning = roomCleanings[0];

  // Dynamically compute effective AC days used based on latest cleaning date and occupancies
  const effectiveAcDays = useMemo(() => {
    const latestDate = latestCleaning?.date || room.last_ac_cleaned_date;
    if (!latestDate) {
      return occupancies.filter((o) => o.room_id === room.id && o.is_occupied).length;
    }
    return occupancies.filter(
      (o) => o.room_id === room.id && o.is_occupied && o.date > latestDate
    ).length;
  }, [occupancies, room.id, latestCleaning?.date, room.last_ac_cleaned_date]);

  const isCritical = effectiveAcDays >= 90;
  const isWarning = effectiveAcDays >= 75 && effectiveAcDays < 90;

  // Open inline form with selected date
  const handleOpenInlineCleanForm = (dateToSet?: string) => {
    if (dateToSet) {
      setCleanDate(dateToSet);
    } else {
      setCleanDate(today);
    }
    setShowCleanForm(true);
    setCleanSuccessToast(null);
  };

  // Submit inline AC Cleaning
  const handleSubmitInlineClean = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClean(true);
    try {
      await resetRoomAcCleaning(
        room.id,
        cleanTech.trim() || 'ช่างแอร์',
        Number(cleanCost) || 0,
        cleanNotes.trim(),
        cleanDate
      );
      setShowCleanForm(false);
      setCleanSuccessToast(`✓ บันทึกล้างแอร์วันที่ ${formatThaiDate(cleanDate)} เรียบร้อยแล้ว (รีเซ็ตรอบ 90 วันแล้ว)`);
      setTimeout(() => setCleanSuccessToast(null), 4000);
      onDataChanged();
    } catch (err) {
      console.error('Error recording AC cleaning:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลล้างแอร์');
    } finally {
      setIsSubmittingClean(false);
    }
  };

  // Check if AC was cleaned on this specific date
  const getCleaningLogOn = (dateStr: string) => {
    return logs.find(
      (l) => l.room_id === room.id && l.date === dateStr && l.action_type === 'ac_cleaning'
    );
  };

  // Toggle day occupancy or trigger inline AC clean form based on tapMode
  const handleDayClick = async (dayNumber: number) => {
    const padMonth = String(viewMonth).padStart(2, '0');
    const padDay = String(dayNumber).padStart(2, '0');
    const dateStr = `${viewYear}-${padMonth}-${padDay}`;

    if (tapMode === 'clean') {
      handleOpenInlineCleanForm(dateStr);
      return;
    }

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

  // Delete an AC cleaning record
  const handleDeleteCleaning = async (logId: string, logDate: string) => {
    if (confirm(`คุณต้องการลบประวัติการล้างแอร์วันที่ ${formatThaiDate(logDate)} ใช่หรือไม่?\n(ระบบจะคำนวณวันใช้งานแอร์ใหม่ตามวันที่ล้างครั้งก่อนหน้า)`)) {
      setDeletingLogId(logId);
      try {
        await deleteMaintenanceLog(logId, room.id);
        onDataChanged();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการลบรายการ');
      } finally {
        setDeletingLogId(null);
      }
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
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{room.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {room.ac_model || 'เครื่องปรับอากาศ'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ปฏิทินบันทึกการเข้าพัก &amp; ติดตามประวัติการล้างแอร์ย้อนหลัง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AC Status & Latest Cleaning Summary Card (คำตอบสำหรับ "ครั้งล่าสุดคือวันที่เท่าไหร่บ้าง") */}
        <div className="p-4 bg-white border-b border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: วันที่ล้างแอร์ครั้งล่าสุด */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>ล้างแอร์ครั้งล่าสุด</span>
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {latestCleaning || room.last_ac_cleaned_date ? (
                    <span className="text-blue-950 font-bold">
                      {formatThaiDate(latestCleaning?.date || room.last_ac_cleaned_date)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">ยังไม่มีบันทึกการล้าง</span>
                  )}
                </div>
                {latestCleaning && (
                  <p className="text-[10px] text-blue-800 mt-0.5">
                    โดย: {latestCleaning.technician_name} {latestCleaning.cost > 0 && `(฿${latestCleaning.cost} บ.)`}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (showCleanForm) {
                    setShowCleanForm(false);
                  } else {
                    handleOpenInlineCleanForm();
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 ${
                  showCleanForm
                    ? 'bg-slate-700 text-white hover:bg-slate-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showCleanForm ? 'ซ่อนฟอร์ม' : '+ บันทึกล้างแอร์'}</span>
              </button>
            </div>

            {/* Box 2: จำนวนวันใช้งานแอร์ปัจจุบัน */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>ใช้งานสะสมตั้งแต่ล้างล่าสุด</span>
                </span>
                <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`font-black ${
                      isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {effectiveAcDays} / 90 วัน
                  </span>
                  {isCritical ? (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                      ⚠️ ต้องล้างด่วน!
                    </span>
                  ) : isWarning ? (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                      ใกล้ครบกำหนด
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      ✓ ปกติ
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isCritical
                    ? `เกินกำหนดมาแล้ว ${effectiveAcDays - 90} วัน`
                    : `เหลืออีก ${90 - effectiveAcDays} วันก่อนถึงกำหนด`}
                </p>
              </div>

              {/* Mini Gauge */}
              <div className="w-16 bg-slate-200 rounded-full h-2.5 overflow-hidden shrink-0">
                <div
                  className={`h-full rounded-full ${
                    isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (effectiveAcDays / 90) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast Banner */}
        {cleanSuccessToast && (
          <div className="mx-4 sm:mx-5 my-2.5 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{cleanSuccessToast}</span>
            </div>
            <button
              onClick={() => setCleanSuccessToast(null)}
              className="text-emerald-500 hover:text-emerald-800 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline AC Cleaning Form (บันทึกล้างแอร์ย้อนหลังได้ในหน้านี้ โดยไม่ต้องเปิดป็อบอัพซ้อนกัน) */}
        {showCleanForm && (
          <div className="mx-4 sm:mx-5 my-3 p-4 bg-gradient-to-br from-blue-50/95 to-indigo-50/95 border-2 border-blue-400 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-start justify-between pb-2.5 border-b border-blue-200/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <span>บันทึกประวัติล้างแอร์: {room.name}</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                      เลือกลงย้อนหลังได้
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    ระบุวันที่ล้างแอร์เพื่อรีเซ็ตตัวนับ 90 วันใหม่ (ระบบจะนับเฉพาะวันที่ลูกค้าเข้าพักหลังวันที่นี้)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCleanForm(false)}
                className="p-1.5 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition"
                title="ปิดฟอร์ม"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInlineClean} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* วันที่ล้างแอร์ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>วันที่ล้างแอร์ (เลือกลงย้อนหลังได้)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={cleanDate}
                    onChange={(e) => setCleanDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                </div>

                {/* ชื่อช่าง */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อช่าง / ผู้ดำเนินการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cleanTech}
                    onChange={(e) => setCleanTech(e.target.value)}
                    placeholder="เช่น ช่างแอร์ หรือ ช่างสมชาย"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                </div>

                {/* ค่าบริการ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ค่าบริการล้างแอร์ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cleanCost}
                    onChange={(e) => setCleanCost(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                </div>

                {/* รายละเอียด */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รายละเอียด / การตรวจเช็ค
                  </label>
                  <input
                    type="text"
                    value={cleanNotes}
                    onChange={(e) => setCleanNotes(e.target.value)}
                    placeholder="เช่น ล้างฟิลเตอร์และคอยล์เย็นเรียบร้อย"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200/60">
                <button
                  type="button"
                  onClick={() => setShowCleanForm(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClean}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  {isSubmittingClean ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✓ ยืนยันบันทึกล้างแอร์</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Calendar Month Navigation & Tap Mode Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 bg-white">
          {/* Month / Year */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-white text-slate-700 rounded-lg transition"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={jumpToToday}
                className="px-2 py-0.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-white transition"
              >
                เดือนนี้
              </button>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-white text-slate-700 rounded-lg transition"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              {THAI_MONTHS[viewMonth - 1]} {viewYear + 543}
            </h3>
            <span className="text-[11px] text-slate-500 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg font-semibold">
              เข้าพัก: {occupiedThisMonthCount} วัน
            </span>
          </div>

          {/* Tap Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setTapMode('occupancy')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                tapMode === 'occupancy'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แตะช่องวันที่เพื่อสลับ [เข้าพัก] หรือ [ว่าง]"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>แตะลงวันเข้าพัก</span>
            </button>

            <button
              type="button"
              onClick={() => setTapMode('clean')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                tapMode === 'clean'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แตะช่องวันที่เพื่อบันทึกล้างแอร์ในวันนั้น"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>แตะบันทึกล้างแอร์</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Guide hint for current mode */}
          <div className="text-[11px] px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 bg-slate-50 border-slate-200 text-slate-600">
            {tapMode === 'occupancy' ? (
              <span>
                💡 <b>โหมดลงวันเข้าพัก:</b> แตะที่ช่องวันที่เพื่อสลับสถานะ [เข้าพัก (1)] หรือ [ห้องว่าง] ย้อนหลังได้อิสระ
              </span>
            ) : (
              <span className="text-blue-800 font-semibold">
                ✨ <b>โหมดบันทึกล้างแอร์:</b> แตะที่ช่องวันที่ใดก็ได้ในปฏิทินเพื่อบันทึกว่า "ล้างแอร์ในวันนั้น" (ย้อนหลังได้)
              </span>
            )}
            <span className="text-slate-400 shrink-0">
              ✨ = วันที่ล้างแอร์
            </span>
          </div>

          {/* 7-Column Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
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

            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[58px] sm:min-h-[64px] bg-slate-50/40 rounded-xl" />
            ))}

            {/* Days in Month */}
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
                  onClick={() => handleDayClick(dayNum)}
                  disabled={isToggling}
                  className={`min-h-[60px] sm:min-h-[68px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition select-none relative group active:scale-95 ${
                    cleaningLog
                      ? 'bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-300'
                      : isOccupied
                      ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${isToday ? 'ring-2 ring-blue-600' : ''}`}
                >
                  {/* Top: Day Number & Occupied checkmark */}
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

                    {isOccupied && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Middle: Cleaning Badge if AC was cleaned on this day */}
                  {cleaningLog && (
                    <div
                      className="text-[9px] bg-blue-600 text-white rounded px-1 py-0.5 truncate font-bold flex items-center gap-0.5 shadow-xs"
                      title={`ล้างแอร์วันที่ ${formatThaiDate(cleaningLog.date)} โดย ${cleaningLog.technician_name}`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-yellow-300 shrink-0" />
                      <span className="truncate">ล้างแอร์</span>
                    </div>
                  )}

                  {/* Bottom: Status description */}
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

          {/* Section: ประวัติการล้างแอร์ย้อนหลังทั้งหมดของบ้านหลังนี้ */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>ประวัติการล้างแอร์ย้อนหลัง ({roomCleanings.length} ครั้ง)</span>
              </h4>

              <button
                type="button"
                onClick={() => handleOpenInlineCleanForm()}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ เพิ่มประวัติล้างแอร์ย้อนหลัง</span>
              </button>
            </div>

            {roomCleanings.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-500">
                  ยังไม่มีประวัติการล้างแอร์ของบ้านหลังนี้
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenInlineCleanForm()}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>บันทึกประวัติล้างแอร์ครั้งล่าสุดย้อนหลัง</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {roomCleanings.map((cl, index) => {
                  const isLatest = index === 0;
                  const isDeleting = deletingLogId === cl.id;

                  return (
                    <div
                      key={cl.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                        isLatest
                          ? 'bg-blue-50/60 border-blue-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {formatThaiDate(cl.date)}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                                ครั้งล่าสุด
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {cl.description || 'ล้างแอร์รอบ 90 วัน'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>ผู้ดำเนินการ: <b>{cl.technician_name}</b></span>
                            {cl.cost > 0 && <span>ค่าใช้จ่าย: <b className="text-blue-900">฿{cl.cost} บาท</b></span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCleaning(cl.id, cl.date)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ข้อมูลซิงค์สดแบบเรียลไทม์กับทุกเครื่อง</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
