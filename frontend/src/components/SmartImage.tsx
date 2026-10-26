import { useState } from 'react'
import { sceneFor } from '../lib/visuals'

// A Nano Banana image with a gradient fallback. While the backend generates an
// image on demand (404s), we retry a few times so it fades in without a reload.
export function SmartImage({ src, seed, className = '', alt = '' }: {
  src?: string; seed: string; className?: string; alt?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [tries, setTries] = useState(0)
  const showImg = !!src && tries <= 8
  const url = src ? `${src}${tries ? `?r=${tries}` : ''}` : ''
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: sceneFor(seed) }}>
      {showImg && (
        <img
          key={tries}
          src={url}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { if (tries < 8) window.setTimeout(() => setTries((t) => t + 1), 2200) }}
        />
      )}
    </div>
  )
}
