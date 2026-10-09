import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'resort_supabase_url';
const STORAGE_KEY_KEY = 'resort_supabase_key';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
}

let supabaseInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance || lastUrl !== url || lastKey !== anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      lastUrl = url;
      lastKey = anonKey;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}
