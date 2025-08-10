import { ReactNode } from 'react'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'

interface PremiumFeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  showUpgrade?: boolean
}

export function PremiumFeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgrade = true 
}: PremiumFeatureGateProps) {
  const { hasFeature } = usePremiumFeatures()

  if (hasFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgrade) {
    return null
  }

  return (
    <div className="card bg-gradient-to-r from-purple-600/10 to-yellow-500/10 border-purple-400/30">
      <div className="text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
        <p className="text-gray-300 mb-4 text-sm">
          This feature is available with Premium subscription
        </p>
        <button className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-all duration-300 transform hover:scale-105">
          👑 Upgrade to Premium
        </button>
      </div>
    </div>
  )
}