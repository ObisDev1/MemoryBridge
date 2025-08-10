import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'

export function SubscriptionManager() {
  const { user } = useAuth()
  const { subscription, isPremium, isTrialActive, daysUntilExpiry } = usePremiumFeatures()
  const queryClient = useQueryClient()

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      if (!user || !subscription) throw new Error('No active subscription')
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false 
        })
        .eq('id', subscription.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] })
    }
  })

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      if (!user || !subscription) throw new Error('No subscription found')
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          auto_renew: true 
        })
        .eq('id', subscription.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] })
    }
  })

  if (!isPremium) {
    return (
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
          <p className="text-gray-300 mb-4">Upgrade to Premium to unlock all features</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-white mb-4">Subscription Management</h3>
      
      <div className="space-y-4">
        <div className="bg-black/30 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Status</span>
            <span className={`font-bold ${
              subscription?.status === 'active' ? 'text-green-400' :
              subscription?.status === 'trial' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {subscription?.status?.toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Plan</span>
            <span className="text-white font-bold capitalize">
              {subscription?.plan_type} {isTrialActive && '(Trial)'}
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Expires</span>
            <span className="text-white font-bold">
              {subscription?.expires_at 
                ? new Date(subscription.expires_at).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Auto Renew</span>
            <span className={`font-bold ${
              subscription?.auto_renew ? 'text-green-400' : 'text-red-400'
            }`}>
              {subscription?.auto_renew ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-yellow-400 font-bold">Subscription Expiring Soon</div>
                <div className="text-yellow-300 text-sm">
                  Your subscription expires in {daysUntilExpiry} days
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {subscription?.status === 'active' && subscription?.auto_renew ? (
            <button
              onClick={() => cancelSubscription.mutate()}
              disabled={cancelSubscription.isPending}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-bold py-3 px-4 rounded-xl transition-all duration-300"
            >
              {cancelSubscription.isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          ) : subscription?.status === 'cancelled' ? (
            <button
              onClick={() => reactivateSubscription.mutate()}
              disabled={reactivateSubscription.isPending}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 font-bold py-3 px-4 rounded-xl transition-all duration-300"
            >
              {reactivateSubscription.isPending ? 'Reactivating...' : 'Reactivate Subscription'}
            </button>
          ) : null}
          
          <button className="flex-1 game-button">
            💳 Update Payment
          </button>
        </div>
        
        {!isTrialActive && (
          <div className="text-center">
            <button className="text-purple-400 hover:text-purple-300 text-sm underline">
              Switch to Yearly Plan (Save 17%)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}