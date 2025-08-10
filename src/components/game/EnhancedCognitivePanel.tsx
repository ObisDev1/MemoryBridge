import { useCognitiveStats } from '../../hooks/useCognitiveStats'
import { LordIcon } from '../ui/LordIcon'

export function EnhancedCognitivePanel() {
  const { stats, insights, getCognitiveLevel } = useCognitiveStats()

  if (!stats) return null

  const cognitiveStats = [
    {
      name: 'Memory Strength',
      value: stats.memory_strength,
      icon: 'https://cdn.lordicon.com/qhviklyi.json',
      description: 'Working memory capacity & retention',
      neuroscience: 'Hippocampus & prefrontal cortex function'
    },
    {
      name: 'Focus Duration',
      value: stats.focus_duration,
      icon: 'https://cdn.lordicon.com/uukerzzv.json',
      description: 'Sustained attention & concentration',
      neuroscience: 'Anterior cingulate cortex activity'
    },
    {
      name: 'Distraction Resistance',
      value: stats.distraction_resistance,
      icon: 'https://cdn.lordicon.com/gqdnbnwt.json',
      description: 'Inhibitory control & selective attention',
      neuroscience: 'Dorsolateral prefrontal cortex strength'
    },
    {
      name: 'Context Switching',
      value: stats.context_switching_speed,
      icon: 'https://cdn.lordicon.com/wloilxuq.json',
      description: 'Cognitive flexibility & task switching',
      neuroscience: 'Executive network coordination'
    }
  ]

  return (
    <div className="card animate-float">
      <h3 className="text-2xl font-black text-white mb-6 neon-text">🧠 Cognitive Profile</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {cognitiveStats.map((stat, index) => {
          const level = getCognitiveLevel(stat.value)
          
          return (
            <div 
              key={stat.name} 
              className="bg-black/30 rounded-xl p-4 animate-slide-up hover:bg-black/40 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <LordIcon src={stat.icon} size={32} trigger="hover" colors="primary:#8b5cf6,secondary:#06b6d4" />
                <div>
                  <h4 className="text-white font-bold">{stat.name}</h4>
                  <p className="text-gray-400 text-sm">{stat.description}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${level.color}`}>{level.level}</span>
                  <span className="text-2xl font-black text-neon-blue">{stat.value}%</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-neon-purple to-neon-blue h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${stat.value}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">{level.description}</p>
              </div>
              
              <div className="text-xs text-purple-300 bg-purple-500/10 rounded-lg p-2">
                <span className="font-bold">🧬 Neuroscience:</span> {stat.neuroscience}
              </div>
            </div>
          )
        })}
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-white flex items-center space-x-2">
            <LordIcon src="https://cdn.lordicon.com/kiynvdns.json" size={24} trigger="loop" />
            <span>AI Cognitive Insights</span>
          </h4>
          
          {insights.map((insight: any, index: number) => (
            <div 
              key={index} 
              className={`rounded-xl p-4 animate-slide-up ${
                insight.type === 'strength' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-yellow-500/10 border border-yellow-500/30'
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-2xl ${insight.type === 'strength' ? '🏆' : '📈'}`}>
                  {insight.type === 'strength' ? '🏆' : '📈'}
                </div>
                <div>
                  <h5 className={`font-bold mb-1 ${
                    insight.type === 'strength' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {insight.title}
                  </h5>
                  <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                  <p className="text-purple-300 text-xs">
                    <span className="font-bold">💡 Recommendation:</span> {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-gray-300 mb-2">
            <span className="font-bold text-neon-purple">Neuroplasticity Tip:</span> 
            Consistent practice creates lasting neural pathways. Train 15-20 minutes daily for optimal cognitive enhancement.
          </p>
          <div className="text-xs text-purple-400">
            Based on neuroscience research • Real-time cognitive assessment
          </div>
        </div>
      </div>
    </div>
  )
}