import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { useCreateGameSession } from '../../hooks/useGameSessions'
import { useProfile } from '../../hooks/useProfile'
import { usePowerups } from '../../hooks/usePowerups'
import { PowerupPanel } from './PowerupPanel'

interface Position {
  x: number
  y: number
}

export function SpatialNavigationGame() {
  const [gridSize, setGridSize] = useState(4)
  const [path, setPath] = useState<Position[]>([])
  const [userPath, setUserPath] = useState<Position[]>([])
  const [gamePhase, setGamePhase] = useState<'ready' | 'showing' | 'input' | 'result'>('ready')
  const [currentStep, setCurrentStep] = useState(0)
  const [obstacles, setObstacles] = useState<Position[]>([])
  const [hasShield, setHasShield] = useState(false)
  const [doubleScoreActive, setDoubleScoreActive] = useState(false)
  const [timeFrozen, setTimeFrozen] = useState(false)
  
  const { score, level, updateScore, incrementLevel, endGame } = useGameStore()
  const { user } = useAuth()
  const createGameSession = useCreateGameSession()
  const { updateScore: updateProfileScore } = useProfile()
  const { consumePowerup } = usePowerups()
  const [startTime] = useState(Date.now())

  const generatePath = () => {
    const pathLength = Math.min(3 + Math.floor(level / 2), 8)
    const newPath: Position[] = []
    
    // Start from random position
    let current = { 
      x: Math.floor(Math.random() * gridSize), 
      y: Math.floor(Math.random() * gridSize) 
    }
    newPath.push(current)
    
    // Generate connected path
    for (let i = 1; i < pathLength; i++) {
      const directions = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
      ]
      
      const validMoves = directions.filter(dir => {
        const next = { x: current.x + dir.x, y: current.y + dir.y }
        return next.x >= 0 && next.x < gridSize && next.y >= 0 && next.y < gridSize &&
               !newPath.some(p => p.x === next.x && p.y === next.y)
      })
      
      if (validMoves.length > 0) {
        const move = validMoves[Math.floor(Math.random() * validMoves.length)]
        current = { x: current.x + move.x, y: current.y + move.y }
        newPath.push(current)
      }
    }
    
    setPath(newPath)
    
    // Generate obstacles (higher levels have more)
    const obstacleCount = Math.min(Math.floor(level / 3), Math.floor(gridSize * gridSize * 0.3))
    const newObstacles: Position[] = []
    
    for (let i = 0; i < obstacleCount; i++) {
      let obstacle: Position
      do {
        obstacle = { 
          x: Math.floor(Math.random() * gridSize), 
          y: Math.floor(Math.random() * gridSize) 
        }
      } while (newPath.some(p => p.x === obstacle.x && p.y === obstacle.y) ||
               newObstacles.some(o => o.x === obstacle.x && o.y === obstacle.y))
      
      newObstacles.push(obstacle)
    }
    
    setObstacles(newObstacles)
  }

  const startRound = () => {
    // Increase grid size every few levels
    setGridSize(Math.min(4 + Math.floor(level / 4), 6))
    generatePath()
    setUserPath([])
    setCurrentStep(0)
    setGamePhase('showing')
  }

  const showPath = async () => {
    const baseSpeed = 1000
    const speedReduction = Math.min((level - 1) * 100, 600)
    const showSpeed = Math.max(baseSpeed - speedReduction, 400)
    
    for (let i = 0; i < path.length; i++) {
      if (!timeFrozen) {
        setCurrentStep(i)
        await new Promise(resolve => setTimeout(resolve, showSpeed))
      }
    }
    
    setCurrentStep(-1)
    setGamePhase('input')
  }

  useEffect(() => {
    if (gamePhase === 'showing' && path.length > 0) {
      showPath()
    }
  }, [gamePhase, path, timeFrozen])

  const handleCellClick = (x: number, y: number) => {
    if (gamePhase !== 'input') return
    
    const newUserPath = [...userPath, { x, y }]
    setUserPath(newUserPath)
    
    const currentIndex = newUserPath.length - 1
    const expectedPos = path[currentIndex]
    
    if (x === expectedPos.x && y === expectedPos.y) {
      if (newUserPath.length === path.length) {
        // Path completed successfully
        let points = path.length * 15 + level * 10
        
        if (doubleScoreActive) {
          points *= 2
          setDoubleScoreActive(false)
          consumePowerup('Double Score')
        }
        
        updateScore(points)
        updateProfileScore.mutate(points)
        incrementLevel()
        setGamePhase('result')
        setTimeout(() => setGamePhase('ready'), 2000)
      }
    } else {
      // Wrong cell clicked
      if (hasShield) {
        setHasShield(false)
        consumePowerup('Shield')
        return // Shield protects from mistake
      }
      
      setGamePhase('result')
      setTimeout(() => {
        if (user) {
          const successRate = userPath.length / path.length
          createGameSession.mutate({
            user_id: user.id,
            game_type: 'spatial-navigation',
            difficulty_level: level,
            score,
            duration: Math.floor((Date.now() - startTime) / 1000),
            success_rate: successRate,
            performance_data: { correctPath: path, userPath, obstacles }
          })
        }
        endGame()
      }, 2000)
    }
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

  const getCellStyle = (x: number, y: number) => {
    const isInPath = path.some(p => p.x === x && p.y === y)
    const isCurrentStep = currentStep >= 0 && path[currentStep]?.x === x && path[currentStep]?.y === y
    const isUserPath = userPath.some(p => p.x === x && p.y === y)
    const isObstacle = obstacles.some(o => o.x === x && o.y === y)
    const pathIndex = path.findIndex(p => p.x === x && p.y === y)
    
    let baseStyle = "w-16 h-16 border-2 transition-all duration-300 cursor-pointer relative overflow-hidden"
    
    if (isObstacle) {
      return `${baseStyle} bg-red-500/30 border-red-400 hover:bg-red-500/50`
    } else if (isCurrentStep) {
      return `${baseStyle} bg-yellow-400 border-yellow-300 animate-pulse scale-110 shadow-2xl`
    } else if (gamePhase === 'showing' && isInPath && pathIndex <= currentStep) {
      return `${baseStyle} bg-blue-500/50 border-blue-400 animate-glow`
    } else if (isUserPath) {
      return `${baseStyle} bg-green-500/50 border-green-400`
    } else {
      return `${baseStyle} bg-gray-700/30 border-gray-600 hover:bg-gray-600/50 hover:border-gray-400`
    }
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Spatial Navigation</h1>
          <div className="flex justify-center space-x-8 text-2xl font-bold mb-4">
            <span className="text-neon-purple animate-pulse">Level: {level}</span>
            <span className="text-neon-blue animate-pulse">Score: {score}</span>
          </div>
          <div className="text-lg text-purple-300 mb-2">
            Grid: {gridSize}×{gridSize} | Path: {path.length} steps | Obstacles: {obstacles.length}
          </div>
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-neon-purple to-neon-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${gamePhase === 'input' ? (userPath.length / path.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {gamePhase === 'input' ? `${userPath.length}/${path.length} Steps` : 'Ready'}
            </p>
          </div>
        </div>

        <div className="card text-center mb-8 animate-float">
          {gamePhase === 'ready' && (
            <div>
              <p className="text-xl mb-6 text-gray-300">Remember the path and navigate through the grid</p>
              <button onClick={startRound} className="game-button">
                Start Navigation
              </button>
            </div>
          )}

          {gamePhase === 'showing' && (
            <p className="text-2xl text-neon-purple font-bold animate-pulse">
              Watch the path... Step {currentStep + 1}/{path.length}
            </p>
          )}

          {gamePhase === 'input' && (
            <p className="text-2xl text-neon-blue font-bold animate-bounce">
              Follow the path! Avoid obstacles 🚧
            </p>
          )}

          {gamePhase === 'result' && (
            <p className="text-2xl font-bold animate-wiggle">
              <span className={userPath.length === path.length ? 'text-green-400' : 'text-red-400'}>
                {userPath.length === path.length ? 'Perfect Navigation!' : 'Path Lost!'}
              </span>
            </p>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div 
            className="grid gap-2 p-6 bg-black/30 rounded-3xl border border-purple-500/30"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const x = i % gridSize
              const y = Math.floor(i / gridSize)
              const pathIndex = path.findIndex(p => p.x === x && p.y === y)
              
              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  disabled={gamePhase !== 'input'}
                  className={getCellStyle(x, y)}
                >
                  {obstacles.some(o => o.x === x && o.y === y) && (
                    <span className="text-2xl">🚧</span>
                  )}
                  {gamePhase === 'showing' && pathIndex >= 0 && pathIndex <= currentStep && (
                    <div className="absolute top-1 left-1 text-xs font-bold text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                      {pathIndex + 1}
                    </div>
                  )}
                  {userPath.some(p => p.x === x && p.y === y) && (
                    <span className="text-2xl">✅</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="text-center">
          <button onClick={endGame} className="btn-secondary hover:animate-wiggle">
            End Game
          </button>
        </div>
        
        <PowerupPanel gameType="spatial-navigation" onPowerupUsed={handlePowerupUsed} />
        
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