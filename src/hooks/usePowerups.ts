import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface ActivePowerup {
  id: string
  name: string
  icon: string
  duration?: number
  uses?: number
}

export function usePowerups() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activePowerups, setActivePowerups] = useState<ActivePowerup[]>([])

  const { data: inventory } = useQuery({
    queryKey: ['user-inventory', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('user_inventory')
        .select(`
          *,
          store_items(name, icon, category)
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0)
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const usePowerup = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('user_inventory')
        .update({ 
          quantity: supabase.raw('quantity - 1'),
          last_used: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-inventory', user?.id] })
    }
  })

  const activatePowerup = useCallback((powerupName: string, itemId: string) => {
    const powerupConfig = {
      'Time Freeze': { duration: 5000, icon: '⏸️' },
      'Double Score': { uses: 1, icon: '2️⃣' },
      'Shield': { uses: 1, icon: '🛡️' },
      'Lightning Boost': { duration: 10000, icon: '⚡' }
    }

    const config = powerupConfig[powerupName as keyof typeof powerupConfig]
    if (!config) return

    const newPowerup: ActivePowerup = {
      id: itemId,
      name: powerupName,
      icon: config.icon,
      ...config
    }

    setActivePowerups(prev => [...prev, newPowerup])
    usePowerup.mutate(itemId)

    if (config.duration) {
      setTimeout(() => {
        setActivePowerups(prev => prev.filter(p => p.id !== itemId))
      }, config.duration)
    }
  }, [usePowerup])

  const consumePowerup = useCallback((powerupName: string) => {
    setActivePowerups(prev => 
      prev.map(p => 
        p.name === powerupName && p.uses 
          ? { ...p, uses: p.uses - 1 }
          : p
      ).filter(p => !p.uses || p.uses > 0)
    )
  }, [])

  const hasPowerup = useCallback((powerupName: string) => {
    return activePowerups.some(p => p.name === powerupName)
  }, [activePowerups])

  const getPowerupQuantity = useCallback((powerupName: string) => {
    const item = inventory?.find(inv => inv.store_items?.name === powerupName)
    return item?.quantity || 0
  }, [inventory])

  return {
    activePowerups,
    activatePowerup,
    consumePowerup,
    hasPowerup,
    getPowerupQuantity,
    inventory: inventory?.filter(inv => inv.store_items?.category === 'powerup') || []
  }
}