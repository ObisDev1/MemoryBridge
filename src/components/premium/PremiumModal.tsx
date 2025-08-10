import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const queryClient = useQueryClient()

  const startTrial = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase.rpc('grant_premium_trial', {
        user_uuid: user.id,
        days: 7
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      onClose()
    }
  })

  const handleStartTrial = async () => {
    try {
      const result = await startTrial.mutateAsync()
      if (!result.success) {
        alert(result.error)
      }
    } catch (error) {
      console.error('Trial failed:', error)
    }
  }

  if (!isOpen) return null

  const plans = {
    monthly: { price: '$9.99', period: 'month', savings: null },
    yearly: { price: '$99.99', period: 'year', savings: '17% OFF' }
  }

  const features = [
    { icon: '⚡', text: 'Unlimited Premium Powerups' },
    { icon: '📊', text: 'Advanced Analytics Dashboard' },
    { icon: '🎨', text: 'Exclusive Themes & Customization' },
    { icon: '🎮', text: 'Premium-Only Memory Games' },
    { icon: '💎', text: '2x Daily Gem Bonuses' },
    { icon: '🚫', text: 'Ad-Free Experience' },
    { icon: '☁️', text: 'Cloud Progress Sync' },
    { icon: '🏆', text: 'Enhanced Leaderboard Visibility' }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-game-card to-game-accent rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 animate-slide-up">
        <div className="p-8">
          <div className="text-center mb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            
            <div className="text-6xl mb-4 animate-glow">👑</div>
            <h2 className="text-4xl font-black neon-text mb-2">MemoryBridge Premium</h2>
            <p className="text-gray-300 text-lg">Unlock your full cognitive potential</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(plans).map(([planType, plan]) => (
              <button
                key={planType}
                onClick={() => setSelectedPlan(planType as 'monthly' | 'yearly')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 relative ${
                  selectedPlan === planType
                    ? 'border-neon-purple bg-purple-500/20 scale-105'
                    : 'border-gray-600 hover:border-purple-400'
                }`}
              >
                {plan.savings && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {plan.savings}
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2 capitalize">{planType}</h3>
                  <div className="text-3xl font-black text-neon-blue mb-1">{plan.price}</div>
                  <p className="text-gray-400">per {plan.period}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-black/30 rounded-xl animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-white font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleStartTrial}
              disabled={startTrial.isPending}
              className="w-full game-button py-4 text-lg font-bold"
            >
              {startTrial.isPending ? 'Starting Trial...' : '🚀 Start 7-Day Free Trial'}
            </button>
            
            <button
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              💳 Subscribe {plans[selectedPlan].price}/{plans[selectedPlan].period}
            </button>
            
            <p className="text-center text-gray-400 text-sm">
              Cancel anytime. No commitment required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}