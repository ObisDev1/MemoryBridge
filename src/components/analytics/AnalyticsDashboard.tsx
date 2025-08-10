import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { PerformanceChart } from './PerformanceChart'
import { CognitiveInsights } from './CognitiveInsights'
import { GameBreakdown } from './GameBreakdown'

export function AnalyticsDashboard() {
  const { user } = useAuth()

  const { data: sessions } = useQuery({
    queryKey: ['game-sessions', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: stats } = useQuery({
    queryKey: ['game-stats', user?.id],
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
    enabled: !!user
  })

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Analytics Dashboard</h1>
          <p className="text-xl text-gray-300">Deep insights into your cognitive performance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PerformanceChart sessions={sessions || []} />
          <CognitiveInsights stats={stats} sessions={sessions || []} />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <GameBreakdown sessions={sessions || []} />
        </div>
      </div>
    </div>
  )
}