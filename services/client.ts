import { createClient } from '@supabase/supabase-js';

// Read from environment variables (set in .env or Vercel)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xskzykobzlexshjwaulw.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY not configured. Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Importante para evitar conflictos de routing que causan AbortError
    storage: window.localStorage
  },
  db: {
    schema: 'public',
  },
});