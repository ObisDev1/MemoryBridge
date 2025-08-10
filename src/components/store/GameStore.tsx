import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

interface StoreItem {
  id: string
  name: string
  description: string
  icon: string
  category: string
  gem_cost: number
  is_premium: boolean
}

export function GameStore() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data: storeItems } = useQuery({
    queryKey: ['store-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('gem_cost', { ascending: true })
      
      if (error) throw error
      return data as StoreItem[]
    }
  })

  const { data: userInventory } = useQuery({
    queryKey: ['user-inventory', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_inventory')
        .select('item_id, quantity')
        .eq('user_id', user.id)
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const purchaseItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase.rpc('purchase_item', {
        item_uuid: itemId,
        user_uuid: user.id
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-inventory', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })

  const filteredItems = storeItems?.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  ) || []

  const getItemQuantity = (itemId: string) => {
    return userInventory?.find(inv => inv.item_id === itemId)?.quantity || 0
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'powerup': return '⚡'
      case 'hint': return '💡'
      case 'boost': return '🚀'
      case 'cosmetic': return '🎨'
      default: return '🛍️'
    }
  }

  const handlePurchase = async (item: StoreItem) => {
    try {
      const result = await purchaseItem.mutateAsync(item.id)
      if (!result.success) {
        alert(result.error)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-text mb-4 animate-glow">🛍️ Game Store</h1>
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-3 rounded-full">
              <span className="text-black font-black text-xl">💎 {profile?.gems || 0} Gems</span>
            </div>
            {profile?.is_premium && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full">
                <span className="text-white font-bold">👑 PREMIUM</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-black/30 p-2 rounded-2xl">
            {['all', 'powerup', 'hint', 'boost', 'cosmetic'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-neon-purple text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {getCategoryIcon(category)} {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const quantity = getItemQuantity(item.id)
            const canAfford = (profile?.gems || 0) >= item.gem_cost
            const needsPremium = item.is_premium && !profile?.is_premium
            
            return (
              <div
                key={item.id}
                className="card hover:scale-105 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-float">{item.icon}</div>
                  
                  <h3 className="text-xl font-black text-white mb-2">
                    {item.name}
                    {item.is_premium && <span className="ml-2 text-yellow-400">👑</span>}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 text-sm">{item.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
                      <span className="text-yellow-400 font-bold">💎 {item.gem_cost}</span>
                    </div>
                    
                    {quantity > 0 && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        <span className="text-green-400 font-bold">Owned: {quantity}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || needsPremium || purchaseItem.isPending}
                    className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                      needsPremium
                        ? 'bg-purple-500/20 text-purple-300 cursor-not-allowed'
                        : !canAfford
                        ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                        : 'game-button hover:scale-105'
                    }`}
                  >
                    {needsPremium
                      ? '👑 Premium Required'
                      : !canAfford
                      ? '💎 Not Enough Gems'
                      : purchaseItem.isPending
                      ? 'Purchasing...'
                      : 'Purchase'
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-gray-300 text-xl">No items found in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}