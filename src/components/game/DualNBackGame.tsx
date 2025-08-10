import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

interface Trial {
  position: number
  sound: string
}

export function DualNBackGame() {
  const [nLevel, setNLevel] = useState(2)
  const [trials, setTrials] = useState<Trial[]>([])
  const [currentTrial, setCurrentTrial] = useState(0)
  const [gamePhase, setGamePhase] = useState<'ready' | 'playing' | 'result'>('ready')
  const [positionMatches, setPositionMatches] = useState<boolean[]>([])
  const [soundMatches, setSoundMatches] = useState<boolean[]>([])
  const [userPositionResponses, setUserPositionResponses] = useState<boolean[]>([])
  const [userSoundResponses, setUserSoundResponses] = useState<boolean[]>([])
  const [totalTrials] = useState(20)
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreActive, setDoubleScoreActive] = useState(false)
  const [timeFrozen, setTimeFrozen] = useState(false)
  const [trialTimer, setTrialTimer] = useState(3)
  
  const { score, level, updateScore, incrementLevel, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())

  const SOUNDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const POSITIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] // 3x3 grid

  const generateTrials = () => {
    const newTrials: Trial[] = []
    const newPositionMatches: boolean[] = []
    const newSoundMatches: boolean[] = []
    
    for (let i = 0; i < totalTrials; i++) {
      const trial: Trial = {
        position: Math.floor(Math.random() * 9),
        sound: SOUNDS[Math.floor(Math.random() * SOUNDS.length)]
      }
      
      newTrials.push(trial)
      
      // Determine if this trial matches n-back
      if (i >= nLevel) {
        const positionMatch = trial.position === newTrials[i - nLevel].position
        const soundMatch = trial.sound === newTrials[i - nLevel].sound
        
        newPositionMatches.push(positionMatch)
        newSoundMatches.push(soundMatch)
      } else {
        newPositionMatches.push(false)
        newSoundMatches.push(false)
      }
    }
    
    setTrials(newTrials)
    setPositionMatches(newPositionMatches)
    setSoundMatches(newSoundMatches)
  }

  const startGame = () => {
    // Adjust n-level based on game level
    const adjustedN = Math.min(2 + Math.floor(level / 4), 5)
    setNLevel(adjustedN)
    
    generateTrials()
    setCurrentTrial(0)
    setUserPositionResponses(new Array(totalTrials).fill(false))
    setUserSoundResponses(new Array(totalTrials).fill(false))
    setGamePhase('playing')
    setTrialTimer(3)
  }

  useEffect(() => {
    if (gamePhase === 'playing' && currentTrial < totalTrials) {
      const timer = setInterval(() => {
        if (timeFrozen) return
        
        setTrialTimer(prev => {
          if (prev <= 1) {
            // Move to next trial
            const nextTrial = currentTrial + 1
            setCurrentTrial(nextTrial)
            
            if (nextTrial >= totalTrials) {
              endGameSession()
              return 0
            }
            
            return 3 // Reset timer for next trial
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [gamePhase, currentTrial, totalTrials, timeFrozen])

  const handlePositionResponse = () => {
    if (gamePhase !== 'playing' || currentTrial >= totalTrials) return
    
    const newResponses = [...userPositionResponses]
    newResponses[currentTrial] = true
    setUserPositionResponses(newResponses)
  }

  const handleSoundResponse = () => {
    if (gamePhase !== 'playing' || currentTrial >= totalTrials) return
    
    const newResponses = [...userSoundResponses]
    newResponses[currentTrial] = true
    setUserSoundResponses(newResponses)
  }

  const endGameSession = () => {
    setGamePhase('result')
    
    // Calculate accuracy
    let positionCorrect = 0
    let soundCorrect = 0
    let totalPositionTargets = 0
    let totalSoundTargets = 0
    
    for (let i = 0; i < totalTrials; i++) {
      if (positionMatches[i]) {
        totalPositionTargets++
        if (userPositionResponses[i]) positionCorrect++
      } else if (userPositionResponses[i]) {
        // False positive
        positionCorrect--
      }
      
      if (soundMatches[i]) {
        totalSoundTargets++
        if (userSoundResponses[i]) soundCorrect++
      } else if (userSoundResponses[i]) {
        // False positive
        soundCorrect--
      }
    }
    
    const positionAccuracy = totalPositionTargets > 0 ? Math.max(positionCorrect / totalPositionTargets, 0) : 0
    const soundAccuracy = totalSoundTargets > 0 ? Math.max(soundCorrect / totalSoundTargets, 0) : 0
    const overallAccuracy = (positionAccuracy + soundAccuracy) / 2
    
    let points = Math.floor(overallAccuracy * 100) + nLevel * 20
    
    if (doubleScoreActive) {
      points *= 2
      setDoubleScoreActive(false)
      consumePowerup('Double Score')
    }
    
    updateScore(points)
    updateProfileScore.mutate(points)
    
    // Level up based on performance
    if (overallAccuracy > 0.8) {
      incrementLevel()
    }
    
    if (user) {
      createGameSession.mutate({
        user_id: user.id,
        game_type: 'dual-n-back',
        difficulty_level: level,
        score,
        duration: Math.floor((Date.now() - startTime) / 1000),
        success_rate: overallAccuracy,
        performance_data: { 
          nLevel, 
          positionAccuracy, 
          soundAccuracy,
          totalPositionTargets,
          totalSoundTargets
        }
      })
    }
    
    setTimeout(() => endGame(), 4000)
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

  const getCurrentTrial = () => trials[currentTrial]
  const getPositionStyle = (position: number) => {
    const isActive = getCurrentTrial()?.position === position
    return `w-20 h-20 border-2 transition-all duration-300 ${
      isActive 
        ? 'bg-neon-blue border-neon-purple animate-glow scale-110' 
        : 'bg-gray-700/30 border-gray-600'
    }`
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Dual N-Back</h1>
          <div className="flex justify-center space-x-8 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
            <span className="text-yellow-400 animate-bounce">N-Level: {nLevel}</span>
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Trial: {currentTrial + 1}/{totalTrials} | Time: {trialTimer}s
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentTrial / totalTrials) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">Progress</p>
          </div>
        </div>

        <div className="card text-center mb-8 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">
                Remember positions and sounds from {nLevel} trials back
              </p>
              <p className="text-lg mb-6 text-gray-400">
                Press buttons when current position/sound matches {nLevel} trials ago
              </p>
              <button onClick={startGame} className="game-button">
                Start {nLevel}-Back Training
              </button>
            </div>
          )}

          {gamePhase === 'playing' && getCurrentTrial() && (
            <div>
              <p className="text-2xl text-neon-purple font-bold mb-4">
                Sound: <span className="text-4xl text-neon-blue animate-pulse">{getCurrentTrial().sound}</span>
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Does this match {nLevel} trials back?
              </p>
            </div>
          )}

          {gamePhase === 'result' && (
            <div>
              <p className="text-2xl text-green-400 mb-4 font-bold animate-bounce">Training Complete!</p>
              <p className="text-xl text-white mb-2">N-Level: {nLevel}</p>
              <p className="text-lg text-gray-300">
                Working memory capacity improved!
              </p>
            </div>
          )}
        </div>

        {gamePhase === 'playing' && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-2 p-6 bg-black/30 rounded-3xl border border-purple-500/30">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className={getPositionStyle(i)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-8">
              <button
                onClick={handlePositionResponse}
                className={`game-button px-8 py-4 ${
                  userPositionResponses[currentTrial] ? 'bg-green-500/50' : ''
                }`}
              >
                📍 Position Match
              </button>
              <button
                onClick={handleSoundResponse}
                className={`game-button px-8 py-4 ${
                  userSoundResponses[currentTrial] ? 'bg-green-500/50' : ''
                }`}
              >
                🔊 Sound Match
              </button>
            </div>

            <div className="text-center text-sm text-gray-400">
              <p>Remember: Compare with {nLevel} trials back</p>
              <p>Green buttons = You've responded for this trial</p>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button onClick={endGame} className="btn-secondary hover:animate-wiggle">
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="dual-n-back" onPowerupUsed={handlePowerupUsed} />
        
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