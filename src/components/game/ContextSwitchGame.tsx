import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

type Task = 'color' | 'shape' | 'number'

interface GameItem {
  color: string
  shape: string
  number: number
}

export function ContextSwitchGame() {
  const [currentTask, setCurrentTask] = useState<Task>('color')
  const [targetValue, setTargetValue] = useState<string>('')
  const [gameItem, setGameItem] = useState<GameItem>({ color: 'red', shape: 'circle', number: 1 })
  const [gamePhase, setGamePhase] = useState<'ready' | 'playing' | 'result'>('ready')
  const [round, setRound] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalRounds, setTotalRounds] = useState(20)
  const [switchFrequency, setSwitchFrequency] = useState(3)
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreActive, setDoubleScoreActive] = useState(false)
  const [lightningBoost, setLightningBoost] = useState(false)
  
  const { score, level, updateScore, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())

  const COLORS = ['red', 'blue', 'green', 'yellow']
  const SHAPES = ['circle', 'square', 'triangle', 'diamond']
  const NUMBERS = [1, 2, 3, 4]

  const generateNewItem = () => {
    setGameItem({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      number: NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    })
  }

  const generateNewTask = () => {
    const tasks: Task[] = ['color', 'shape', 'number']
    
    // Increase task switching frequency based on level
    const shouldSwitch = round % Math.max(switchFrequency - Math.floor(level / 2), 1) === 0
    
    let newTask = currentTask
    if (shouldSwitch || round === 0) {
      do {
        newTask = tasks[Math.floor(Math.random() * tasks.length)]
      } while (newTask === currentTask && round > 0)
    }
    
    setCurrentTask(newTask)
    
    switch (newTask) {
      case 'color':
        setTargetValue(COLORS[Math.floor(Math.random() * COLORS.length)])
        break
      case 'shape':
        setTargetValue(SHAPES[Math.floor(Math.random() * SHAPES.length)])
        break
      case 'number':
        setTargetValue(NUMBERS[Math.floor(Math.random() * NUMBERS.length)].toString())
        break
    }
  }

  const startGame = () => {
    setGamePhase('playing')
    setRound(0)
    setCorrectAnswers(0)
    
    // Adjust difficulty based on level
    const baseTotalRounds = 20
    const levelBonus = Math.floor(level / 2) * 5
    setTotalRounds(Math.min(baseTotalRounds + levelBonus, 40))
    
    const baseSwitchFreq = 3
    setSwitchFrequency(Math.max(baseSwitchFreq - Math.floor(level / 3), 1))
    
    generateNewTask()
    generateNewItem()
  }

  const handleAnswer = (isMatch: boolean) => {
    if (gamePhase !== 'playing') return

    const actualMatch = 
      (currentTask === 'color' && gameItem.color === targetValue) ||
      (currentTask === 'shape' && gameItem.shape === targetValue) ||
      (currentTask === 'number' && gameItem.number.toString() === targetValue)

    if (isMatch === actualMatch) {
      setCorrectAnswers(prev => prev + 1)
      let points = 10 + level * 3
      
      // Bonus for task switches
      if (round > 0 && currentTask !== targetValue) {
        points += 5
      }
      
      if (doubleScoreActive) {
        points *= 2
        setDoubleScoreActive(false)
        consumePowerup('Double Score')
      }
      
      updateScore(points)
      updateProfileScore.mutate(points)
    } else if (hasShield) {
      setHasShield(false)
      consumePowerup('Shield')
      // Shield protects from wrong answer
      setCorrectAnswers(prev => prev + 1)
      updateScore(10)
      updateProfileScore.mutate(10)
    }

    const nextRound = round + 1
    setRound(nextRound)

    if (nextRound >= totalRounds) {
      endGameSession()
    } else {
      generateNewTask()
      generateNewItem()
    }
  }

  const endGameSession = () => {
    const accuracy = correctAnswers / totalRounds
    setGamePhase('result')
    
    if (user) {
      createGameSession.mutate({
        user_id: user.id,
        game_type: 'context-switch',
        difficulty_level: level,
        score,
        duration: Math.floor((Date.now() - startTime) / 1000),
        success_rate: accuracy,
        performance_data: { correctAnswers, totalRounds }
      })
    }
    
    setTimeout(() => endGame(), 3000)
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
        setTimeout(() => setLightningBoost(false), 10000)
        break
    }
  }

  const getShapeStyle = (shape: string) => {
    const baseStyle = "w-28 h-28 mx-auto mb-6 relative overflow-hidden shadow-2xl transition-all duration-300"
    switch (shape) {
      case 'circle':
        return `${baseStyle} rounded-full`
      case 'square':
        return `${baseStyle} rounded-2xl`
      case 'triangle':
        return `${baseStyle} rounded-2xl transform rotate-45`
      case 'diamond':
        return `${baseStyle} rounded-2xl transform rotate-45`
      default:
        return baseStyle
    }
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Context Switch</h1>
          <div className="flex justify-center space-x-8 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
            {gamePhase === 'playing' && <span className="text-yellow-400 animate-bounce">Round: {round + 1}/{totalRounds}</span>}
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Switch Rate: {switchFrequency > 2 ? 'Slow' : switchFrequency > 1 ? 'Fast' : 'Extreme'} | Rounds: {totalRounds}
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${gamePhase === 'playing' ? (round / totalRounds) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {gamePhase === 'playing' ? `${round}/${totalRounds} Complete` : 'Ready to Start'}
            </p>
          </div>
        </div>

        <div className="card text-center mb-12 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">Switch between tasks: match color, shape, or number</p>
              <button onClick={startGame} className="game-button">
                Start Game
              </button>
            </div>
          )}

          {gamePhase === 'playing' && (
            <div>
              <p className="text-2xl mb-6 text-white">
                Current Task: <span className="font-black text-neon-purple capitalize animate-glow">{currentTask}</span>
              </p>
              <p className="text-2xl mb-8 text-white">
                Target: <span className="font-black text-neon-blue animate-pulse">{targetValue}</span>
              </p>
              <p className="text-lg text-gray-300">Correct: <span className="text-green-400 font-bold">{correctAnswers}</span>/<span className="text-blue-400 font-bold">{round}</span></p>
            </div>
          )}

          {gamePhase === 'result' && (
            <div>
              <p className="text-2xl text-green-400 mb-4 font-bold animate-bounce">Game Complete!</p>
              <p className="text-xl text-white">Accuracy: <span className="text-neon-blue font-bold">{Math.round((correctAnswers / totalRounds) * 100)}%</span></p>
            </div>
          )}
        </div>

        {gamePhase === 'playing' && (
          <div className="space-y-12">
            <div className="card text-center animate-float">
              <div
                className={`${getShapeStyle(gameItem.shape)} animate-spin-slow`}
                style={{ 
                  background: `linear-gradient(145deg, ${gameItem.color}, ${gameItem.color}dd)`,
                  boxShadow: `0 0 40px ${gameItem.color}, 0 0 80px ${gameItem.color}88, inset 0 0 20px rgba(255,255,255,0.2)`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" style={{borderRadius: 'inherit'}} />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/30 to-transparent" style={{borderRadius: 'inherit'}} />
              </div>
              <p className="text-7xl font-black text-white animate-glow drop-shadow-2xl">{gameItem.number}</p>
            </div>

            <div className="flex justify-center space-x-8">
              <button
                onClick={() => handleAnswer(true)}
                className="game-button px-12 hover:animate-bounce active:scale-95 shadow-2xl"
              >
                Match
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="btn-secondary px-12 hover:animate-wiggle active:scale-95 shadow-2xl"
              >
                No Match
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <button onClick={endGame} className="btn-secondary hover:animate-wiggle">
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="context-switch" onPowerupUsed={handlePowerupUsed} />
        
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