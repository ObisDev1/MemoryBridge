import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import { PremiumStatus } from '../premium/PremiumStatus'
import { SubscriptionManager } from '../premium/SubscriptionManager'

export function ProfilePage() {
  const { user } = useAuth()
  const { profile, updateProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    country: profile?.country || ''
  })
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    await updateProfile.mutateAsync(formData)
    setEditing(false)
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      await updateProfile.mutateAsync({ avatar_url: data.publicUrl })
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Japan', 'South Korea', 'Brazil', 'India', 'China', 'Russia',
    'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Other'
  ]

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="card animate-float mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black neon-text mb-2 animate-glow">Profile Settings</h1>
            <p className="text-gray-300">Customize your gaming identity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-full border-4 border-neon-purple animate-glow"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center text-white text-4xl font-black animate-glow">
                    {(profile?.display_name || profile?.username || 'A')[0].toUpperCase()}
                  </div>
                )}
                
                <label className="absolute bottom-0 right-0 bg-neon-blue hover:bg-neon-purple w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <span className="text-white text-xl">📷</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploading && (
                <p className="text-neon-blue animate-pulse">Uploading...</p>
              )}
            </div>

            <div className="space-y-6">
              {editing ? (
                <>
                  <div>
                    <label className="block text-white font-bold mb-2">Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-2xl text-white"
                      placeholder="Your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-2xl text-white"
                      placeholder="Your username"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-2xl text-white"
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button onClick={handleSave} className="game-button flex-1">
                      Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-white font-bold mb-2">Display Name</h3>
                    <p className="text-gray-300 text-lg">{profile?.display_name || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-2">Username</h3>
                    <p className="text-gray-300 text-lg">{profile?.username || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold mb-2">Country</h3>
                    <p className="text-gray-300 text-lg">{profile?.country || 'Not set'}</p>
                  </div>

                  <button onClick={() => setEditing(true)} className="game-button w-full">
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <PremiumStatus />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center animate-float">
              <h3 className="text-xl font-bold text-white mb-4">💎 Gems</h3>
              <div className="text-4xl font-black text-yellow-400 animate-glow mb-2">
                {profile?.gems || 100}
              </div>
              <p className="text-gray-300">Available gems</p>
            </div>

            <div className="card text-center animate-float" style={{animationDelay: '0.2s'}}>
              <h3 className="text-xl font-bold text-white mb-4">🎮 Games Played</h3>
              <div className="text-4xl font-black text-neon-blue animate-glow mb-2">
                {profile?.games_played || 0}
              </div>
              <p className="text-gray-300">Total games</p>
            </div>

            <div className="card text-center animate-float" style={{animationDelay: '0.4s'}}>
              <h3 className="text-xl font-bold text-white mb-4">👑 Status</h3>
              <div className="text-2xl font-black mb-2">
                {profile?.is_premium ? (
                  <span className="text-yellow-400 animate-glow">PREMIUM</span>
                ) : (
                  <span className="text-gray-400">FREE</span>
                )}
              </div>
              <p className="text-gray-300">Account type</p>
            </div>
          </div>
          
          <SubscriptionManager />
        </div>
      </div>
    </div>
  )
}