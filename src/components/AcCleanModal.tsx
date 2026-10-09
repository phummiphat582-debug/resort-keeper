import React, { useState } from 'react';
import type { Room } from '../types';
import { resetRoomAcCleaning } from '../lib/dataService';
import { X, CheckCircle, Sparkles, Wind } from 'lucide-react';

interface Props {
  room: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AcCleanModal: React.FC<Props> = ({ room, onClose, onSuccess }) => {
  const [technician, setTechnician] = useState('ช่างแอร์');
  const [cost, setCost] = useState('500');
  const [notes, setNotes] = useState('ล้างแอร์รอบ 90 วัน ล้างฟิลเตอร์และคอยล์เย็นเรียบร้อย');
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetRoomAcCleaning(
        room.id,
        technician.trim() || 'ช่างแอร์',
        Number(cost) || 0,
        notes.trim()
      );
      onSuccess();
      onClose();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">บันทึกล้างแอร์ & รีเซ็ตตัวนับ</h2>
          <p className="text-xs text-blue-100 mt-1">
            {room.name} • ใช้งานสะสมมาแล้ว <b className="text-yellow-300 font-bold">{room.ac_days_used} วัน</b>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Wind className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              เมื่อบันทึกแล้ว ตัวนับการใช้งานแอร์ของ <b>{room.name}</b> จะถูกรีเซ็ตกลับเป็น <b>0 วัน</b>{' '}
              และระบบจะบันทึกประวัตินี้ลงในสมุดบันทึกงานซ่อมบำรุงอัตโนมัติ
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อช่าง / ผู้ดำเนินการ</label>
            <input
              type="text"
              required
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ค่าบริการล้างแอร์ (บาท)</label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดการล้าง / หมายเหตุ</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'ยืนยันล้างแอร์เสร็จแล้ว'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
