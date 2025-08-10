import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface LeaderboardEntry {
  id: string
  username: string
  display_name: string
  avatar_url: string
  total_score: number
  games_played: number
  country: string
  rank: number
  badge_tier: 'champion' | 'elite' | 'master' | 'player'
  last_active: string
}

type LeaderboardType = 'score' | 'activity'
type FilterType = 'all' | 'country' | 'week'

export function EnhancedLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [boardType, setBoardType] = useState<LeaderboardType>('score')
  const [filter, setFilter] = useState<FilterType>('all')
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
  }, [boardType, filter])

  const fetchLeaderboard = async () => {
    let query = supabase.from(boardType === 'score' ? 'leaderboard_view' : 'most_active_view').select('*')
    
    if (filter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('last_active', weekAgo.toISOString())
    }
    
    const { data, error } = await query.limit(50)

    if (data && !error) {
      setEntries(data)
    }
    setLoading(false)
  }

  const getBadgeIcon = (tier: string, rank: number) => {
    switch (tier) {
      case 'champion': return '👑'
      case 'elite': return rank === 2 ? '🥈' : '🥉'
      case 'master': return '🏆'
      default: return '🎮'
    }
  }

  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'champion': return 'from-yellow-400 to-yellow-600'
      case 'elite': return 'from-gray-300 to-gray-500'
      case 'master': return 'from-orange-400 to-orange-600'
      default: return 'from-blue-400 to-blue-600'
    }
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
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white neon-text text-center mb-4">🏆 Leaderboard</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <select
            value={boardType}
            onChange={(e) => setBoardType(e.target.value as LeaderboardType)}
            className="bg-black/50 border border-purple-500/50 rounded-xl px-3 py-2 text-white text-sm flex-1 sm:flex-none"
          >
            <option value="score">Top Scores</option>
            <option value="activity">Most Active</option>
          </select>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="bg-black/50 border border-purple-500/50 rounded-xl px-3 py-2 text-white text-sm flex-1 sm:flex-none"
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`
              flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-105
              ${entry.id === user?.id ? 'bg-neon-purple/20 border-2 border-neon-purple' : 'bg-black/30 border border-gray-600'}
              ${entry.badge_tier !== 'player' ? 'animate-glow' : ''}
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center space-x-4">
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center font-black text-lg bg-gradient-to-r ${getBadgeColor(entry.badge_tier)}
                ${entry.badge_tier !== 'player' ? 'animate-pulse' : ''}
              `}>
                <span className="text-2xl">{getBadgeIcon(entry.badge_tier, entry.rank)}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                {entry.avatar_url ? (
                  <img 
                    src={entry.avatar_url} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full border-2 border-neon-blue"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                    {(entry.display_name || entry.username || 'A')[0].toUpperCase()}
                  </div>
                )}
                
                <div>
                  <p className="font-bold text-white">
                    {entry.display_name || entry.username || 'Anonymous'}
                    {entry.id === user?.id && (
                      <span className="ml-2 text-neon-blue text-sm">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.country && `${entry.country} • `}
                    Rank #{entry.rank}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-black text-neon-blue">
                {boardType === 'score' 
                  ? entry.total_score.toLocaleString()
                  : entry.games_played.toLocaleString()
                }
              </p>
              <p className="text-sm text-gray-400">
                {boardType === 'score' ? 'points' : 'games'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}