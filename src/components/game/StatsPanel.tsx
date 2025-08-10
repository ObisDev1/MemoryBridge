import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function StatsPanel() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: recentSessions } = useQuery({
    queryKey: ['recent-sessions', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!user
  })

  const { data: gameStats } = useQuery({
    queryKey: ['game-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      return data
    },
    enabled: !!user
  })

  const totalGames = recentSessions?.length || 0
  const avgScore = recentSessions?.length 
    ? Math.round(recentSessions.reduce((sum, session) => sum + session.score, 0) / recentSessions.length)
    : 0

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center hover:scale-105 transition-all duration-300 animate-float">
          <h3 className="text-lg font-bold text-white mb-2">Level</h3>
          <div className="text-4xl font-black text-neon-purple animate-glow">
            {profile?.skill_level || 1}
          </div>
        </div>
        
        <div className="card text-center hover:scale-105 transition-all duration-300 animate-float" style={{animationDelay: '0.2s'}}>
          <h3 className="text-lg font-bold text-white mb-2">Total Score</h3>
          <div className="text-4xl font-black text-neon-blue animate-glow">
            {profile?.total_score?.toLocaleString() || 0}
          </div>
        </div>
        
        <div className="card text-center hover:scale-105 transition-all duration-300 animate-float" style={{animationDelay: '0.4s'}}>
          <h3 className="text-lg font-bold text-white mb-2">Games Played</h3>
          <div className="text-4xl font-black text-green-400 animate-glow">
            {totalGames}
          </div>
        </div>
        
        <div className="card text-center hover:scale-105 transition-all duration-300 animate-float" style={{animationDelay: '0.6s'}}>
          <h3 className="text-lg font-bold text-white mb-2">Avg Score</h3>
          <div className="text-4xl font-black text-yellow-400 animate-glow">
            {avgScore}
          </div>
        </div>
      </div>

      {gameStats && (
        <div className="card animate-float">
          <h3 className="text-2xl font-black text-white mb-6 neon-text">🧠 Cognitive Stats</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Memory Strength</span>
                <span className="text-neon-purple font-bold">{gameStats.memory_strength}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-neon-purple to-neon-blue h-3 rounded-full transition-all duration-1000 animate-glow"
                  style={{ width: `${gameStats.memory_strength}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Focus Duration</span>
                <span className="text-neon-blue font-bold">{gameStats.focus_duration}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-neon-blue to-green-400 h-3 rounded-full transition-all duration-1000 animate-glow"
                  style={{ width: `${gameStats.focus_duration}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Distraction Resistance</span>
                <span className="text-green-400 font-bold">{gameStats.distraction_resistance}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-yellow-400 h-3 rounded-full transition-all duration-1000 animate-glow"
                  style={{ width: `${gameStats.distraction_resistance}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Context Switching</span>
                <span className="text-yellow-400 font-bold">{gameStats.context_switching_speed}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-red-400 h-3 rounded-full transition-all duration-1000 animate-glow"
                  style={{ width: `${gameStats.context_switching_speed}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}