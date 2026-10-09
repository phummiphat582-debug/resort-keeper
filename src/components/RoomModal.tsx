import React, { useState } from 'react';
import type { Room } from '../types';
import { saveRoom, deleteRoom } from '../lib/dataService';
import { X, Plus, Trash2, Home, Wind } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onRoomsUpdated: () => void;
}

export const RoomModal: React.FC<Props> = ({ isOpen, onClose, rooms, onRoomsUpdated }) => {
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [name, setName] = useState('');
  const [acModel, setAcModel] = useState('');
  const [notes, setNotes] = useState('');
  const [acDays, setAcDays] = useState(0);

  if (!isOpen) return null;

  const startCreate = () => {
    setEditingRoom({});
    setName('');
    setAcModel('Daikin Inverter 18000 BTU');
    setNotes('');
    setAcDays(0);
  };

  const startEdit = (room: Room) => {
    setEditingRoom(room);
    setName(room.name);
    setAcModel(room.ac_model || '');
    setNotes(room.notes || '');
    setAcDays(room.ac_days_used || 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveRoom({
      id: editingRoom?.id,
      name: name.trim(),
      ac_model: acModel.trim(),
      notes: notes.trim(),
      ac_days_used: Number(acDays) || 0,
    });

    setEditingRoom(null);
    onRoomsUpdated();
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (confirm(`คุณต้องการลบ "${roomName}" ใช่หรือไม่? (ประวัติการเข้าพักและงานซ่อมของบ้านนี้จะถูกลบด้วย)`)) {
      await deleteRoom(roomId);
      onRoomsUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">จัดการข้อมูลบ้านพัก</h2>
              <p className="text-xs text-slate-500">เพิ่ม แก้ไข หรือลบรายชื่อบ้านพักในรีสอร์ท</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {editingRoom ? (
            <form onSubmit={handleSave} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                {editingRoom.id ? 'แก้ไขข้อมูลบ้านพัก' : 'เพิ่มบ้านพักใหม่'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อบ้านพัก / หมายเลขห้อง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น บ้าน 7 (วิวภูเขา)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รุ่น/ยี่ห้อเครื่องปรับอากาศ (แอร์)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Mitsubishi 12000 BTU"
                  value={acModel}
                  onChange={(e) => setAcModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนวันใช้งานแอร์ปัจจุบัน (วัน)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={acDays}
                  onChange={(e) => setAcDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น เตียงเดี่ยว, วิวสระว่ายน้ำ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={startCreate}
              className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-5 h-5" />
              เพิ่มบ้านพักหลังใหม่
            </button>
          )}

          {/* List of existing rooms */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              รายชื่อบ้านพักทั้งหมด ({rooms.length} หลัง)
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {rooms.map((room) => (
                <div key={room.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 bg-white">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{room.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Wind className="w-3.5 h-3.5 text-blue-500" />
                      {room.ac_model || 'ไม่ระบุรุ่นแอร์'} • สะสม {room.ac_days_used || 0}/90 วัน
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(room)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(room.id, room.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="ลบห้องพัก"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
