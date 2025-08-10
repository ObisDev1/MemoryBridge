import { useEffect } from 'react'

interface LordIconProps {
  src: string
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover'
  colors?: string
  size?: number
  className?: string
}

export function LordIcon({ 
  src, 
  trigger = 'hover', 
  colors = 'primary:#8b5cf6,secondary:#06b6d4',
  size = 32, 
  className = ''
}: LordIconProps) {
  useEffect(() => {
    if (!document.querySelector('script[src*="lordicon"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.lordicon.com/lordicon.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  return (
    <lord-icon
      src={src}
      trigger={trigger}
      colors={colors}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={className}
    />
  )
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any
    }
  }
}