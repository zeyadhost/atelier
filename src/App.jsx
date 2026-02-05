import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [isBaking, setIsBaking] = useState(false)
  const [pastryData, setPastryData] = useState(null)
  const [error, setError] = useState(null)
  
  const [showSplash, setShowSplash] = useState(true)

  async function handleBake(e) {
    e.preventDefault()
    if (!ingredients) return
    setIsBaking(true)
    setError(null)

     try {
      const prompt = `You are a culinary mad scientist describing a dangerous pastry. The user wants to create: "${ingredients}". 

      Describe this pastry in 2-3 sentences. Make it sound both delicious and terrifying. Include what makes it dangerous, its appearance, and potential side effects. Be creative and funny.`

      const response = await puter.ai.chat(prompt, {
        model: 'gpt-4o-mini'
      })

      setPastryData({
        name: ingredients,
        description: response.message.content,
        review: 'Waiting for customer...'
      })
    } catch (err) {
      console.error('AI Error:', err)
      setError('Failed to generate pastry description. Please try again.')
    } finally {
      setIsBaking(false)
    }
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
            {isBaking ? '🧪 MIXING...' : 'CONCOCT'}
          </button>
        </form>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>

      {pastryData && !isBaking && (
        <div className="display-case">
          <h2 style={{color: '#000'}}>{pastryData.name}</h2>
          <div className="description-text">
            <ReactMarkdown>{pastryData.description}</ReactMarkdown>
          </div>
          <div className="stamp">PENDING INSPECTION</div>
        </div>
      )}

      <footer className="puter-footer">
        <a href="https://developer.puter.com" target="_blank" rel="noopener noreferrer">
          Powered by Puter
        </a>
      </footer>
    </div>
  )
}

export default App