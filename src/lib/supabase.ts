import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Hardcoded values - no environment variables
const SUPABASE_URL = 'https://yatljmlakpguawtuwhhf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdGxqbWxha3BndWF3dHV3aGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3ODU2NDgsImV4cCI6MjA3MDM2MTY0OH0.MRvjGwKrB8_VGIJJL85d9_6Zmcpgbj725u60v4hDyQc'

const url = SUPABASE_URL
const key = SUPABASE_ANON_KEY

export const supabase = createClient<Database>(url, key)

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']