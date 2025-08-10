import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'

export function PremiumStatus() {
  const { isPremium, isTrialActive, daysUntilExpiry } = usePremiumFeatures()

  if (!isPremium) return null

  return (
    <div className="card bg-gradient-to-r from-purple-600/20 to-yellow-500/20 border-purple-400/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce">👑</div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isTrialActive ? 'Premium Trial' : 'Premium Active'}
            </h3>
            <p className="text-purple-300 text-sm">
              {daysUntilExpiry > 0 
                ? `${daysUntilExpiry} days remaining`
                : 'Expires soon'
              }
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-sm">ALL FEATURES UNLOCKED</div>
          <div className="flex space-x-1 mt-1">
            {['⚡', '📊', '🎨', '🎮'].map((icon, i) => (
              <span key={i} className="text-lg animate-pulse" style={{animationDelay: `${i * 0.2}s`}}>
                {icon}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}