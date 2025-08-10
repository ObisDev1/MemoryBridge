import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

interface Pattern {
  id: string
  shape: string
  color: string
  size: 'small' | 'medium' | 'large'
  rotation: number
}

export function PatternRecognitionGame() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [targetPattern, setTargetPattern] = useState<Pattern | null>(null)
  const [gamePhase, setGamePhase] = useState<'ready' | 'study' | 'find' | 'result'>('ready')
  const [studyTime, setStudyTime] = useState(5)
  const [correctFinds, setCorrectFinds] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [round, setRound] = useState(0)
  const [maxRounds] = useState(10)
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreActive, setDoubleScoreActive] = useState(false)
  const [lightningBoost, setLightningBoost] = useState(false)
  
  const { score, level, updateScore, incrementLevel, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())

  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon']
  const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
  const SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large']

  const generatePatterns = () => {
    const baseCount = 6
    const levelBonus = Math.floor(level / 2) * 2
    const patternCount = Math.min(baseCount + levelBonus, 20)
    
    const newPatterns: Pattern[] = []
    
    for (let i = 0; i < patternCount; i++) {
      newPatterns.push({
        id: `pattern-${i}`,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: SIZES[Math.floor(Math.random() * SIZES.length)],
        rotation: Math.floor(Math.random() * 4) * 90
      })
    }
    
    // Ensure target pattern exists
    const targetIndex = Math.floor(Math.random() * newPatterns.length)
    setTargetPattern(newPatterns[targetIndex])
    
    // Add some similar patterns to increase difficulty
    const similarCount = Math.min(Math.floor(level / 3), 3)
    for (let i = 0; i < similarCount; i++) {
      const similar = { ...newPatterns[targetIndex] }
      
      // Change one attribute randomly
      const changeType = Math.floor(Math.random() * 4)
      switch (changeType) {
        case 0: // Change color slightly
          similar.color = COLORS[Math.floor(Math.random() * COLORS.length)]
          break
        case 1: // Change size
          similar.size = SIZES[Math.floor(Math.random() * SIZES.length)]
          break
        case 2: // Change rotation
          similar.rotation = Math.floor(Math.random() * 4) * 90
          break
        case 3: // Change shape
          similar.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
          break
      }
      
      similar.id = `similar-${i}`
      newPatterns.push(similar)
    }
    
    // Shuffle patterns
    for (let i = newPatterns.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newPatterns[i], newPatterns[j]] = [newPatterns[j], newPatterns[i]]
    }
    
    setPatterns(newPatterns)
  }

  const startRound = () => {
    generatePatterns()
    setGamePhase('study')
    
    // Adjust study time based on level
    const baseTime = 5
    const timeReduction = Math.min(Math.floor(level / 3), 3)
    setStudyTime(Math.max(baseTime - timeReduction, 2))
  }

  useEffect(() => {
    if (gamePhase === 'study' && studyTime > 0) {
      const timer = setTimeout(() => {
        setStudyTime(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (gamePhase === 'study' && studyTime === 0) {
      setGamePhase('find')
    }
  }, [gamePhase, studyTime])

  const handlePatternClick = (pattern: Pattern) => {
    if (gamePhase !== 'find') return
    
    setTotalAttempts(prev => prev + 1)
    
    const isCorrect = pattern.id === targetPattern?.id ||
      (pattern.shape === targetPattern?.shape &&
       pattern.color === targetPattern?.color &&
       pattern.size === targetPattern?.size &&
       pattern.rotation === targetPattern?.rotation)
    
    if (isCorrect) {
      setCorrectFinds(prev => prev + 1)
      let points = 20 + level * 5
      
      // Bonus for speed (if lightning boost active)
      if (lightningBoost) {
        points += 10
      }
      
      if (doubleScoreActive) {
        points *= 2
        setDoubleScoreActive(false)
        consumePowerup('Double Score')
      }
      
      updateScore(points)
      updateProfileScore.mutate(points)
      
      setGamePhase('result')
      setTimeout(() => {
        const nextRound = round + 1
        setRound(nextRound)
        
        if (nextRound >= maxRounds) {
          endGameSession()
        } else {
          if (correctFinds > 0 && correctFinds % 3 === 0) {
            incrementLevel()
          }
          setGamePhase('ready')
        }
      }, 1500)
    } else {
      if (hasShield) {
        setHasShield(false)
        consumePowerup('Shield')
        return // Shield protects from wrong answer
      }
      
      setGamePhase('result')
      setTimeout(() => {
        const nextRound = round + 1
        setRound(nextRound)
        
        if (nextRound >= maxRounds) {
          endGameSession()
        } else {
          setGamePhase('ready')
        }
      }, 1500)
    }
  }

  const endGameSession = () => {
    const accuracy = totalAttempts > 0 ? correctFinds / totalAttempts : 0
    
    if (user) {
      createGameSession.mutate({
        user_id: user.id,
        game_type: 'pattern-recognition',
        difficulty_level: level,
        score,
        duration: Math.floor((Date.now() - startTime) / 1000),
        success_rate: accuracy,
        performance_data: { correctFinds, totalAttempts }
      })
    }
    
    setTimeout(() => endGame(), 2000)
  }

  const handlePowerupUsed = (powerupName: string) => {
    switch (powerupName) {
      case 'Double Score':
        setDoubleScoreActive(true)
        break
      case 'Shield':
        setHasShield(true)
        break
      case 'Lightning Boost':
        setLightningBoost(true)
        setTimeout(() => setLightningBoost(false), 15000)
        break
    }
  }

  const getShapeElement = (pattern: Pattern) => {
    const sizeMap = { small: 'w-8 h-8', medium: 'w-12 h-12', large: 'w-16 h-16' }
    const baseStyle = `${sizeMap[pattern.size]} transition-all duration-300`
    
    const shapeStyle = {
      transform: `rotate(${pattern.rotation}deg)`,
      backgroundColor: pattern.color,
      boxShadow: `0 0 20px ${pattern.color}88`
    }
    
    switch (pattern.shape) {
      case 'circle':
        return <div className={`${baseStyle} rounded-full`} style={shapeStyle} />
      case 'square':
        return <div className={`${baseStyle} rounded-lg`} style={shapeStyle} />
      case 'triangle':
        return <div className={`${baseStyle} rounded-lg`} style={{...shapeStyle, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />
      case 'diamond':
        return <div className={`${baseStyle} rounded-lg rotate-45`} style={shapeStyle} />
      case 'star':
        return <div className={`${baseStyle} rounded-lg`} style={{...shapeStyle, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}} />
      case 'hexagon':
        return <div className={`${baseStyle} rounded-lg`} style={{...shapeStyle, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}} />
      default:
        return <div className={`${baseStyle} rounded-full`} style={shapeStyle} />
    }
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Pattern Recognition</h1>
          <div className="flex justify-center space-x-8 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
            <span className="text-yellow-400 animate-bounce">Round: {round + 1}/{maxRounds}</span>
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Patterns: {patterns.length} | Study Time: {studyTime > 0 ? `${studyTime}s` : 'Complete'}
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(correctFinds / maxRounds) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">Accuracy: {totalAttempts > 0 ? Math.round((correctFinds / totalAttempts) * 100) : 0}%</p>
          </div>
        </div>

        <div className="card text-center mb-8 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">Study the target pattern, then find it among the options</p>
              <button onClick={startRound} className="game-button">
                Start Round {round + 1}
              </button>
            </div>
          )}

          {gamePhase === 'study' && targetPattern && (
            <div>
              <p className="text-2xl text-neon-purple font-bold mb-6">
                Study this pattern: {studyTime}s remaining
              </p>
              <div className="flex justify-center mb-4">
                <div className="p-8 bg-black/50 rounded-3xl border-4 border-neon-purple animate-glow">
                  {getShapeElement(targetPattern)}
                </div>
              </div>
              <p className="text-gray-300">
                Shape: {targetPattern.shape} | Size: {targetPattern.size} | Rotation: {targetPattern.rotation}°
              </p>
            </div>
          )}

          {gamePhase === 'find' && (
            <p className="text-2xl text-neon-blue font-bold animate-bounce">
              Find the matching pattern!
            </p>
          )}

          {gamePhase === 'result' && (
            <p className="text-2xl font-bold animate-wiggle">
              <span className={correctFinds > totalAttempts - correctFinds ? 'text-green-400' : 'text-red-400'}>
                {correctFinds > totalAttempts - correctFinds ? 'Correct Match!' : 'Wrong Pattern!'}
              </span>
            </p>
          )}
        </div>

        {gamePhase === 'find' && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {patterns.map((pattern, index) => (
              <button
                key={pattern.id}
                onClick={() => handlePatternClick(pattern)}
                className="p-4 bg-black/30 hover:bg-black/50 border-2 border-gray-600 hover:border-purple-400 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center animate-float"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {getShapeElement(pattern)}
              </button>
            ))}
          </div>
        )}

        <div className="text-center">
          <button onClick={endGame} className="btn-secondary hover:animate-wiggle">
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="pattern-recognition" onPowerupUsed={handlePowerupUsed} />
        
        {(hasShield || doubleScoreActive || lightningBoost) && (
          <div className="fixed top-20 right-4 space-y-2 z-40">
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