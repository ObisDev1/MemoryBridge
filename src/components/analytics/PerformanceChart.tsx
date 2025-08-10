interface GameSession {
  id: string
  game_type: string
  score: number
  success_rate: number
  created_at: string
  difficulty_level: number
}

interface PerformanceChartProps {
  sessions: GameSession[]
}

export function PerformanceChart({ sessions }: PerformanceChartProps) {
  const last30Days = sessions.slice(0, 30).reverse()
  
  const maxScore = Math.max(...last30Days.map(s => s.score), 100)
  const avgScore = last30Days.length > 0 
    ? Math.round(last30Days.reduce((sum, s) => sum + s.score, 0) / last30Days.length)
    : 0

  const avgAccuracy = last30Days.length > 0
    ? Math.round(last30Days.reduce((sum, s) => sum + (s.success_rate * 100), 0) / last30Days.length)
    : 0

  return (
    <div className="card animate-float">
      <h3 className="text-2xl font-black text-white mb-6 neon-text">Performance Trends</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-black text-neon-blue animate-glow">{avgScore}</div>
          <div className="text-gray-300 text-sm">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-green-400 animate-glow">{avgAccuracy}%</div>
          <div className="text-gray-300 text-sm">Avg Accuracy</div>
        </div>
      </div>

      <div className="relative h-48 bg-black/30 rounded-xl p-4">
        <div className="flex items-end justify-between h-full">
          {last30Days.map((session, index) => {
            const height = (session.score / maxScore) * 100
            const color = session.success_rate > 0.8 ? 'bg-green-500' : 
                         session.success_rate > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            
            return (
              <div
                key={session.id}
                className={`w-2 ${color} rounded-t transition-all duration-500 hover:scale-110`}
                style={{ 
                  height: `${height}%`,
                  animationDelay: `${index * 0.1}s`
                }}
                title={`Score: ${session.score} | Accuracy: ${Math.round(session.success_rate * 100)}%`}
              />
            )
          })}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 text-center text-gray-400 text-xs mt-2">
          Last {last30Days.length} Games
        </div>
      </div>
    </div>
  )
}