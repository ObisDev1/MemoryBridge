interface GameStats {
  memory_strength: number
  focus_duration: number
  distraction_resistance: number
  context_switching_speed: number
}

interface GameSession {
  game_type: string
  success_rate: number
  difficulty_level: number
}

interface CognitiveInsightsProps {
  stats: GameStats | null
  sessions: GameSession[]
}

export function CognitiveInsights({ stats, sessions }: CognitiveInsightsProps) {
  const getInsights = () => {
    if (!stats || sessions.length === 0) return []

    const insights = []
    const recentSessions = sessions.slice(0, 10)
    
    // Memory strength analysis
    if (stats.memory_strength > 80) {
      insights.push({
        type: 'strength',
        title: 'Excellent Memory',
        description: 'Your memory strength is in the top tier',
        icon: '🧠',
        color: 'text-green-400'
      })
    } else if (stats.memory_strength < 40) {
      insights.push({
        type: 'improvement',
        title: 'Memory Training Needed',
        description: 'Focus on memory sequence games',
        icon: '📈',
        color: 'text-yellow-400'
      })
    }

    // Focus analysis
    const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.success_rate, 0) / recentSessions.length
    if (avgAccuracy > 0.85) {
      insights.push({
        type: 'strength',
        title: 'Sharp Focus',
        description: 'Maintaining high accuracy across games',
        icon: '🎯',
        color: 'text-green-400'
      })
    }

    // Difficulty progression
    const avgDifficulty = recentSessions.reduce((sum, s) => sum + s.difficulty_level, 0) / recentSessions.length
    if (avgDifficulty > 5) {
      insights.push({
        type: 'achievement',
        title: 'High Performer',
        description: 'Consistently playing at advanced levels',
        icon: '⚡',
        color: 'text-purple-400'
      })
    }

    return insights
  }

  const insights = getInsights()
  const cognitiveStats = [
    { name: 'Memory', value: stats?.memory_strength || 0, icon: '🧠' },
    { name: 'Focus', value: stats?.focus_duration || 0, icon: '🎯' },
    { name: 'Resistance', value: stats?.distraction_resistance || 0, icon: '🛡️' },
    { name: 'Switching', value: stats?.context_switching_speed || 0, icon: '🔄' }
  ]

  return (
    <div className="card animate-float">
      <h3 className="text-2xl font-black text-white mb-6 neon-text">Cognitive Profile</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {cognitiveStats.map((stat, index) => (
          <div key={stat.name} className="text-center animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-neon-blue">{stat.value}</div>
            <div className="text-gray-300 text-sm">{stat.name}</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stat.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-bold text-white">AI Insights</h4>
        {insights.length > 0 ? insights.map((insight, index) => (
          <div key={index} className="bg-black/30 rounded-xl p-3 animate-slide-up" style={{animationDelay: `${index * 0.2}s`}}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <div className={`font-bold ${insight.color}`}>{insight.title}</div>
                <div className="text-gray-300 text-sm">{insight.description}</div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-400 py-4">
            Play more games to unlock AI insights
          </div>
        )}
      </div>
    </div>
  )
}