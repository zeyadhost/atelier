export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body
  const API_KEY = process.env.VITE_HACKCLUB_API_KEY

  try {
    const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
        image_config: {
          aspect_ratio: '1:1'
        },
        stream: false
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('API Error:', data)
      return res.status(response.status).json({ error: data.error || 'Image generation failed' })
    }

    res.status(200).json(data)
  } catch (error) {
    console.error('Image generation error:', error)
    res.status(500).json({ error: 'Failed to generate image', details: error.message })
  }
}