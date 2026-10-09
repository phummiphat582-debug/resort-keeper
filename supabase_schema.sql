-- ==========================================
-- สคริปต์สร้างฐานข้อมูล Supabase สำหรับระบบรีสอร์ท (ไม่มีข้อมูลเดโม่)
-- คัดลอกข้อความทั้งหมดนี้ไปวางในเมนู SQL Editor ของ Supabase แล้วกด "RUN"
-- ==========================================

-- 1. สร้างตารางข้อมูลบ้านพัก (rooms)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ac_days_used INTEGER NOT NULL DEFAULT 0,
    last_ac_cleaned_date DATE,
    status TEXT NOT NULL DEFAULT 'available',
    ac_model TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. สร้างตารางบันทึกการเข้าพักรายวัน (occupancies)
CREATE TABLE IF NOT EXISTS public.occupancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, date)
);

-- 3. สร้างตารางบันทึกงานซ่อมบำรุงและล้างแอร์ (maintenance_logs)
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'repair', -- 'ac_cleaning', 'electrical', 'plumbing', 'furniture', 'other'
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    technician_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ตั้งค่า RLS (Row Level Security) เพื่อให้เว็บแอพสามารถ อ่าน-เขียน-แก้ไข ข้อมูลได้
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all rooms" ON public.rooms;
CREATE POLICY "Allow public all rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all occupancies" ON public.occupancies;
CREATE POLICY "Allow public all occupancies" ON public.occupancies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all maintenance_logs" ON public.maintenance_logs;
CREATE POLICY "Allow public all maintenance_logs" ON public.maintenance_logs FOR ALL USING (true) WITH CHECK (true);

-- 5. เปิดใช้งาน Supabase Realtime เพื่อให้อัปเดตสดพร้อมกันทุกเครื่อง
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.occupancies;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
