import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const updateProfile = useMutation({
    mutationFn: async (updates: { username?: string; display_name?: string }) => {
      if (!user) throw new Error('No user')
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })

  const updateScore = useMutation({
    mutationFn: async (points: number) => {
      if (!user || !profile) throw new Error('No user or profile')
      
      const newScore = profile.total_score + points
      const newLevel = Math.floor(newScore / 1000) + 1
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          total_score: newScore,
          skill_level: newLevel
        })
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })

  return {
    profile,
    isLoading,
    updateProfile,
    updateScore
  }
}