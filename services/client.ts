import { createClient } from '@supabase/supabase-js';

// Read from environment variables (set in .env or Vercel)
// Fallback to hardcoded values for reliability (these are public keys, safe to include)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xskzykobzlexshjwaulw.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhza3p5a29iemxleHNoandhdWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjcxNTQsImV4cCI6MjA4NDEwMzE1NH0.Oqd9gA1e1CI0BoEn4GC54vpQdZu-VumTZnP5v7IAao8';

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