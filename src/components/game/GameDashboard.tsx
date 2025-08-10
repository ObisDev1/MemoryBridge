import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useGameStore } from '../../stores/gameStore'
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard'
import { SocialHub } from '../social/SocialHub'
import { LordIcon } from '../ui/LordIcon'
import { MemorySequenceGame } from './MemorySequenceGame'
import { DistractionFocusGame } from './DistractionFocusGame'
import { ContextSwitchGame } from './ContextSwitchGame'
import { SpatialNavigationGame } from './SpatialNavigationGame'
import { PatternRecognitionGame } from './PatternRecognitionGame'
import { DualNBackGame } from './DualNBackGame'
import { EnhancedLeaderboard } from './EnhancedLeaderboard'
import { EnhancedCognitivePanel } from './EnhancedCognitivePanel'
import { ProfilePage } from '../profile/ProfilePage'
import { CognitiveBadge } from './CognitiveBadge'
import { PremiumModal } from '../premium/PremiumModal'
import { DailyBonus } from '../premium/DailyBonus'
import { GameStore } from '../store/GameStore'

const GAMES = [
  {
    id: 'memory-sequence',
    name: 'Memory Sequence',
    description: 'Remember and repeat sequences of colors',
    icon: 'https://cdn.lordicon.com/qhviklyi.json',
    difficulty: 'Easy'
  },
  {
    id: 'distraction-focus',
    name: 'Distraction Focus',
    description: 'Maintain focus while distractions appear',
    icon: 'https://cdn.lordicon.com/uukerzzv.json',
    difficulty: 'Medium'
  },
  {
    id: 'context-switch',
    name: 'Context Switch',
    description: 'Switch between tasks without losing memory',
    icon: 'https://cdn.lordicon.com/wloilxuq.json',
    difficulty: 'Hard'
  },
  {
    id: 'spatial-navigation',
    name: 'Spatial Navigation',
    description: 'Navigate through complex spatial paths',
    icon: 'https://cdn.lordicon.com/slkvcfos.json',
    difficulty: 'Medium'
  },
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identify and match complex visual patterns',
    icon: 'https://cdn.lordicon.com/kkvxgpti.json',
    difficulty: 'Hard'
  },
  {
    id: 'dual-n-back',
    name: 'Dual N-Back',
    description: 'Ultimate working memory challenge',
    icon: 'https://cdn.lordicon.com/kiynvdns.json',
    difficulty: 'Expert'
  }
]

export function GameDashboard() {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const { startGame, currentGame, isPlaying } = useGameStore()
  const [showProfile, setShowProfile] = useState(false)
  const [showStore, setShowStore] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSocial, setShowSocial] = useState(false)

  if (showProfile) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowProfile(false)}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        <ProfilePage />
      </div>
    )
  }

  if (showStore) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowStore(false)}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        <GameStore />
      </div>
    )
  }

  if (showAnalytics) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowAnalytics(false)}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        <AnalyticsDashboard />
      </div>
    )
  }

  if (showSocial) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowSocial(false)}
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
        <SocialHub />
      </div>
    )
  }

  if (isPlaying) {
    switch (currentGame) {
      case 'memory-sequence':
        return <MemorySequenceGame />
      case 'distraction-focus':
        return <DistractionFocusGame />
      case 'context-switch':
        return <ContextSwitchGame />
      case 'spatial-navigation':
        return <SpatialNavigationGame />
      case 'pattern-recognition':
        return <PatternRecognitionGame />
      case 'dual-n-back':
        return <DualNBackGame />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <header className="bg-gradient-to-r from-game-card/80 to-game-accent/80 backdrop-blur-md border-b border-purple-500/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <img src="/vite.svg" alt="MemoryBridge Logo" className="h-16 w-[90px] rounded-lg border-2 border-neon-purple animate-glow" />
              <h1 className="text-3xl font-black neon-text animate-glow">MemoryBridge</h1>
            </div>
            <div className="flex items-center space-x-3">
              {!profile?.is_premium && (
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold py-2 px-4 rounded-full text-sm transition-all duration-300 transform hover:scale-105"
                >
                  👑 Premium
                </button>
              )}
              <button
                onClick={() => setShowStore(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <LordIcon src="https://cdn.lordicon.com/qhgmphtg.json" size={20} trigger="hover" colors="primary:#ffffff" />
                <span>Store</span>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <LordIcon src="https://cdn.lordicon.com/wloilxuq.json" size={20} trigger="hover" colors="primary:#ffffff" />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setShowSocial(true)}
                className="btn-primary text-sm flex items-center space-x-2"
              >
                <LordIcon src="https://cdn.lordicon.com/dxjqoygy.json" size={20} trigger="hover" colors="primary:#ffffff" />
                <span>Social</span>
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="btn-primary text-sm"
              >
                👤 Profile
              </button>
              <button
                onClick={signOut}
                className="btn-secondary text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-5xl font-black text-white mb-4 neon-text animate-float">Choose Your Training</h2>
          <p className="text-xl text-gray-300">Select a game to strengthen your prospective memory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GAMES.map((game, index) => (
            <div key={game.id} className="card hover:scale-105 transition-all duration-500 cursor-pointer group animate-slide-up" style={{animationDelay: `${index * 0.2}s`}}>
              <div className="text-center">
                <div className="mb-6">
                  <LordIcon 
                    src={game.icon}
                    trigger="hover"
                    size={64}
                    colors="primary:#8b5cf6,secondary:#06b6d4"
                  />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-glow">{game.name}</h3>
                <p className="text-gray-300 mb-6 text-lg">{game.description}</p>
                <div className="flex justify-center mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
                    game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
                    game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                    game.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
                    'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  }`}>
                    {game.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => startGame(game.id)}
                  className="w-full game-button group-hover:animate-pulse"
                >
                  Start Training
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 space-y-12">
          <EnhancedCognitivePanel />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <EnhancedLeaderboard />
            </div>
            <CognitiveBadge />
            <DailyBonus />
          </div>
          
          <div className="mt-8">
            <div className="card animate-float">
              <h2 className="text-3xl font-black text-white mb-8 text-center neon-text">🎯 Daily Challenge</h2>
              <div className="text-center">
                <div className="mb-4">
                  <LordIcon 
                    src="https://cdn.lordicon.com/kiynvdns.json"
                    trigger="loop"
                    size={64}
                    colors="primary:#8b5cf6,secondary:#06b6d4"
                  />
                </div>
                <p className="text-xl text-gray-300 mb-6">Complete 3 games in a row without mistakes</p>
                <div className="bg-gray-700 rounded-full h-4 mb-4">
                  <div className="bg-gradient-to-r from-neon-purple to-neon-blue h-4 rounded-full animate-glow" style={{width: '33%'}}></div>
                </div>
                <p className="text-neon-blue font-bold">1/3 Complete</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />
    </div>
  )
}