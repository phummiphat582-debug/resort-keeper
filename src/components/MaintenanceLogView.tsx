import React, { useState } from 'react';
import type { MaintenanceLog, Room } from '../types';
import { formatThaiDate, deleteMaintenanceLog } from '../lib/dataService';
import { Wrench, Plus, Search, Lightbulb, Wind, Droplets, Bed, Hammer, User, Calendar, Trash2 } from 'lucide-react';

interface Props {
  logs: MaintenanceLog[];
  rooms: Room[];
  onOpenAddModal: () => void;
  onDataChanged?: () => void;
}

export const MaintenanceLogView: React.FC<Props> = ({ logs, rooms, onOpenAddModal, onDataChanged }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : 'ไม่ระบุบ้าน';
  };

  const handleDeleteLog = async (log: MaintenanceLog) => {
    const isAc = log.action_type === 'ac_cleaning';
    const roomName = getRoomName(log.room_id);
    const confirmMsg = isAc
      ? `คุณต้องการยกเลิก/ลบประวัติการล้างแอร์วันที่ ${formatThaiDate(log.date)} ของ "${roomName}" ใช่หรือไม่?\n\n(กรณีลงผิดวัน ระบบจะลบประวัตินี้และคำนวณวันใช้งานแอร์สะสมกลับคืนให้อัตโนมัติ)`
      : `คุณต้องการลบประวัติงานซ่อม "${log.description}" ของ "${roomName}" ใช่หรือไม่?`;

    if (!confirm(confirmMsg)) return;

    setDeletingId(log.id);
    try {
      await deleteMaintenanceLog(log.id, log.room_id);
      onDataChanged?.();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบรายการ');
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'electrical':
        return { label: 'ไฟฟ้า/หลอดไฟ', icon: Lightbulb, color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'ac_cleaning':
        return { label: 'ล้างแอร์/ระบบแอร์', icon: Wind, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'plumbing':
        return { label: 'ประปา/ห้องน้ำ', icon: Droplets, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'furniture':
        return { label: 'เฟอร์นิเจอร์/ที่นอน', icon: Bed, color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'ซ่อมแซมทั่วไป', icon: Hammer, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedRoomId !== 'all' && log.room_id !== selectedRoomId) return false;
    if (selectedCategory !== 'all' && log.action_type !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchTech = log.technician_name?.toLowerCase().includes(q);
      const room = getRoomName(log.room_id).toLowerCase();
      const matchRoom = room.includes(q);
      if (!matchDesc && !matchTech && !matchRoom) return false;
    }
    return true;
  });

  const totalCost = filteredLogs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            สมุดบันทึกงานซ่อม & เปลี่ยนอุปกรณ์
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกประวัติว่าบ้านไหนเปลี่ยนอะไรบ้าง วันไหน มีค่าใช้จ่ายเท่าไหร่
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ บันทึกงานซ่อม / เปลี่ยนของ</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา (เช่น หลอดไฟ, รีโมท, ช่าง)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Room */}
          <div>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            >
              <option value="all">ทุกบ้านพัก ({rooms.length} หลัง)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
            >
              <option value="all">ทุกหมวดหมู่งาน</option>
              <option value="electrical">⚡ ไฟฟ้า / หลอดไฟ</option>
              <option value="ac_cleaning">❄️ ล้างแอร์ / แอร์</option>
              <option value="plumbing">🚿 ประปา / ห้องน้ำ</option>
              <option value="furniture">🛏️ เฟอร์นิเจอร์ / ที่นอน</option>
              <option value="other">🔨 ซ่อมแซมทั่วไป</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <span>
            พบรายการ: <b className="text-slate-800">{filteredLogs.length}</b> รายการ
          </span>
          <span>
            รวมค่าใช้จ่ายทั้งหมด:{' '}
            <b className="text-emerald-700 font-bold">฿{totalCost.toLocaleString()}</b> บาท
          </span>
        </div>
      </div>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">ยังไม่มีบันทึกงานซ่อมบำรุงตามตัวกรองนี้</h3>
          <p className="text-xs text-slate-500">
            แตะที่ปุ่ม "+ บันทึกงานซ่อม / เปลี่ยนของ" ด้านบนเพื่อเริ่มบันทึกรายการ
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const meta = getCategoryMeta(log.action_type);
            const CatIcon = meta.icon;

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:border-slate-300 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${meta.color}`}>
                      <CatIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {getRoomName(log.room_id)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatThaiDate(log.date)}</span>
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === log.id}
                      onClick={() => handleDeleteLog(log)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition active:scale-95"
                      title={log.action_type === 'ac_cleaning' ? 'ยกเลิก/ลบประวัติล้างแอร์นี้ (กรณีลงผิดวัน)' : 'ลบรายการนี้'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm font-medium text-slate-800 leading-relaxed pl-1">
                  {log.description}
                </p>

                {/* Footer details: Cost and Technician */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>ผู้ดำเนินการ: <b className="text-slate-700">{log.technician_name || 'ไม่ระบุ'}</b></span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">ค่าใช้จ่าย:</span>
                    <span className={`font-bold ${log.cost > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'}`}>
                      {log.cost > 0 ? `฿${Number(log.cost).toLocaleString()} บาท` : 'ไม่มีค่าใช้จ่าย'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
