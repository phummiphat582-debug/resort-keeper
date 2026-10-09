import React, { useState } from 'react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabase } from '../lib/supabase';
import { clearAllLocalData } from '../lib/dataService';
import { X, CheckCircle, AlertTriangle, Database, Copy, Check, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseModal: React.FC<Props> = ({ isOpen, onClose, onConfigChanged }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    onConfigChanged();
    onClose();
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestStatus('idle');
    onConfigChanged();
  };

  const handleClearLocalData = () => {
    if (confirm('คุณต้องการล้างข้อมูลทั้งหมดในเครื่องนี้ใช่หรือไม่?')) {
      clearAllLocalData();
      onConfigChanged();
      alert('ล้างข้อมูลในเครื่องเรียบร้อยแล้ว');
    }
  };

  const handleTestConnection = async () => {
    if (!url || !anonKey) {
      setTestStatus('error');
      setTestMessage('กรุณากรอกทั้ง Project URL และ Anon Key');
      return;
    }
    setTestStatus('testing');
    saveSupabaseConfig(url, anonKey);
    const client = getSupabase();
    if (!client) {
      setTestStatus('error');
      setTestMessage('URL ไม่ถูกต้องตามรูปแบบของ Supabase');
      return;
    }

    try {
      const { error } = await client.from('rooms').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('relation "public.rooms" does not exist')) {
          setTestStatus('error');
          setTestMessage('เชื่อมต่อได้แล้ว แต่ยังไม่ได้สร้างตาราง! กรุณานำ SQL Script ด้านล่างไปรันใน Supabase');
        } else {
          setTestStatus('error');
          setTestMessage(`เชื่อมต่อไม่สำเร็จ: ${error.message}`);
        }
      } else {
        setTestStatus('success');
        setTestMessage('เชื่อมต่อ Supabase สำเร็จเรียบร้อย! พร้อมใช้งาน Real-time ข้ามเครื่อง');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'}`);
    }
  };

  const handleCopySql = () => {
    const sql = `-- คัดลอกและนำไปรันในเมนู SQL Editor บน Supabase เพื่อสร้างตาราง
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

CREATE TABLE IF NOT EXISTS public.occupancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, date)
);

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'repair',
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    technician_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all occupancies" ON public.occupancies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all maintenance_logs" ON public.maintenance_logs FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.occupancies; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs; EXCEPTION WHEN others THEN NULL; END;
END $$;
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">เชื่อมต่อฐานข้อมูล Supabase</h2>
              <p className="text-xs text-slate-500">สำหรับอัปเดตข้อมูลออนไลน์เรียลไทม์ ซิงค์สดข้ามทุกเครื่อง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Instructions Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-sm text-emerald-800">
              <span>💡 ขั้นตอนเปิดใช้งานระบบออนไลน์ข้ามเครื่อง (ฟรี):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed pl-1">
              <li>
                เปิดโปรเจกต์ที่{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-medium underline inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                ไปที่เมนู <b>Project Settings &gt; API</b> แล้วคัดลอก <b>Project URL</b> และ <b>anon key</b> มาวางด้านล่าง
              </li>
              <li>
                ไปที่เมนู <b>SQL Editor</b> ใน Supabase แล้วคัดลอกสคริปต์ SQL ด้านล่างไปกด RUN เพื่อสร้างตาราง
              </li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Project URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Anon Public Key <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono resize-none"
              />
            </div>
          </div>

          {/* Test Status Alert */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 ${
                testStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : testStatus === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {testStatus === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
              {testStatus === 'testing' && <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 animate-spin mt-0.5" />}
              <span className="leading-snug">{testMessage}</span>
            </div>
          )}

          {/* SQL Script Quick Copy */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">สคริปต์ SQL สำหรับสร้างตาราง</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 text-slate-700 shadow-sm transition"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              นำไปวางในหน้า SQL Editor ของ Supabase เพื่อสร้างตาราง rooms, occupancies, maintenance_logs
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
              ทดสอบการเชื่อมต่อ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              บันทึกและเปิดใช้งาน
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClearLocalData}
              className="text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างข้อมูลในเครื่องทั้งหมด</span>
            </button>

            {currentConfig.url && (
              <button
                type="button"
                onClick={handleClear}
                className="text-red-500 hover:text-red-700 hover:underline"
              >
                ยกเลิกการเชื่อมต่อ Supabase
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
