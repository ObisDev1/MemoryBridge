import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { FriendProfile } from './FriendProfile'
import { ChallengeModal } from './ChallengeModal'

export function FriendsList() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)
  const queryClient = useQueryClient()

  const { data: friends } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:requester_id(id, username, display_name, avatar_url),
          addressee:addressee_id(id, username, display_name, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
      
      if (error) throw error
      return data
    },
    enabled: !!user,
    refetchInterval: 2000
  })

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:requester_id(id, username, display_name, avatar_url)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
      
      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(10)
      
      if (error) throw error
      return data
    },
    enabled: !!searchQuery && searchQuery.length >= 2
  })

  const sendFriendRequest = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.rpc('send_friend_request', {
        target_user_id: targetUserId
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      setSearchQuery('')
    }
  })

  const acceptRequest = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)
        .eq('addressee_id', user?.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] })
    }
  })

  const getFriendProfile = (friendship: any) => {
    return friendship.requester_id === user?.id ? friendship.addressee : friendship.requester
  }

  return (
    <div className="space-y-6">
      {/* Search Users */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Add Friends</h3>
        <input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-xl text-white"
        />
        
        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-white font-bold">
                    {(user.display_name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold">{user.display_name || user.username}</div>
                    <div className="text-gray-400 text-sm">@{user.username}</div>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest.mutate(user.id)}
                  disabled={sendFriendRequest.isPending}
                  className="btn-primary text-sm"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-white mb-4">Friend Requests</h3>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-white font-bold">
                    {(request.requester.display_name || request.requester.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold">{request.requester.display_name || request.requester.username}</div>
                    <div className="text-gray-400 text-sm">wants to be friends</div>
                  </div>
                </div>
                <button
                  onClick={() => acceptRequest.mutate(request.id)}
                  disabled={acceptRequest.isPending}
                  className="btn-primary text-sm"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Friends ({friends?.length || 0})</h3>
        {friends && friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map(friendship => {
              const friend = getFriendProfile(friendship)
              return (
                <div key={friendship.id} className="bg-black/30 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center text-white font-bold">
                      {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold">{friend.display_name || friend.username}</div>
                      <div className="text-gray-400 text-sm">@{friend.username}</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedFriend(friend)
                        setShowChallenge(true)
                      }}
                      className="flex-1 btn-primary text-sm"
                    >
                      Challenge
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedFriend(friend)
                        setShowProfile(true)
                      }}
                      className="flex-1 btn-secondary text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-6xl mb-4">👥</div>
            <p>No friends yet. Search and add some!</p>
          </div>
        )}
      </div>
      
      {showProfile && selectedFriend && (
        <FriendProfile 
          friendId={selectedFriend.id}
          onClose={() => {
            setShowProfile(false)
            setSelectedFriend(null)
          }}
        />
      )}
      
      {showChallenge && selectedFriend && (
        <ChallengeModal 
          friend={selectedFriend}
          onClose={() => {
            setShowChallenge(false)
            setSelectedFriend(null)
          }}
        />
      )}
    </div>
  )
}