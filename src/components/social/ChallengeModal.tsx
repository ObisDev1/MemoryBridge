import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface ChallengeModalProps {
  friend: any
  onClose: () => void
}

export function ChallengeModal({ friend, onClose }: ChallengeModalProps) {
  const { user } = useAuth()
  const [selectedGame, setSelectedGame] = useState('')
  const [difficulty, setDifficulty] = useState(1)
  const queryClient = useQueryClient()

  const games = [
    { id: 'memory-sequence', name: 'Memory Sequence', icon: '🧠' },
    { id: 'distraction-focus', name: 'Distraction Focus', icon: '🎯' },
    { id: 'context-switch', name: 'Context Switch', icon: '🔄' },
    { id: 'spatial-navigation', name: 'Spatial Navigation', icon: '🗺️' },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: '🔍' },
    { id: 'dual-n-back', name: 'Dual N-Back', icon: '⚡' }
  ]

  const createChallenge = useMutation({
    mutationFn: async () => {
      if (!user || !selectedGame) throw new Error('Missing data')
      
      const { data, error } = await supabase.rpc('create_challenge', {
        target_user_id: friend.id,
        game_type: selectedGame,
        difficulty: difficulty
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      onClose()
    }
  })

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-game-card to-game-accent rounded-3xl max-w-lg w-full border border-purple-500/30">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-white">Challenge {friend.display_name || friend.username}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Select Game</h3>
              <div className="grid grid-cols-2 gap-3">
                {games.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game.id)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      selectedGame === game.id
                        ? 'border-neon-purple bg-purple-500/20'
                        : 'border-gray-600 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{game.icon}</div>
                    <div className="text-white text-sm font-bold">{game.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Difficulty Level</h3>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all duration-300 ${
                      difficulty === level
                        ? 'bg-neon-blue text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => createChallenge.mutate()}
                disabled={!selectedGame || createChallenge.isPending}
                className="flex-1 game-button"
              >
                {createChallenge.isPending ? 'Sending...' : '⚔️ Send Challenge'}
              </button>
              <button onClick={onClose} className="flex-1 btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}