export interface Room {
  id: string;
  name: string;
  ac_days_used: number; // Cumulative days occupied since last AC cleaning
  last_ac_cleaned_date: string | null; // YYYY-MM-DD
  status: 'available' | 'occupied' | 'maintenance';
  ac_model?: string;
  notes?: string;
  created_at?: string;
}

export interface OccupancyRecord {
  id: string;
  room_id: string;
  date: string; // YYYY-MM-DD
  is_occupied: boolean; // true = 1 day used
  created_at?: string;
}

export type MaintenanceCategory = 'ac_cleaning' | 'electrical' | 'plumbing' | 'furniture' | 'other';

export interface MaintenanceLog {
  id: string;
  room_id: string;
  action_type: MaintenanceCategory;
  description: string;
  cost: number;
  technician_name: string;
  date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
