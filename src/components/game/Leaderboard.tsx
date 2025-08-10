import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface LeaderboardEntry {
  user_id: string
  total_score: number
  username: string
  display_name: string
  rank: number
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchLeaderboard()
    
    const subscription = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchLeaderboard()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id:id, total_score, username, display_name')
      .order('total_score', { ascending: false })
      .limit(10)

    if (data && !error) {
      const rankedData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
      setEntries(rankedData)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="card animate-float">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card animate-float">
      <h2 className="text-3xl font-black text-white mb-8 text-center neon-text">🏆 Leaderboard</h2>
      
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`
              flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-105
              ${entry.user_id === user?.id ? 'bg-neon-purple/20 border-2 border-neon-purple' : 'bg-black/30 border border-gray-600'}
              ${index < 3 ? 'animate-glow' : ''}
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-black text-lg
                ${index === 0 ? 'bg-yellow-500 text-black' : 
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-700 text-white'}
              `}>
                {entry.rank}
              </div>
              
              <div>
                <p className="font-bold text-white">
                  {entry.display_name || entry.username || 'Anonymous'}
                  {entry.user_id === user?.id && (
                    <span className="ml-2 text-neon-blue text-sm">(You)</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-black text-neon-blue">
                {entry.total_score.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}