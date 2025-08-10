import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

export function DistractionFocusGame() {
  const [targetNumber, setTargetNumber] = useState<number>(0)
  const [currentNumber, setCurrentNumber] = useState<number>(0)
  const [distractions, setDistractions] = useState<string[]>([])
  const [gamePhase, setGamePhase] = useState<'ready' | 'playing' | 'result'>('ready')
  const [timeLeft, setTimeLeft] = useState(30)
  const [correctClicks, setCorrectClicks] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [timeFrozen, setTimeFrozen] = useState(false)
  const [hasShield, setHasShield] = useState(false)
  const [lightningBoost, setLightningBoost] = useState(false)
  
  const { score, level, updateScore, incrementLevel, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())
  const intervalRef = useRef<NodeJS.Timeout>()

  const DISTRACTION_WORDS = ['CLICK', 'PRESS', 'TAP', 'HIT', 'PUSH', 'SELECT']

  const startGame = () => {
    const target = Math.floor(Math.random() * 9) + 1
    setTargetNumber(target)
    setCurrentNumber(Math.floor(Math.random() * 9) + 1)
    setGamePhase('playing')
    setTimeLeft(30)
    setCorrectClicks(0)
    setTotalClicks(0)
    generateDistractions()
    
    const baseSpeed = 1000
    const speedIncrease = Math.min((level - 1) * 100, 500)
    const gameSpeed = Math.max(baseSpeed - speedIncrease, 500)
    
    intervalRef.current = setInterval(() => {
      if (timeFrozen) return
      
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGameSession()
          return 0
        }
        return prev - 1
      })
      
      setCurrentNumber(Math.floor(Math.random() * 9) + 1)
      generateDistractions()
    }, lightningBoost ? gameSpeed * 0.75 : gameSpeed)
  }

  const generateDistractions = () => {
    const baseDistractions = 2
    const numDistractions = Math.min(baseDistractions + Math.floor(level / 2), 8)
    const newDistractions = []
    for (let i = 0; i < numDistractions; i++) {
      newDistractions.push(DISTRACTION_WORDS[Math.floor(Math.random() * DISTRACTION_WORDS.length)])
    }
    setDistractions(newDistractions)
  }

  const handleNumberClick = () => {
    if (gamePhase !== 'playing') return
    
    setTotalClicks(prev => prev + 1)
    
    if (currentNumber === targetNumber) {
      setCorrectClicks(prev => prev + 1)
      const points = 10 + level * 5
      updateScore(points)
      updateProfileScore.mutate(points)
      
      // Level up based on accuracy and score
      if (correctClicks > 0 && correctClicks % (10 - Math.floor(level / 3)) === 0) {
        incrementLevel()
      }
    } else if (hasShield) {
      setHasShield(false)
      consumePowerup('Shield')
      return
    }
  }

  const endGameSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    const accuracy = totalClicks > 0 ? correctClicks / totalClicks : 0
    setGamePhase('result')
    
    if (user) {
      createGameSession.mutate({
        user_id: user.id,
        game_type: 'distraction-focus',
        difficulty_level: level,
        score,
        duration: Math.floor((Date.now() - startTime) / 1000),
        success_rate: accuracy,
        performance_data: { correctClicks, totalClicks }
      })
    }
    
    setTimeout(() => endGame(), 3000)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handlePowerupUsed = (powerupName: string) => {
    switch (powerupName) {
      case 'Time Freeze':
        setTimeFrozen(true)
        setTimeout(() => setTimeFrozen(false), 5000)
        break
      case 'Shield':
        setHasShield(true)
        break
      case 'Lightning Boost':
        setLightningBoost(true)
        setTimeout(() => setLightningBoost(false), 10000)
        break
    }
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Distraction Focus</h1>
          <div className="flex justify-center space-x-8 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
            {gamePhase === 'playing' && <span className="text-red-400 animate-bounce">Time: {timeLeft}s</span>}
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Distractions: {distractions.length} | Speed: {level > 6 ? 'Extreme' : level > 3 ? 'Fast' : 'Normal'}
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((correctClicks % 10) / 10) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">Progress to Level {level + 1}</p>
          </div>
        </div>

        <div className="card text-center mb-12 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">Click only when the number matches the target</p>
              <button onClick={startGame} className="game-button">
                Start Game
              </button>
            </div>
          )}

          {gamePhase === 'playing' && (
            <div>
              <p className="text-2xl mb-6 text-white">Target Number: <span className="font-black text-4xl text-neon-purple animate-glow">{targetNumber}</span></p>
              <p className="text-lg text-gray-300 mb-4">Correct: <span className="text-green-400 font-bold">{correctClicks}</span> / Total: <span className="text-blue-400 font-bold">{totalClicks}</span></p>
            </div>
          )}

          {gamePhase === 'result' && (
            <div>
              <p className="text-2xl text-green-400 mb-4 font-bold animate-bounce">Game Complete!</p>
              <p className="text-xl text-white">Accuracy: <span className="text-neon-blue font-bold">{totalClicks > 0 ? Math.round((correctClicks / totalClicks) * 100) : 0}%</span></p>
            </div>
          )}
        </div>

        {gamePhase === 'playing' && (
          <div className="space-y-12">
            <div className="text-center">
              <button
                onClick={handleNumberClick}
                className="w-48 h-48 bg-gradient-to-br from-neon-purple via-blue-500 to-neon-blue hover:from-neon-blue hover:via-purple-500 hover:to-neon-purple text-white text-9xl font-black rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 animate-glow relative overflow-hidden shadow-2xl"
                style={{
                  boxShadow: '0 0 60px rgba(139, 92, 246, 0.9), 0 0 120px rgba(6, 182, 212, 0.7), inset 0 0 30px rgba(255,255,255,0.2)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent rounded-b-full" />
                <span className="relative z-10 drop-shadow-2xl">{currentNumber}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {distractions.map((word, index) => (
                <div
                  key={`${word}-${index}`}
                  className="bg-gradient-to-br from-red-500/40 via-red-600/30 to-red-800/40 border-2 border-red-400/60 text-red-200 p-6 rounded-3xl text-center font-black text-xl animate-pulse hover:animate-wiggle transition-all duration-300 relative overflow-hidden shadow-xl"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    boxShadow: '0 0 25px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent rounded-b-3xl" />
                  <span className="relative z-10 drop-shadow-lg">{word}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <button onClick={endGame} className="btn-secondary hover:animate-wiggle">
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="distraction-focus" onPowerupUsed={handlePowerupUsed} />
        
        {(timeFrozen || hasShield || lightningBoost) && (
          <div className="fixed top-20 right-4 space-y-2 z-40">
            {timeFrozen && (
              <div className="bg-blue-500/80 px-4 py-2 rounded-xl text-white font-bold animate-pulse">
                ⏸️ Time Frozen
              </div>
            )}
            {hasShield && (
              <div className="bg-green-500/80 px-4 py-2 rounded-xl text-white font-bold animate-glow">
                🛡️ Shield Active
              </div>
            )}
            {lightningBoost && (
              <div className="bg-purple-500/80 px-4 py-2 rounded-xl text-white font-bold animate-bounce">
                ⚡ Lightning Boost
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}