interface GameSession {
  game_type: string
  score: number
  success_rate: number
  difficulty_level: number
  duration: number
}

interface GameBreakdownProps {
  sessions: GameSession[]
}

export function GameBreakdown({ sessions }: GameBreakdownProps) {
  const gameTypes = [
    { id: 'memory-sequence', name: 'Memory Sequence', icon: '🧠' },
    { id: 'distraction-focus', name: 'Distraction Focus', icon: '🎯' },
    { id: 'context-switch', name: 'Context Switch', icon: '🔄' },
    { id: 'spatial-navigation', name: 'Spatial Navigation', icon: '🗺️' },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: '🔍' },
    { id: 'dual-n-back', name: 'Dual N-Back', icon: '⚡' }
  ]

  const getGameStats = (gameType: string) => {
    const gameSessions = sessions.filter(s => s.game_type === gameType)
    if (gameSessions.length === 0) return null

    const totalScore = gameSessions.reduce((sum, s) => sum + s.score, 0)
    const avgScore = Math.round(totalScore / gameSessions.length)
    const avgAccuracy = Math.round(gameSessions.reduce((sum, s) => sum + s.success_rate * 100, 0) / gameSessions.length)
    const bestScore = Math.max(...gameSessions.map(s => s.score))
    const avgDifficulty = Math.round(gameSessions.reduce((sum, s) => sum + s.difficulty_level, 0) / gameSessions.length)
    const totalTime = Math.round(gameSessions.reduce((sum, s) => sum + s.duration, 0) / 60) // minutes

    return {
      played: gameSessions.length,
      avgScore,
      bestScore,
      avgAccuracy,
      avgDifficulty,
      totalTime
    }
  }

  const totalSessions = sessions.length
  const totalScore = sessions.reduce((sum, s) => sum + s.score, 0)

  return (
    <div className="card animate-float">
      <h3 className="text-2xl font-black text-white mb-6 neon-text">Game Performance Breakdown</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center">
          <div className="text-3xl font-black text-neon-purple animate-glow">{totalSessions}</div>
          <div className="text-gray-300 text-sm">Total Games</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-neon-blue animate-glow">{totalScore.toLocaleString()}</div>
          <div className="text-gray-300 text-sm">Total Score</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-green-400 animate-glow">
            {totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.success_rate * 100, 0) / totalSessions) : 0}%
          </div>
          <div className="text-gray-300 text-sm">Overall Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-yellow-400 animate-glow">
            {Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 3600)}h
          </div>
          <div className="text-gray-300 text-sm">Time Played</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gameTypes.map((game, index) => {
          const stats = getGameStats(game.id)
          
          return (
            <div 
              key={game.id} 
              className="bg-black/30 rounded-xl p-4 animate-slide-up hover:bg-black/40 transition-all duration-300"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{game.icon}</span>
                <div>
                  <h4 className="font-bold text-white">{game.name}</h4>
                  <p className="text-gray-400 text-sm">{stats?.played || 0} games played</p>
                </div>
              </div>
              
              {stats ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Best Score:</span>
                    <span className="text-neon-blue font-bold">{stats.bestScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Avg Score:</span>
                    <span className="text-white font-bold">{stats.avgScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Accuracy:</span>
                    <span className="text-green-400 font-bold">{stats.avgAccuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Avg Level:</span>
                    <span className="text-purple-400 font-bold">{stats.avgDifficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Time:</span>
                    <span className="text-yellow-400 font-bold">{stats.totalTime}m</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <div className="text-4xl mb-2">🎮</div>
                  <p className="text-sm">Not played yet</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}