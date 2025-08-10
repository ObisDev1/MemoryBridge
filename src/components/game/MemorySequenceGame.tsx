import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { useGemRewards } from '../../hooks/useGemRewards'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

const COLORS = [
  { name: 'crimson', bg: 'linear-gradient(145deg, #dc2626, #991b1b)', shadow: '#dc2626' },
  { name: 'sapphire', bg: 'linear-gradient(145deg, #2563eb, #1d4ed8)', shadow: '#2563eb' },
  { name: 'emerald', bg: 'linear-gradient(145deg, #059669, #047857)', shadow: '#059669' },
  { name: 'amber', bg: 'linear-gradient(145deg, #d97706, #b45309)', shadow: '#d97706' },
  { name: 'violet', bg: 'linear-gradient(145deg, #7c3aed, #5b21b6)', shadow: '#7c3aed' },
  { name: 'rose', bg: 'linear-gradient(145deg, #e11d48, #be185d)', shadow: '#e11d48' }
]

export function MemorySequenceGame() {
  const [sequence, setSequence] = useState<string[]>([])
  const [userSequence, setUserSequence] = useState<string[]>([])
  const [showingSequence, setShowingSequence] = useState(false)
  const [gamePhase, setGamePhase] = useState<'ready' | 'showing' | 'input' | 'result'>('ready')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timeFrozen, setTimeFrozen] = useState(false)
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreActive, setDoubleScoreActive] = useState(false)
  
  const { score, level, updateScore, incrementLevel, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { awardGems, calculateGameReward } = useGemRewards()
  const { hasPowerup, consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())

  const generateSequence = () => {
    const baseLength = 3
    const sequenceLength = Math.min(baseLength + Math.floor(level / 2), 8)
    const colorCount = Math.min(4 + Math.floor(level / 3), 6)
    
    const newSequence = []
    for (let i = 0; i < sequenceLength; i++) {
      newSequence.push(COLORS[Math.floor(Math.random() * colorCount)].name)
    }
    setSequence(newSequence)
    setUserSequence([])
    setCurrentIndex(0)
  }

  const startRound = () => {
    generateSequence()
    setGamePhase('showing')
    setShowingSequence(true)
  }

  useEffect(() => {
    if (gamePhase === 'showing' && sequence.length > 0) {
      const baseSpeed = 800
      const speedReduction = Math.min((level - 1) * 50, 400)
      const showSpeed = Math.max(baseSpeed - speedReduction, 400)
      
      const timer = setTimeout(() => {
        setShowingSequence(false)
        setGamePhase('input')
      }, sequence.length * showSpeed + 1000)
      return () => clearTimeout(timer)
    }
  }, [gamePhase, sequence, level])

  const handleColorClick = (colorName: string) => {
    if (gamePhase !== 'input') return
    
    const newUserSequence = [...userSequence, colorName]
    setUserSequence(newUserSequence)

    if (colorName === sequence[userSequence.length]) {
      if (newUserSequence.length === sequence.length) {
        // Correct sequence completed
        let points = sequence.length * 10 + level * 25
        
        // Apply double score powerup
        if (doubleScoreActive) {
          points *= 2
          setDoubleScoreActive(false)
          consumePowerup('Double Score')
        }
        
        updateScore(points)
        updateProfileScore.mutate(points)
        incrementLevel()
        setGamePhase('result')
        setTimeout(() => setGamePhase('ready'), 1500)
      }
    } else {
      // Wrong color - check for shield
      if (hasShield) {
        setHasShield(false)
        consumePowerup('Shield')
        // Shield protects from this mistake
        return
      }
      
      setGamePhase('result')
      setTimeout(() => {
        if (user) {
          const successRate = userSequence.length / sequence.length
          createGameSession.mutate({
            user_id: user.id,
            game_type: 'memory-sequence',
            difficulty_level: level,
            score,
            duration: Math.floor((Date.now() - startTime) / 1000),
            success_rate: successRate
          })
          
          // Award gems
          const gemReward = calculateGameReward('memory-sequence', score, successRate)
          awardGems.mutate({ amount: gemReward, reason: 'Game completion' })
        }
        endGame()
      }, 2000)
    }
  }

  const isColorActive = (colorName: string, index: number) => {
    if (showingSequence) {
      return sequence[currentIndex] === colorName
    }
    return false
  }

  const handlePowerupUsed = (powerupName: string) => {
    switch (powerupName) {
      case 'Time Freeze':
        setTimeFrozen(true)
        setTimeout(() => setTimeFrozen(false), 5000)
        break
      case 'Double Score':
        setDoubleScoreActive(true)
        break
      case 'Shield':
        setHasShield(true)
        break
    }
  }

  useEffect(() => {
    if (showingSequence && sequence.length > 0) {
      const interval = setInterval(() => {
        if (timeFrozen) return // Don't advance if time is frozen
        
        setCurrentIndex(prev => {
          if (prev >= sequence.length - 1) {
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, Math.max(800 - (level - 1) * 50, 400))
      return () => clearInterval(interval)
    }
  }, [showingSequence, sequence, timeFrozen])

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Memory Sequence</h1>
          <div className="flex justify-center space-x-12 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Sequence: {sequence.length} colors | Speed: {level > 8 ? 'Lightning' : level > 5 ? 'Fast' : level > 2 ? 'Medium' : 'Slow'}
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((level - 1) % 5) * 20, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">Progress to Level {level + 1}</p>
          </div>
        </div>

        <div className="card text-center mb-12 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">Remember the sequence of colors</p>
              <button onClick={startRound} className="game-button">
                Start Round
              </button>
            </div>
          )}

          {gamePhase === 'showing' && (
            <p className="text-2xl text-neon-purple font-bold animate-pulse">Watch the sequence...</p>
          )}

          {gamePhase === 'input' && (
            <p className="text-2xl text-neon-blue font-bold animate-bounce">Repeat the sequence</p>
          )}

          {gamePhase === 'result' && (
            <p className="text-2xl font-bold animate-wiggle">
              <span className={userSequence.length === sequence.length ? 'text-green-400' : 'text-red-400'}>
                {userSequence.length === sequence.length ? 'Correct!' : 'Game Over!'}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mb-12">
          {COLORS.map((color, index) => (
            <button
              key={color.name}
              onClick={() => handleColorClick(color.name)}
              disabled={gamePhase !== 'input'}
              className={`
                w-28 h-28 rounded-3xl border-4 transition-all duration-300 transform relative overflow-hidden
                ${isColorActive(color.name, index) ? 'scale-125 animate-glow border-white' : 'border-gray-700/50'}
                ${gamePhase === 'input' ? 'hover:scale-110 cursor-pointer hover:border-white active:scale-95' : 'cursor-not-allowed'}
                ${gamePhase === 'input' ? 'animate-float' : ''}
                shadow-2xl
              `}
              style={{
                background: color.bg,
                boxShadow: isColorActive(color.name, index) 
                  ? `0 0 40px ${color.shadow}, 0 0 80px ${color.shadow}, inset 0 0 20px rgba(255,255,255,0.2)` 
                  : `0 10px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.1)`,
                opacity: gamePhase === 'input' ? 1 : 0.6,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent rounded-b-3xl" />
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={endGame}
            className="btn-secondary hover:animate-wiggle"
          >
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="memory-sequence" onPowerupUsed={handlePowerupUsed} />
        
        {/* Active powerup indicators */}
        {(timeFrozen || hasShield || doubleScoreActive) && (
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
            {doubleScoreActive && (
              <div className="bg-yellow-500/80 px-4 py-2 rounded-xl text-white font-bold animate-bounce">
                2️⃣ Double Score
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}