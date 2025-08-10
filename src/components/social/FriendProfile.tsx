import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CompareStats } from './CompareStats'

interface FriendProfileProps {
  friendId: string
  onClose: () => void
}

export function FriendProfile({ friendId, onClose }: FriendProfileProps) {
  const [showCompare, setShowCompare] = useState(false)
  const { data: profile } = useQuery({
    queryKey: ['friend-profile', friendId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single()
      
      if (error) throw error
      return data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['friend-stats', friendId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', friendId)
        .single()
      
      if (error) throw error
      return data
    }
  })

  if (!profile) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-game-card to-game-accent rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {(profile.display_name || profile.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{profile.display_name || profile.username}</h2>
                <p className="text-gray-300">@{profile.username}</p>
                {profile.country && <p className="text-purple-300">{profile.country}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-black text-neon-blue">{profile.total_score?.toLocaleString() || 0}</div>
              <div className="text-gray-300 text-sm">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-400">{profile.games_played || 0}</div>
              <div className="text-gray-300 text-sm">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-400">{profile.gems || 0}</div>
              <div className="text-gray-300 text-sm">Gems</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-purple-400">{profile.skill_level || 1}</div>
              <div className="text-gray-300 text-sm">Level</div>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-neon-purple">{stats.memory_strength}</div>
                <div className="text-gray-300 text-sm">🧠 Memory</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-neon-blue">{stats.focus_duration}</div>
                <div className="text-gray-300 text-sm">🎯 Focus</div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button className="flex-1 game-button">
              ⚔️ Challenge Friend
            </button>
            <button 
              onClick={() => setShowCompare(true)}
              className="flex-1 btn-secondary"
            >
              📊 Compare Stats
            </button>
          </div>
        </div>
      </div>
      
      {showCompare && (
        <CompareStats 
          friendId={friendId}
          friendName={profile.display_name || profile.username}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}