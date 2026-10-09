import { getSupabase } from './supabase';
import type { Room, OccupancyRecord, MaintenanceLog } from '../types';

const STORAGE_KEY_ROOMS = 'resort_data_rooms';
const STORAGE_KEY_OCCUPANCIES = 'resort_data_occupancies';
const STORAGE_KEY_LOGS = 'resort_data_maintenance_logs';
const STORAGE_KEY_VERSION = 'resort_v2_clean';

// Automatically wipe old demo mock data from previous sessions
function checkAndClearDemoData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY_VERSION) !== 'true') {
    const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (stored && (stored.includes('room-1') || stored.includes('ริมธาร'))) {
      localStorage.removeItem(STORAGE_KEY_ROOMS);
      localStorage.removeItem(STORAGE_KEY_OCCUPANCIES);
      localStorage.removeItem(STORAGE_KEY_LOGS);
    }
    localStorage.setItem(STORAGE_KEY_VERSION, 'true');
  }
}

// Clear all local data manually if requested
export function clearAllLocalData() {
  localStorage.removeItem(STORAGE_KEY_ROOMS);
  localStorage.removeItem(STORAGE_KEY_OCCUPANCIES);
  localStorage.removeItem(STORAGE_KEY_LOGS);
}

// Helper to format date YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format Thai Date
export function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'ยังไม่มีข้อมูล';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10) + 543;
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Local Storage helpers
function getLocalRooms(): Room[] {
  checkAndClearDemoData();
  const stored = localStorage.getItem(STORAGE_KEY_ROOMS);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalRooms(rooms: Room[]) {
  localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
}

function getLocalOccupancies(): OccupancyRecord[] {
  checkAndClearDemoData();
  const stored = localStorage.getItem(STORAGE_KEY_OCCUPANCIES);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalOccupancies(data: OccupancyRecord[]) {
  localStorage.setItem(STORAGE_KEY_OCCUPANCIES, JSON.stringify(data));
}

function getLocalLogs(): MaintenanceLog[] {
  checkAndClearDemoData();
  const stored = localStorage.getItem(STORAGE_KEY_LOGS);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalLogs(data: MaintenanceLog[]) {
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(data));
}

// -------------------------------------------------------------
// Unified Data Service Methods
// -------------------------------------------------------------

export async function fetchRooms(): Promise<Room[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as Room[];
    } catch (err) {
      console.warn('Error fetching rooms from Supabase, fallback to local:', err);
    }
  }
  return getLocalRooms();
}

export async function fetchOccupancies(monthPrefix?: string): Promise<OccupancyRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase.from('occupancies').select('*');
      if (monthPrefix) {
        query = query.like('date', `${monthPrefix}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OccupancyRecord[];
    } catch (err) {
      console.warn('Error fetching occupancies from Supabase, fallback to local:', err);
    }
  }

  const local = getLocalOccupancies();
  if (monthPrefix) {
    return local.filter((r) => r.date.startsWith(monthPrefix));
  }
  return local;
}

export async function fetchMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as MaintenanceLog[];
    } catch (err) {
      console.warn('Error fetching maintenance logs from Supabase, fallback to local:', err);
    }
  }
  return getLocalLogs().sort((a, b) => b.date.localeCompare(a.date));
}

// Toggle occupancy for a room on a given date (1 = occupied, 0 = available)
export async function toggleRoomOccupancy(
  room: Room,
  date: string,
  targetOccupiedState?: boolean
): Promise<{ isOccupied: boolean; updatedRoom: Room }> {
  const supabase = getSupabase();
  const today = getTodayDateString();

  if (supabase) {
    try {
      // 1. Check existing record
      const { data: existing } = await supabase
        .from('occupancies')
        .select('*')
        .eq('room_id', room.id)
        .eq('date', date)
        .maybeSingle();

      const willBeOccupied =
        targetOccupiedState !== undefined
          ? targetOccupiedState
          : !existing || !existing.is_occupied;

      if (willBeOccupied) {
        // Upsert record
        await supabase.from('occupancies').upsert(
          {
            room_id: room.id,
            date,
            is_occupied: true,
          },
          { onConflict: 'room_id,date' }
        );
      } else {
        // Delete or set false
        await supabase
          .from('occupancies')
          .delete()
          .eq('room_id', room.id)
          .eq('date', date);
      }

      // Calculate new AC usage counter
      const delta = willBeOccupied ? (existing ? 0 : 1) : (existing ? -1 : 0);
      const newAcDays = Math.max(0, (room.ac_days_used || 0) + delta);
      const newStatus = date === today ? (willBeOccupied ? 'occupied' : 'available') : room.status;

      const { data: updatedRoomData, error: roomErr } = await supabase
        .from('rooms')
        .update({
          ac_days_used: newAcDays,
          status: newStatus,
        })
        .eq('id', room.id)
        .select()
        .single();

      if (roomErr) throw roomErr;

      return {
        isOccupied: willBeOccupied,
        updatedRoom: updatedRoomData as Room,
      };
    } catch (err) {
      console.error('Supabase toggle error, falling back to local:', err);
    }
  }

  // Local fallback
  const occupancies = getLocalOccupancies();
  const existingIdx = occupancies.findIndex(
    (o) => o.room_id === room.id && o.date === date
  );

  const willBeOccupied =
    targetOccupiedState !== undefined
      ? targetOccupiedState
      : existingIdx === -1;

  if (willBeOccupied && existingIdx === -1) {
    occupancies.push({
      id: 'occ-' + Date.now(),
      room_id: room.id,
      date,
      is_occupied: true,
    });
  } else if (!willBeOccupied && existingIdx !== -1) {
    occupancies.splice(existingIdx, 1);
  }
  saveLocalOccupancies(occupancies);

  // Update room
  const delta = willBeOccupied ? (existingIdx === -1 ? 1 : 0) : (existingIdx !== -1 ? -1 : 0);
  const updatedRooms = getLocalRooms().map((r) => {
    if (r.id === room.id) {
      return {
        ...r,
        ac_days_used: Math.max(0, r.ac_days_used + delta),
        status: date === today ? (willBeOccupied ? 'occupied' : 'available') : r.status,
      } as Room;
    }
    return r;
  });
  saveLocalRooms(updatedRooms);

  const updatedRoom = updatedRooms.find((r) => r.id === room.id)!;
  return { isOccupied: willBeOccupied, updatedRoom };
}

// Reset AC Counter after cleaning and automatically create a log
export async function resetRoomAcCleaning(
  roomId: string,
  technicianName = 'ช่างแอร์',
  cost = 500,
  note = 'ล้างแอร์รอบ 90 วัน เรียบร้อย (ทำความสะอาดฟิลเตอร์ + คอยล์เย็น)'
): Promise<{ updatedRoom: Room; newLog: MaintenanceLog }> {
  const today = getTodayDateString();
  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Update room
      const { data: updatedRoom, error: roomErr } = await supabase
        .from('rooms')
        .update({
          ac_days_used: 0,
          last_ac_cleaned_date: today,
        })
        .eq('id', roomId)
        .select()
        .single();
      if (roomErr) throw roomErr;

      // 2. Insert maintenance log
      const { data: logData, error: logErr } = await supabase
        .from('maintenance_logs')
        .insert({
          room_id: roomId,
          action_type: 'ac_cleaning',
          description: note,
          cost,
          technician_name: technicianName,
          date: today,
        })
        .select()
        .single();
      if (logErr) throw logErr;

      return { updatedRoom: updatedRoom as Room, newLog: logData as MaintenanceLog };
    } catch (err) {
      console.error('Supabase reset AC error, falling back to local:', err);
    }
  }

  // Local fallback
  const rooms = getLocalRooms();
  const roomIdx = rooms.findIndex((r) => r.id === roomId);
  if (roomIdx !== -1) {
    rooms[roomIdx] = {
      ...rooms[roomIdx],
      ac_days_used: 0,
      last_ac_cleaned_date: today,
    };
    saveLocalRooms(rooms);
  }

  const newLog: MaintenanceLog = {
    id: 'log-' + Date.now(),
    room_id: roomId,
    action_type: 'ac_cleaning',
    description: note,
    cost,
    technician_name: technicianName,
    date: today,
  };
  const logs = getLocalLogs();
  logs.unshift(newLog);
  saveLocalLogs(logs);

  return { updatedRoom: rooms[roomIdx], newLog };
}

// Add a maintenance/repair log
export async function addMaintenanceLog(
  log: Omit<MaintenanceLog, 'id' | 'created_at'>,
  alsoResetAc = false
): Promise<MaintenanceLog> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw error;

      if (alsoResetAc) {
        await supabase
          .from('rooms')
          .update({
            ac_days_used: 0,
            last_ac_cleaned_date: log.date,
          })
          .eq('id', log.room_id);
      }

      return data as MaintenanceLog;
    } catch (err) {
      console.error('Supabase add log error, falling back to local:', err);
    }
  }

  // Local fallback
  const newLog: MaintenanceLog = {
    ...log,
    id: 'log-' + Date.now(),
  };
  const logs = getLocalLogs();
  logs.unshift(newLog);
  saveLocalLogs(logs);

  if (alsoResetAc) {
    const rooms = getLocalRooms();
    const idx = rooms.findIndex((r) => r.id === log.room_id);
    if (idx !== -1) {
      rooms[idx].ac_days_used = 0;
      rooms[idx].last_ac_cleaned_date = log.date;
      saveLocalRooms(rooms);
    }
  }

  return newLog;
}

// Add or edit a room
export async function saveRoom(room: Partial<Room>): Promise<Room> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (room.id && !room.id.startsWith('room-')) {
        const { data, error } = await supabase
          .from('rooms')
          .update(room)
          .eq('id', room.id)
          .select()
          .single();
        if (error) throw error;
        return data as Room;
      } else {
        const { data, error } = await supabase
          .from('rooms')
          .insert({
            name: room.name,
            ac_days_used: room.ac_days_used || 0,
            last_ac_cleaned_date: room.last_ac_cleaned_date || null,
            status: room.status || 'available',
            ac_model: room.ac_model || '',
            notes: room.notes || '',
          })
          .select()
          .single();
        if (error) throw error;
        return data as Room;
      }
    } catch (err) {
      console.error('Supabase save room error, falling back to local:', err);
    }
  }

  // Local
  const rooms = getLocalRooms();
  if (room.id) {
    const idx = rooms.findIndex((r) => r.id === room.id);
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], ...room } as Room;
      saveLocalRooms(rooms);
      return rooms[idx];
    }
  }
  const newRoom: Room = {
    id: 'room-' + Date.now(),
    name: room.name || 'บ้านใหม่',
    ac_days_used: room.ac_days_used || 0,
    last_ac_cleaned_date: room.last_ac_cleaned_date || null,
    status: room.status || 'available',
    ac_model: room.ac_model || '',
    notes: room.notes || '',
  };
  rooms.push(newRoom);
  saveLocalRooms(rooms);
  return newRoom;
}

// Delete room
export async function deleteRoom(roomId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('rooms').delete().eq('id', roomId);
    } catch (err) {
      console.error('Supabase delete room error:', err);
    }
  }
  const rooms = getLocalRooms().filter((r) => r.id !== roomId);
  saveLocalRooms(rooms);
  return true;
}
