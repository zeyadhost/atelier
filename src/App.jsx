import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

function App() {
  const [ingredients, setIngredients] = useState('')
  const [isBaking, setIsBaking] = useState(false)
  const [pastryData, setPastryData] = useState(null)
  const [error, setError] = useState(null)
  const [pastryImage, setPastryImage] = useState(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const [showSplash, setShowSplash] = useState(true)

  async function handleBake(e) {
    e.preventDefault()
    if (!ingredients) return
    
    if (window.location.hostname === 'localhost') {
      setError('Local dev mode: Deploy to Vercel to test API functions')
      return
    }
    
    setIsBaking(true)
    setError(null)
    setPastryImage(null)

    try {
      const prompt = `You are a culinary mad scientist creating a dangerous pastry based on these ingredients: "${ingredients}". 

Generate a creative pastry name and description. Return ONLY valid JSON in this exact format:
{
  "name": "Creative Pastry Name Here",
  "description": "2-3 sentence description. Make it both delicious and terrifying. Include what makes it dangerous, its appearance, and potential side effects. Be creative and funny."
}

Do not include any text outside the JSON.`

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()
      console.log('Text API Response:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid API response format')
      }
      
      const jsonText = data.choices[0].message.content.trim()
      const parsedData = JSON.parse(jsonText)

      setPastryData({
        name: parsedData.name,
        description: parsedData.description,
        review: 'Waiting for customer...'
      })

      setIsBaking(false)
      setIsGeneratingImage(true)
      setImageError(false)

      try {
        const imagePrompt = `A photorealistic, professional food photography image of: ${parsedData.name}. ${parsedData.description}. Studio lighting, appetizing yet dangerous looking.`
        
        const imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: imagePrompt })
        })

        const imageData = await imageResponse.json()
        
        console.log('Image API Response:', imageData)
        
        if (imageData.error) {
          console.error('Image API Error:', imageData.error, imageData.details)
          throw new Error(typeof imageData.error === 'string' ? imageData.error : JSON.stringify(imageData.error))
        }

        if (imageData.choices && imageData.choices[0]?.message?.images?.[0]?.image_url?.url) {
          const imageUrl = imageData.choices[0].message.images[0].image_url.url
          setPastryImage(imageUrl)
        } else {
          console.error('Unexpected image response format:', imageData)
          throw new Error('Invalid image response format')
        }
      } catch (imgErr) {
        console.error('Image Generation Error:', imgErr.message || imgErr)
        setImageError(true)
      } finally {
        setIsGeneratingImage(false)
      }

    } catch (err) {
      console.error('AI Error:', err)
      setError('Failed to generate pastry. Please try again.')
      setIsBaking(false)
      setIsGeneratingImage(false)
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
            placeholder="Describe your ingredients..."
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

      {pastryData && (
        <div className="display-case">
          <h2 style={{color: '#000'}}>{pastryData.name}</h2>
          
          {isGeneratingImage && (
            <div className="image-loader">
              <div className="spinner"></div>
              <p>Developing photo...</p>
            </div>
          )}
          
          {imageError && !isGeneratingImage && (
            <div className="image-placeholder">
              <div className="no-photo-icon">📷</div>
              <p>Photo Not Available</p>
              <button 
                className="retry-btn"
                onClick={async () => {
                  setIsGeneratingImage(true)
                  setImageError(false)
                  try {
                    const imagePrompt = `A photorealistic, professional food photography image of: ${pastryData.name}. ${pastryData.description}. Studio lighting, appetizing yet dangerous looking.`
                    
                    const imageResponse = await fetch('/api/generate-image', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ prompt: imagePrompt })
                    })

                    const imageData = await imageResponse.json()
                    
                    if (imageData.error) {
                      throw new Error(imageData.error)
                    }

                    if (imageData.choices && imageData.choices[0]?.message?.images?.[0]?.image_url?.url) {
                      const imageUrl = imageData.choices[0].message.images[0].image_url.url
                      setPastryImage(imageUrl)
                    } else {
                      throw new Error('Invalid image response format')
                    }
                  } catch (err) {
                    console.error('Retry error:', err)
                    setImageError(true)
                  } finally {
                    setIsGeneratingImage(false)
                  }
                }}
              >
                Retry Photo
              </button>
            </div>
          )}
          
          {pastryImage && !isGeneratingImage && !imageError && (
            <div className="polaroid">
              <img src={pastryImage} alt={pastryData.name} />
            </div>
          )}
          
          <div className="description-text">
            <ReactMarkdown>{pastryData.description}</ReactMarkdown>
          </div>
          <div className="stamp">PENDING INSPECTION</div>
        </div>
      )}

      <footer className="api-footer">
        <a href="https://hackclub.com" target="_blank" rel="noopener noreferrer">
          Powered by Hack Club
        </a>
      </footer>
    </div>
  )
}

export default App