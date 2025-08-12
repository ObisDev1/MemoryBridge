import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('useAuth: Starting auth check');
    
    if (!supabase) {
      console.error('useAuth: Supabase client not available');
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }: any) => {
      console.log('useAuth: Session result:', { session: !!session, error });
      if (error) {
        console.error('useAuth: Session error:', error);
        setError(error.message);
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((err: any) => {
      console.error('useAuth: Session catch:', err);
      setError(err.message);
      setLoading(false);
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, error, signIn, signUp, signOut, signInWithGoogle }
}