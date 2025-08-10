import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

export function DailyBonus() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [showClaimed, setShowClaimed] = useState(false)
  const queryClient = useQueryClient()

  const { data: todayBonus } = useQuery({
    queryKey: ['daily-bonus', user?.id, new Date().toDateString()],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('daily_bonuses')
        .select('*')
        .eq('user_id', user.id)
        .eq('bonus_date', new Date().toISOString().split('T')[0])
        .eq('bonus_type', 'daily')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user
  })

  const claimBonus = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase.rpc('claim_daily_bonus', {
        user_uuid: user.id
      })
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowClaimed(true)
        setTimeout(() => setShowClaimed(false), 3000)
        queryClient.invalidateQueries({ queryKey: ['daily-bonus', user?.id] })
        queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      }
    }
  })

  const handleClaim = async () => {
    try {
      const result = await claimBonus.mutateAsync()
      if (!result.success) {
        alert(result.error)
      }
    } catch (error) {
      console.error('Claim failed:', error)
    }
  }

  const baseGems = 10
  const premiumBonus = profile?.is_premium ? baseGems : 0
  const totalGems = baseGems + premiumBonus
  const alreadyClaimed = !!todayBonus

  return (
    <div className="card animate-float relative overflow-hidden">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🎁</div>
        <h3 className="text-xl font-black text-white mb-2">Daily Bonus</h3>
        
        <div className="mb-4">
          <div className="text-3xl font-black text-yellow-400 mb-1">
            💎 {totalGems} Gems
          </div>
          {profile?.is_premium && (
            <div className="text-sm text-purple-300 font-bold">
              👑 Premium 2x Bonus!
            </div>
          )}
        </div>

        {alreadyClaimed ? (
          <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-4">
            <div className="text-green-400 font-bold mb-1">✅ Claimed Today!</div>
            <div className="text-green-300 text-sm">Come back tomorrow for more gems</div>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claimBonus.isPending}
            className="w-full game-button hover:scale-105"
          >
            {claimBonus.isPending ? 'Claiming...' : '🎁 Claim Daily Bonus'}
          </button>
        )}

        {!profile?.is_premium && (
          <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-2xl">
            <div className="text-purple-300 text-sm font-bold">
              👑 Premium users get 2x daily gems!
            </div>
          </div>
        )}
      </div>

      {showClaimed && (
        <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center rounded-3xl animate-fade-in">
          <div className="text-center">
            <div className="text-6xl mb-2 animate-bounce">🎉</div>
            <div className="text-white font-black text-xl">+{totalGems} Gems!</div>
          </div>
        </div>
      )}
    </div>
  )
}