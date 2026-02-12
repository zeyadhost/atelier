import { useState, useEffect } from 'react'
import CockpitScene from './components/CockpitScene'

const AUDIO_FILES = ['/audio/bell-ring.mp3', '/audio/pc-ambient.mp3', '/audio/cassette-insert.mp3']

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let loaded = 0
    const total = AUDIO_FILES.length

    AUDIO_FILES.forEach(src => {
      const audio = new Audio()
      audio.preload = 'auto'
      const done = () => {
        loaded++
        if (loaded >= total) setLoading(false)
      }
      audio.addEventListener('canplaythrough', done, { once: true })
      audio.addEventListener('error', done, { once: true })
      audio.src = src
    })

    const fallback = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(fallback)
  }, [])

  return (
    <div style={{width: '100vw', height: '100vh', position: 'relative', background: '#000'}}>
      <CockpitScene />
      {loading && (
        <div className="loading-overlay">
          <div className="ios-spinner">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="spinner-blade" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
