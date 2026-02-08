export default async function handler(req, res) {
  const allowedOrigin = 'https://donteatthis.vercel.app'
  const origin = req.headers.origin || req.headers.referer

  if (!origin || !origin.startsWith(allowedOrigin)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body
  const API_KEY = process.env.VITE_HACKCLUB_API_KEY

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
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