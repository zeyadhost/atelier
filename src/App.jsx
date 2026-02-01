import { useState } from 'react'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [isBaking, setIsBaking] = useState(false)
  const [pastryData, setPastryData] = useState(null)
  
  const [showSplash, setShowSplash] = useState(true)

  async function handleBake(e) {
    e.preventDefault()
    if (!ingredients) return

    setIsBaking(true)
    
    setTimeout(() => {
      setPastryData({
        name: ingredients,
        description: 'Waiting for AI processing...',
        review: 'Waiting for customer...'
      })
      setIsBaking(false)
    }, 2000)
  }

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-title">Hazardous Atelier</div>
        <p style={{marginBottom: '2rem', fontWeight: 'bold', fontSize: '1.2rem'}}>Bake, Regret, Repeat</p>
        <button className="enter-btn" onClick={() => setShowSplash(false)}>
          OPEN BAKERY
        </button>
      </div>
    )
  }

  return (
    <div className="bakery-container">
      <header>
        <h1>Hazardous Atelier</h1>
        <p style={{fontWeight: 'bold', fontSize: '1.5rem', color: '#000'}}>Bake, Regret, Repeat</p>
      </header>
      
      <div className="kitchen-station">
        <form onSubmit={handleBake}>
          <input
            type="text"
            placeholder="Input volatile ingredients..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            disabled={isBaking}
          />
          <button type="submit" className="bake-btn" disabled={isBaking}>
            {isBaking ? '...' : 'CONCOCT'}
          </button>
        </form>
      </div>

      {pastryData && (
        <div className="display-case">
          <h2 style={{color: '#000'}}>{pastryData.name}</h2>
          <p style={{fontStyle: 'italic', color: '#333'}}>{pastryData.description}</p>
          <div className="stamp">PENDING INSPECTION</div>
        </div>
      )}
    </div>
  )
}

export default App