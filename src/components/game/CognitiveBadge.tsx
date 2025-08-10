import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface CognitiveLevel {
  level: number
  name: string
  description: string
  icon: string
  min_memory_strength: number
  min_focus_duration: number
  min_distraction_resistance: number
  min_context_switching_speed: number
}

export function CognitiveBadge() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data } = await supabase
        .from('profiles')
        .select('cognitive_level, cognitive_badge')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user
  })

  const { data: currentLevel } = useQuery({
    queryKey: ['cognitive-level', profile?.cognitive_level],
    queryFn: async () => {
      if (!profile?.cognitive_level) return null
      const { data } = await supabase
        .from('cognitive_levels')
        .select('*')
        .eq('level', profile.cognitive_level)
        .single()
      return data
    },
    enabled: !!profile?.cognitive_level
  })

  const { data: nextLevel } = useQuery({
    queryKey: ['next-cognitive-level', profile?.cognitive_level],
    queryFn: async () => {
      if (!profile?.cognitive_level) return null
      const { data } = await supabase
        .from('cognitive_levels')
        .select('*')
        .eq('level', profile.cognitive_level + 1)
        .single()
      return data
    },
    enabled: !!profile?.cognitive_level && profile.cognitive_level < 10
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

  if (!profile || !currentLevel) {
    return null
  }

  const isMaxLevel = profile.cognitive_level >= 10
  const canLevelUp = nextLevel && gameStats && (
    gameStats.memory_strength >= nextLevel.min_memory_strength &&
    gameStats.focus_duration >= nextLevel.min_focus_duration &&
    gameStats.distraction_resistance >= nextLevel.min_distraction_resistance &&
    gameStats.context_switching_speed >= nextLevel.min_context_switching_speed
  )

  return (
    <div className="card animate-float">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white mb-4 neon-text">🏅 Cognitive Badge</h2>
        
        <div className="relative inline-block mb-4">
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black
            ${isMaxLevel ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 animate-glow' : 
              canLevelUp ? 'bg-gradient-to-r from-green-400 to-green-600 animate-pulse' :
              'bg-gradient-to-r from-neon-purple to-neon-blue'}
          `}>
            {currentLevel.icon}
          </div>
          
          {canLevelUp && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-sm font-bold">↑</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          Level {profile.cognitive_level}: {profile.cognitive_badge}
        </h3>
        <p className="text-gray-300 text-sm mb-4">{currentLevel.description}</p>

        {canLevelUp && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-3 mb-4 animate-pulse">
            <p className="text-green-400 font-bold text-sm">🎉 Ready to level up!</p>
            <p className="text-green-300 text-xs">Play any game to advance to {nextLevel?.name}</p>
          </div>
        )}
      </div>

      {!isMaxLevel && nextLevel && (
        <div className="space-y-3">
          <h4 className="text-white font-bold text-center mb-4">
            Next: {nextLevel.name} {nextLevel.icon}
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Memory</span>
                <span className={gameStats?.memory_strength >= nextLevel.min_memory_strength ? 'text-green-400' : 'text-gray-400'}>
                  {gameStats?.memory_strength || 0}/{nextLevel.min_memory_strength}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    gameStats?.memory_strength >= nextLevel.min_memory_strength ? 'bg-green-400' : 'bg-neon-purple'
                  }`}
                  style={{ width: `${Math.min(100, ((gameStats?.memory_strength || 0) / nextLevel.min_memory_strength) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Focus</span>
                <span className={gameStats?.focus_duration >= nextLevel.min_focus_duration ? 'text-green-400' : 'text-gray-400'}>
                  {gameStats?.focus_duration || 0}/{nextLevel.min_focus_duration}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    gameStats?.focus_duration >= nextLevel.min_focus_duration ? 'bg-green-400' : 'bg-neon-blue'
                  }`}
                  style={{ width: `${Math.min(100, ((gameStats?.focus_duration || 0) / nextLevel.min_focus_duration) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Resistance</span>
                <span className={gameStats?.distraction_resistance >= nextLevel.min_distraction_resistance ? 'text-green-400' : 'text-gray-400'}>
                  {gameStats?.distraction_resistance || 0}/{nextLevel.min_distraction_resistance}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    gameStats?.distraction_resistance >= nextLevel.min_distraction_resistance ? 'bg-green-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min(100, ((gameStats?.distraction_resistance || 0) / nextLevel.min_distraction_resistance) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-300">Switching</span>
                <span className={gameStats?.context_switching_speed >= nextLevel.min_context_switching_speed ? 'text-green-400' : 'text-gray-400'}>
                  {gameStats?.context_switching_speed || 0}/{nextLevel.min_context_switching_speed}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    gameStats?.context_switching_speed >= nextLevel.min_context_switching_speed ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${Math.min(100, ((gameStats?.context_switching_speed || 0) / nextLevel.min_context_switching_speed) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div className="text-center bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4">
          <p className="text-yellow-400 font-bold">🏆 Maximum Level Achieved!</p>
          <p className="text-yellow-300 text-sm">You are a Consciousness Titan!</p>
        </div>
      )}
    </div>
  )
}