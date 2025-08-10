import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { GameDashboard } from './components/game/GameDashboard'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return user ? <GameDashboard /> : <AuthForm />
}

export default App