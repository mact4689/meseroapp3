import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xskzykobzlexshjwaulw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhza3p5a29iemxleHNoandhdWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjcxNTQsImV4cCI6MjA4NDEwMzE1NH0.Oqd9gA1e1CI0BoEn4GC54vpQdZu-VumTZnP5v7IAao8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);