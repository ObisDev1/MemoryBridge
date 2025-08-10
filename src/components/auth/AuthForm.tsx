import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, signUp, signInWithGoogle } = useAuth()

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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/80 text-gray-300 font-bold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true)
              setError(null)
              const { error } = await signInWithGoogle()
              if (error) setError(error.message)
              setLoading(false)
            }}
            disabled={loading}
            className="mt-4 w-full flex justify-center items-center px-4 py-3 bg-black/30 border-2 border-neon-purple rounded-2xl text-white font-bold transition-all duration-300 hover:scale-105 hover:bg-black/50 animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

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