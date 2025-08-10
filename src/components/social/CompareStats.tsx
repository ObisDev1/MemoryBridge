import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { LordIcon } from '../ui/LordIcon'

interface CompareStatsProps {
  friendId: string
  friendName: string
  onClose: () => void
}

export function CompareStats({ friendId, friendName, onClose }: CompareStatsProps) {
  const { user } = useAuth()

  const { data: myStats } = useQuery({
    queryKey: ['my-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: friendStats } = useQuery({
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

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('total_score, games_played, gems')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: friendProfile } = useQuery({
    queryKey: ['friend-profile', friendId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_score, games_played, gems')
        .eq('id', friendId)
        .single()
      
      if (error) throw error
      return data
    }
  })

  const compareValue = (myVal: number, friendVal: number) => {
    if (myVal > friendVal) return 'text-green-400'
    if (myVal < friendVal) return 'text-red-400'
    return 'text-yellow-400'
  }

  const stats = [
    { name: 'Total Score', icon: 'https://cdn.lordicon.com/yxyampao.json', my: myProfile?.total_score || 0, friend: friendProfile?.total_score || 0 },
    { name: 'Games Played', icon: 'https://cdn.lordicon.com/qhgmphtg.json', my: myProfile?.games_played || 0, friend: friendProfile?.games_played || 0 },
    { name: 'Gems', icon: 'https://cdn.lordicon.com/jdalicnn.json', my: myProfile?.gems || 0, friend: friendProfile?.gems || 0 },
    { name: 'Memory', icon: 'https://cdn.lordicon.com/qhviklyi.json', my: myStats?.memory_strength || 0, friend: friendStats?.memory_strength || 0 },
    { name: 'Focus', icon: 'https://cdn.lordicon.com/uukerzzv.json', my: myStats?.focus_duration || 0, friend: friendStats?.focus_duration || 0 },
    { name: 'Resistance', icon: 'https://cdn.lordicon.com/gqdnbnwt.json', my: myStats?.distraction_resistance || 0, friend: friendStats?.distraction_resistance || 0 },
    { name: 'Switching', icon: 'https://cdn.lordicon.com/wloilxuq.json', my: myStats?.context_switching_speed || 0, friend: friendStats?.context_switching_speed || 0 }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-game-card to-game-accent rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-white">Stats Comparison</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-center">
            <div className="text-neon-blue font-bold text-xl">You</div>
            <div className="text-white font-bold text-xl">Stat</div>
            <div className="text-neon-purple font-bold text-xl">{friendName}</div>
          </div>

          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={stat.name} className="bg-black/30 rounded-xl p-4 animate-slide-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className={`text-center font-bold text-xl ${compareValue(stat.my, stat.friend)}`}>
                    {stat.my.toLocaleString()}
                  </div>
                  <div className="text-center">
                    <div className="mb-1">
                      <LordIcon src={stat.icon} size={32} trigger="hover" colors="primary:#8b5cf6,secondary:#06b6d4" />
                    </div>
                    <div className="text-white font-bold">{stat.name}</div>
                  </div>
                  <div className={`text-center font-bold text-xl ${compareValue(stat.friend, stat.my)}`}>
                    {stat.friend.toLocaleString()}
                  </div>
                </div>
                
                <div className="mt-3 flex items-center">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                    <div 
                      className="bg-neon-blue h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((stat.my / Math.max(stat.my, stat.friend, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 ml-2">
                    <div 
                      className="bg-neon-purple h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((stat.friend / Math.max(stat.my, stat.friend, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button onClick={onClose} className="btn-secondary">
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}