import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

export function usePremiumFeatures() {
  const { user } = useAuth()
  const { profile } = useProfile()

  const { data: premiumFeatures } = useQuery({
    queryKey: ['premium-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return data
    }
  })

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user
  })

  const hasFeature = (featureKey: string) => {
    if (!profile?.is_premium) return false
    return premiumFeatures?.some(f => f.feature_key === featureKey) || false
  }

  const isPremium = profile?.is_premium || false
  const isTrialActive = subscription?.status === 'trial'
  const subscriptionExpiry = subscription?.expires_at ? new Date(subscription.expires_at) : null
  const daysUntilExpiry = subscriptionExpiry 
    ? Math.ceil((subscriptionExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return {
    isPremium,
    isTrialActive,
    subscription,
    premiumFeatures: premiumFeatures || [],
    hasFeature,
    daysUntilExpiry,
    features: {
      unlimitedPowerups: hasFeature('unlimited_powerups'),
      advancedAnalytics: hasFeature('advanced_analytics'),
      customThemes: hasFeature('custom_themes'),
      prioritySupport: hasFeature('priority_support'),
      exclusiveGames: hasFeature('exclusive_games'),
      adFree: hasFeature('ad_free'),
      cloudSync: hasFeature('cloud_sync'),
      leaderboardBoost: hasFeature('leaderboard_boost')
    }
  }
}