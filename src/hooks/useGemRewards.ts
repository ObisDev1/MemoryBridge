import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useGemRewards() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const awardGems = useMutation({
    mutationFn: async ({ amount }: { amount: number; reason: string }) => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ gems: amount })
        .eq('id', user.id)
        .select('gems')
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })

  const calculateGameReward = (gameType: string, score: number, successRate: number) => {
    let baseReward = Math.floor(score / 10)
    
    // Bonus for high success rate
    if (successRate >= 0.9) baseReward += 10
    else if (successRate >= 0.7) baseReward += 5
    
    // Game-specific bonuses
    switch (gameType) {
      case 'memory-sequence':
        baseReward += Math.floor(score / 50)
        break
      case 'distraction-focus':
        baseReward += Math.floor(successRate * 15)
        break
      case 'context-switch':
        baseReward += Math.floor(successRate * 20)
        break
    }
    
    return Math.max(1, Math.min(50, baseReward)) // Min 1, max 50 gems
  }

  return {
    awardGems,
    calculateGameReward
  }
}