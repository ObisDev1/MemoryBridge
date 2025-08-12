import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { GameDashboard } from './components/game/GameDashboard'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { useState, useEffect } from 'react'

function App() {
  const { user, loading, error: authError } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Show auth errors
  useEffect(() => {
    if (authError) {
      setError(`Auth Error: ${authError}`);
    }
  }, [authError])

  useEffect(() => {
    // Add error handling for production
    const handleError = (event: ErrorEvent) => {
      console.error('App Error:', event.error)
      setError('Something went wrong. Please refresh the page.')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">MemoryBridge</h1>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  try {
    return user ? <GameDashboard /> : <AuthForm />
  } catch (err) {
    console.error('Render Error:', err)
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black/40">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">MemoryBridge</h1>
          <p className="text-red-400 mb-4">Failed to load app. Please refresh.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default App