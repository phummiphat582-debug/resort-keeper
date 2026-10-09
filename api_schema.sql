-- Create tables in api schema so PostgREST can expose them
CREATE TABLE IF NOT EXISTS api.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ac_days_used INTEGER NOT NULL DEFAULT 0,
    last_ac_cleaned_date DATE,
    status TEXT NOT NULL DEFAULT 'available',
    ac_model TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS api.occupancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES api.rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, date)
);

CREATE TABLE IF NOT EXISTS api.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES api.rooms(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'repair',
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    technician_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE api.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE api.maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all rooms" ON api.rooms;
CREATE POLICY "Allow public all rooms" ON api.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all occupancies" ON api.occupancies;
CREATE POLICY "Allow public all occupancies" ON api.occupancies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all maintenance_logs" ON api.maintenance_logs;
CREATE POLICY "Allow public all maintenance_logs" ON api.maintenance_logs FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA api TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA api TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO anon, authenticated, service_role;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE api.rooms; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE api.occupancies; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE api.maintenance_logs; EXCEPTION WHEN others THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';
