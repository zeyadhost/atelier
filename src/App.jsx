import { useState } from 'react'
import CockpitScene from './components/CockpitScene'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <div style={{width: '100vw', height: '100vh', position: 'relative', background: '#000'}}>
      <CockpitScene />
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-title">Hazardous Atelier</div>
          <p style={{marginBottom: '2rem', fontWeight: 'bold', fontSize: '1rem', color: '#666', letterSpacing: '3px'}}>Bake, Regret, Repeat</p>
          <button className="enter-btn" onClick={() => setShowSplash(false)}>
            CLOCK IN
          </button>
        </div>
      )}
    </div>
  )
}

export default App
