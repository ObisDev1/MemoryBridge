import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yatljmlakpguawtuwhhf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdGxqbWxha3BndWF3dHV3aGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3ODU2NDgsImV4cCI6MjA3MDM2MTY0OH0.MRvjGwKrB8_VGIJJL85d9_6Zmcpgbj725u60v4hDyQc'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']