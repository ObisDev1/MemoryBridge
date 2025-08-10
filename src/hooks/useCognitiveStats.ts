import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCognitiveStats() {
  const { user } = useAuth()

  const { data: stats, refetch } = useQuery({
    queryKey: ['cognitive-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user,
    refetchInterval: 5000 // Refresh every 5 seconds to show real-time updates
  })

  const { data: insights } = useQuery({
    queryKey: ['cognitive-insights', user?.id, stats?.updated_at],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase.rpc('get_cognitive_insights', {
        user_uuid: user.id
      })
      
      if (error) throw error
      return data
    },
    enabled: !!user && !!stats
  })

  const getCognitiveLevel = (statValue: number) => {
    if (statValue >= 90) return { level: 'Genius', color: 'text-yellow-400', description: 'Top 1% performance' }
    if (statValue >= 80) return { level: 'Expert', color: 'text-purple-400', description: 'Exceptional ability' }
    if (statValue >= 70) return { level: 'Advanced', color: 'text-blue-400', description: 'Above average' }
    if (statValue >= 50) return { level: 'Proficient', color: 'text-green-400', description: 'Good performance' }
    if (statValue >= 30) return { level: 'Developing', color: 'text-yellow-500', description: 'Making progress' }
    return { level: 'Beginner', color: 'text-gray-400', description: 'Starting journey' }
  }

  const getStatImprovement = () => {
    // This would track improvement over time - simplified for now
    return Math.floor(Math.random() * 10) // Placeholder
  }

  return {
    stats,
    insights: insights?.insights || [],
    getCognitiveLevel,
    getStatImprovement,
    refetchStats: refetch
  }
}