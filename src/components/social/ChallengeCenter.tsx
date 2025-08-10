import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function ChallengeCenter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: challenges } = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          creator:creator_id(id, username, display_name, avatar_url),
          challenger:challenger_id(id, username, display_name, avatar_url)
        `)
        .or(`creator_id.eq.${user.id},challenger_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const acceptChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'active' })
        .eq('id', challengeId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
    }
  })

  const getGameIcon = (gameType: string) => {
    const icons: Record<string, string> = {
      'memory-sequence': '🧠',
      'distraction-focus': '🎯',
      'context-switch': '🔄',
      'spatial-navigation': '🗺️',
      'pattern-recognition': '🔍',
      'dual-n-back': '⚡'
    }
    return icons[gameType] || '🎮'
  }

  const getGameName = (gameType: string) => {
    const names: Record<string, string> = {
      'memory-sequence': 'Memory Sequence',
      'distraction-focus': 'Distraction Focus',
      'context-switch': 'Context Switch',
      'spatial-navigation': 'Spatial Navigation',
      'pattern-recognition': 'Pattern Recognition',
      'dual-n-back': 'Dual N-Back'
    }
    return names[gameType] || gameType
  }

  const pendingChallenges = challenges?.filter(c => c.status === 'pending') || []
  const activeChallenges = challenges?.filter(c => c.status === 'active') || []
  const completedChallenges = challenges?.filter(c => c.status === 'completed') || []

  return (
    <div className="space-y-6">
      {/* Pending Challenges */}
      {pendingChallenges.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Pending Challenges</h3>
          <div className="space-y-3">
            {pendingChallenges.map(challenge => {
              const isCreator = challenge.creator_id === user?.id
              const opponent = isCreator ? challenge.challenger : challenge.creator
              
              return (
                <div key={challenge.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{getGameIcon(challenge.game_type)}</div>
                      <div>
                        <div className="text-white font-bold">{getGameName(challenge.game_type)}</div>
                        <div className="text-gray-400 text-sm">
                          {isCreator ? `Challenging ${opponent.display_name || opponent.username}` : 
                           `Challenge from ${opponent.display_name || opponent.username}`}
                        </div>
                        <div className="text-purple-400 text-sm">Level {challenge.difficulty_level}</div>
                      </div>
                    </div>
                    
                    {!isCreator && (
                      <button
                        onClick={() => acceptChallenge.mutate(challenge.id)}
                        disabled={acceptChallenge.isPending}
                        className="btn-primary"
                      >
                        Accept Challenge
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Active Challenges</h3>
          <div className="space-y-3">
            {activeChallenges.map(challenge => {
              const isCreator = challenge.creator_id === user?.id
              const opponent = isCreator ? challenge.challenger : challenge.creator
              
              return (
                <div key={challenge.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl animate-pulse">{getGameIcon(challenge.game_type)}</div>
                      <div>
                        <div className="text-white font-bold">{getGameName(challenge.game_type)}</div>
                        <div className="text-gray-400 text-sm">vs {opponent.display_name || opponent.username}</div>
                        <div className="flex space-x-4 mt-2">
                          <div className="text-neon-blue">You: {isCreator ? challenge.creator_score : challenge.challenger_score}</div>
                          <div className="text-neon-purple">Them: {isCreator ? challenge.challenger_score : challenge.creator_score}</div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="btn-primary">
                      Play Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Recent Results</h3>
          <div className="space-y-3">
            {completedChallenges.slice(0, 5).map(challenge => {
              const isCreator = challenge.creator_id === user?.id
              const opponent = isCreator ? challenge.challenger : challenge.creator
              const myScore = isCreator ? challenge.creator_score : challenge.challenger_score
              const theirScore = isCreator ? challenge.challenger_score : challenge.creator_score
              const won = challenge.winner_id === user?.id
              
              return (
                <div key={challenge.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{getGameIcon(challenge.game_type)}</div>
                      <div>
                        <div className="text-white font-bold">{getGameName(challenge.game_type)}</div>
                        <div className="text-gray-400 text-sm">vs {opponent.display_name || opponent.username}</div>
                        <div className="flex space-x-4 mt-2">
                          <div className="text-neon-blue">You: {myScore}</div>
                          <div className="text-neon-purple">Them: {theirScore}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full font-bold ${
                      won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {won ? '🏆 Won' : '💔 Lost'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {challenges?.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚔️</div>
          <h3 className="text-xl font-bold text-white mb-2">No Challenges Yet</h3>
          <p className="text-gray-400">Challenge your friends to memory battles!</p>
        </div>
      )}
    </div>
  )
}