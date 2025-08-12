import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Debug all environment variables
console.log('=== FULL ENV DEBUG ===');
console.log('import.meta.env:', import.meta.env);
console.log('Object.keys(import.meta.env):', Object.keys(import.meta.env));
console.log('VITE_SUPABASE_URL raw:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY raw:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('========================');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yatljmlakpguawtuwhhf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdGxqbWxha3BndWF3dHV3aGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3ODU2NDgsImV4cCI6MjA3MDM2MTY0OH0.MRvjGwKrB8_VGIJJL85d9_6Zmcpgbj725u60v4hDyQc'

console.log('Final values:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length);
console.log('Mode:', import.meta.env.MODE);

let supabase: any;
try {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  throw error;
}

export { supabase }

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']