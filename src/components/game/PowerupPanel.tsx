import { usePowerups } from '../../hooks/usePowerups'
import { usePremiumFeatures } from '../../hooks/usePremiumFeatures'

interface PowerupPanelProps {
  gameType: string
  onPowerupUsed?: (powerupName: string) => void
}

export function PowerupPanel({ gameType, onPowerupUsed }: PowerupPanelProps) {
  const { inventory, activePowerups, activatePowerup, getPowerupQuantity } = usePowerups()
  const { features } = usePremiumFeatures()

  const handlePowerupClick = (powerupName: string, itemId: string) => {
    activatePowerup(powerupName, itemId)
    onPowerupUsed?.(powerupName)
  }

  const getRelevantPowerups = () => {
    return inventory.filter(item => {
      const name = item.store_items?.name
      const isPremiumPowerup = item.store_items?.category === 'premium_powerups'
      
      // Block premium powerups for non-premium users
      if (isPremiumPowerup && !features.unlimitedPowerups) {
        return false
      }
      
      switch (gameType) {
        case 'memory-sequence':
          return ['Time Freeze', 'Double Score', 'Shield'].includes(name || '')
        case 'distraction-focus':
          return ['Time Freeze', 'Shield', 'Lightning Boost'].includes(name || '')
        case 'context-switch':
          return ['Double Score', 'Shield', 'Lightning Boost'].includes(name || '')
        default:
          return true
      }
    })
  }

  const relevantPowerups = getRelevantPowerups()

  if (relevantPowerups.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30">
        <h3 className="text-white font-bold text-sm mb-3 text-center">⚡ Powerups</h3>
        
        <div className="flex space-x-2">
          {relevantPowerups.map((item) => {
            const powerupName = item.store_items?.name || ''
            const quantity = getPowerupQuantity(powerupName)
            const isActive = activePowerups.some(p => p.name === powerupName)
            
            const isPremiumPowerup = item.store_items?.category === 'premium_powerups'
            const canUse = !isPremiumPowerup || features.unlimitedPowerups
            
            return (
              <button
                key={item.id}
                onClick={() => handlePowerupClick(powerupName, item.item_id)}
                disabled={quantity === 0 || isActive || !canUse}
                className={`
                  relative w-12 h-12 rounded-xl border-2 transition-all duration-300
                  ${!canUse
                    ? 'bg-yellow-500/20 border-yellow-400 opacity-70'
                    : isActive 
                    ? 'bg-green-500/30 border-green-400 animate-pulse' 
                    : quantity > 0
                    ? 'bg-purple-500/30 border-purple-400 hover:scale-110 hover:bg-purple-500/50'
                    : 'bg-gray-500/30 border-gray-600 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-xl">{item.store_items?.icon}</span>
                
                {!canUse && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">👑</span>
                  </div>
                )}
                
                {quantity > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{quantity}</span>
                  </div>
                )}
                
                {isActive && (
                  <div className="absolute inset-0 bg-green-400/20 rounded-xl animate-pulse" />
                )}
              </button>
            )
          })}
        </div>

        {activePowerups.length > 0 && (
          <div className="mt-3 space-y-1">
            {activePowerups.map((powerup) => (
              <div key={powerup.id} className="flex items-center justify-between text-xs">
                <span className="text-green-400 font-bold">
                  {powerup.icon} {powerup.name}
                </span>
                {powerup.uses && (
                  <span className="text-white">{powerup.uses} uses</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}