import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export function MultiplayerLobby() {
  const { user } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const queryClient = useQueryClient()

  const { data: activeSessions } = useQuery({
    queryKey: ['multiplayer-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('multiplayer_sessions')
        .select(`
          *,
          multiplayer_players(
            user_id,
            profiles(username, display_name)
          )
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    refetchInterval: 3000
  })

  const createSession = useMutation({
    mutationFn: async (gameType: string) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data: session, error: sessionError } = await supabase
        .from('multiplayer_sessions')
        .insert({
          room_code: roomCode,
          game_type: gameType,
          max_players: 2,
          current_players: 1,
          status: 'waiting'
        })
        .select()
        .single()
      
      if (sessionError) throw sessionError
      
      const { error: playerError } = await supabase
        .from('multiplayer_players')
        .insert({
          session_id: session.id,
          user_id: user?.id
        })
      
      if (playerError) throw playerError
      
      return session
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiplayer-sessions'] })
    }
  })

  const joinSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error: playerError } = await supabase
        .from('multiplayer_players')
        .insert({
          session_id: sessionId,
          user_id: user?.id
        })
      
      if (playerError) throw playerError
      
      const { error: sessionError } = await supabase
        .from('multiplayer_sessions')
        .update({ 
          current_players: 2,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId)
      
      if (sessionError) throw sessionError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multiplayer-sessions'] })
    }
  })

  const joinByCode = useMutation({
    mutationFn: async (code: string) => {
      const { data: session, error } = await supabase
        .from('multiplayer_sessions')
        .select('id')
        .eq('room_code', code.toUpperCase())
        .eq('status', 'waiting')
        .single()
      
      if (error) throw new Error('Room not found')
      
      await joinSession.mutateAsync(session.id)
    },
    onSuccess: () => {
      setRoomCode('')
    }
  })

  const games = [
    { id: 'memory-sequence', name: 'Memory Sequence', icon: '🧠' },
    { id: 'distraction-focus', name: 'Distraction Focus', icon: '🎯' },
    { id: 'context-switch', name: 'Context Switch', icon: '🔄' },
    { id: 'spatial-navigation', name: 'Spatial Navigation', icon: '🗺️' },
    { id: 'pattern-recognition', name: 'Pattern Recognition', icon: '🔍' },
    { id: 'dual-n-back', name: 'Dual N-Back', icon: '⚡' }
  ]

  return (
    <div className="space-y-6">
      {/* Create Room */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Create Multiplayer Room</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => createSession.mutate(game.id)}
              disabled={createSession.isPending}
              className="p-4 bg-black/30 hover:bg-black/50 border-2 border-gray-600 hover:border-purple-400 rounded-xl transition-all duration-300 text-center"
            >
              <div className="text-3xl mb-2">{game.icon}</div>
              <div className="text-white font-bold text-sm">{game.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Join by Code */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Join Room by Code</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="Enter room code..."
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-xl text-white"
            maxLength={6}
          />
          <button
            onClick={() => joinByCode.mutate(roomCode)}
            disabled={!roomCode || joinByCode.isPending}
            className="btn-primary"
          >
            Join Room
          </button>
        </div>
      </div>

      {/* Active Rooms */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Available Rooms</h3>
        {activeSessions && activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.map(session => {
              const isMyRoom = session.multiplayer_players?.some(p => p.user_id === user?.id)
              const gameIcon = games.find(g => g.id === session.game_type)?.icon || '🎮'
              const gameName = games.find(g => g.id === session.game_type)?.name || session.game_type
              
              return (
                <div key={session.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{gameIcon}</div>
                      <div>
                        <div className="text-white font-bold">{gameName}</div>
                        <div className="text-gray-400 text-sm">Room: {session.room_code}</div>
                        <div className="text-purple-400 text-sm">
                          Players: {session.current_players}/{session.max_players}
                        </div>
                      </div>
                    </div>
                    
                    {!isMyRoom && session.current_players < session.max_players && (
                      <button
                        onClick={() => joinSession.mutate(session.id)}
                        disabled={joinSession.isPending}
                        className="btn-primary"
                      >
                        Join Game
                      </button>
                    )}
                    
                    {isMyRoom && (
                      <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl font-bold">
                        Waiting...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-6xl mb-4">🎮</div>
            <p>No active rooms. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}