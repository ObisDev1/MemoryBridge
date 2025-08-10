import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password)

    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40 animate-gradient"></div>
      <div className="card max-w-md w-full relative z-10 animate-float">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black neon-text mb-4 animate-glow">MemoryBridge</h1>
          <p className="text-gray-300 text-lg">Train your prospective memory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-2xl focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 text-white placeholder-gray-400 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border-2 border-purple-500/50 rounded-2xl focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 text-white placeholder-gray-400 transition-all duration-300"
              required
            />
          </div>

          {error && (
            <div className="text-red-300 text-sm bg-red-900/30 border border-red-500/50 p-3 rounded-2xl animate-wiggle">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full game-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-neon-blue hover:text-neon-purple text-sm font-bold transition-colors duration-300 hover:text-glow"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}