import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

export function useGameSessions(userId: string) {
  return useQuery({
    queryKey: ['game-sessions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export function useCreateGameSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (session: Omit<Tables<'game_sessions'>, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert(session)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['game-sessions', data.user_id] })
    },
  })
}