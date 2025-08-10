import { useState } from 'react'
import { FriendsList } from './FriendsList'
import { ChallengeCenter } from './ChallengeCenter'
import { MultiplayerLobby } from './MultiplayerLobby'
import { LordIcon } from '../ui/LordIcon'

export function SocialHub() {
  const [activeTab, setActiveTab] = useState<'friends' | 'challenges' | 'multiplayer'>('friends')

  const tabs = [
    { id: 'friends', name: 'Friends', icon: 'https://cdn.lordicon.com/dxjqoygy.json' },
    { id: 'challenges', name: 'Challenges', icon: 'https://cdn.lordicon.com/yxyampao.json' },
    { id: 'multiplayer', name: 'Multiplayer', icon: 'https://cdn.lordicon.com/qhgmphtg.json' }
  ]

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black neon-text mb-6 animate-glow">Social Hub</h1>
          <p className="text-xl text-gray-300">Connect, compete, and challenge friends</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-black/30 rounded-2xl p-2 flex space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-neon-purple text-white animate-glow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <LordIcon src={tab.icon} size={20} trigger="hover" colors="primary:#ffffff,secondary:#8b5cf6" />
                  <span>{tab.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'friends' && <FriendsList />}
          {activeTab === 'challenges' && <ChallengeCenter />}
          {activeTab === 'multiplayer' && <MultiplayerLobby />}
        </div>
      </div>
    </div>
  )
}