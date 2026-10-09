import React, { useState } from 'react';
import type { Room, MaintenanceCategory } from '../types';
import { addMaintenanceLog, getTodayDateString } from '../lib/dataService';
import { X, Wrench, Check, Lightbulb, Wind, Droplets, Bed, Hammer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  initialRoomId?: string;
  onSuccess: () => void;
}

const CATEGORIES: { key: MaintenanceCategory; label: string; icon: any; color: string }[] = [
  { key: 'electrical', label: 'ระบบไฟ/หลอดไฟ', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { key: 'ac_cleaning', label: 'แอร์/ระบบความเย็น', icon: Wind, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { key: 'plumbing', label: 'ประปา/ห้องน้ำ', icon: Droplets, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
  { key: 'furniture', label: 'เฟอร์นิเจอร์/ที่นอน', icon: Bed, color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { key: 'other', label: 'ซ่อมแซมทั่วไป', icon: Hammer, color: 'text-slate-500 bg-slate-50 border-slate-200' },
];

const QUICK_TAGS = [
  { text: 'เปลี่ยนหลอดไฟห้องน้ำ (LED 9W)', cat: 'electrical' as MaintenanceCategory },
  { text: 'เปลี่ยนหลอดไฟห้องนอน', cat: 'electrical' as MaintenanceCategory },
  { text: 'เปลี่ยนสายฉีดชำระใหม่', cat: 'plumbing' as MaintenanceCategory },
  { text: 'ซ่อมก๊อกน้ำอ่างล้างหน้ารั่ว', cat: 'plumbing' as MaintenanceCategory },
  { text: 'เปลี่ยนถ่านรีโมทแอร์ (AAA 2 ก้อน)', cat: 'ac_cleaning' as MaintenanceCategory },
  { text: 'เปลี่ยนรีโมทแอร์ใหม่', cat: 'ac_cleaning' as MaintenanceCategory },
  { text: 'ล้างแอร์และฟิลเตอร์', cat: 'ac_cleaning' as MaintenanceCategory },
  { text: 'เปลี่ยนลูกบิดประตูห้องน้ำ', cat: 'other' as MaintenanceCategory },
  { text: 'เปลี่ยนผ้าปูที่นอน / ปลอกหมอนใหม่', cat: 'furniture' as MaintenanceCategory },
  { text: 'ซ่อมผ้าม่านหลุดราง', cat: 'furniture' as MaintenanceCategory },
];

export const AddRepairModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rooms,
  initialRoomId,
  onSuccess,
}) => {
  const [roomId, setRoomId] = useState(initialRoomId || (rooms[0]?.id ?? ''));
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<MaintenanceCategory>('electrical');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [technician, setTechnician] = useState('แม่บ้าน/ช่างรีสอร์ท');
  const [resetAc, setResetAc] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectQuickTag = (tag: typeof QUICK_TAGS[0]) => {
    setDescription(tag.text);
    setCategory(tag.cat);
    if (tag.text.includes('ล้างแอร์')) {
      setResetAc(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !description.trim()) return;

    setLoading(true);
    try {
      await addMaintenanceLog(
        {
          room_id: roomId,
          date,
          action_type: category,
          description: description.trim(),
          cost: Number(cost) || 0,
          technician_name: technician.trim() || 'ช่างรีสอร์ท',
        },
        resetAc
      );
      onSuccess();
      onClose();
      // Reset form
      setDescription('');
      setCost('');
      setResetAc(false);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">บันทึกการซ่อม / เปลี่ยนอุปกรณ์</h2>
              <p className="text-xs text-slate-500">บันทึกประวัติการเปลี่ยนหลอดไฟ ซ่อมห้องน้ำ หรือล้างแอร์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Room and Date in row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บ้านพักที่ดำเนินการ <span className="text-red-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ดำเนินการ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                required
              />
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">หมวดหมู่งาน</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setCategory(cat.key);
                      if (cat.key === 'ac_cleaning') setResetAc(true);
                      else setResetAc(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ⚡ กดเลือกรายการด่วน (แม่บ้านแตะเลือกได้ทันที):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/70">
              {QUICK_TAGS.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickTag(tag)}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-300/80 hover:border-amber-400 hover:text-amber-800 text-slate-700 rounded-lg shadow-2xl shadow-slate-100 transition"
                >
                  + {tag.text}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดสิ่งที่ซ่อม หรือเปลี่ยน <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="เช่น เปลี่ยนหลอดไฟ LED 9W ในห้องน้ำ 1 หลอด, เปลี่ยนรีโมทแอร์ใหม่"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Cost and Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ค่าใช้จ่าย / ราคาอะไหล่ (บาท)</label>
              <input
                type="number"
                min="0"
                placeholder="เช่น 120 (เว้นว่างได้)"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้ดำเนินการ / ช่าง</label>
              <input
                type="text"
                placeholder="เช่น แม่บ้านนก, ช่างสมคิด"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reset AC option */}
          {category === 'ac_cleaning' && (
            <label className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={resetAc}
                onChange={(e) => setResetAc(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-blue-900 font-medium">
                รีเซ็ตจำนวนวันใช้งานแอร์ของห้องนี้กลับเป็น 0 วัน ด้วย (เริ่มนับรอบ 90 วันใหม่)
              </span>
            </label>
          )}

          {/* Buttons */}
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
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกประวัติการซ่อม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
