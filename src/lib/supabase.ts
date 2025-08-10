import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Fallback values for production
const FALLBACK_URL = 'https://yatljmlakpguawtuwhhf.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdGxqbWxha3BndWF3dHV3aGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3ODU2NDgsImV4cCI6MjA3MDM2MTY0OH0.MRvjGwKrB8_VGIJJL85d9_6Zmcpgbj725u60v4hDyQc'

const supabaseUrl = (typeof window !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || FALLBACK_URL
const supabaseAnonKey = (typeof window !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || FALLBACK_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'memorybridge-pwa'
    }
  }
})

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']