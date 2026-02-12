export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    try {
        const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_HACKCLUB_API_KEY}`
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                modalities: ['image', 'text'],
                image_config: { aspect_ratio: '1:1' },
                messages: [
                    { role: 'user', content: prompt }
                ]
            })
        })

        const text = await response.text()
        if (!response.ok) return res.status(502).json({ error: 'AI request failed', status: response.status, body: text.slice(0, 300) })

        const data = JSON.parse(text)
        const parts = data.choices?.[0]?.message?.content
        let imageData = null

        if (Array.isArray(parts)) {
            const imgPart = parts.find(p => p.type === 'image_url')
            if (imgPart) imageData = imgPart.image_url?.url || null
        } else if (typeof parts === 'string' && parts.startsWith('data:image')) {
            imageData = parts
        }

        if (!imageData) return res.status(502).json({ error: 'No image returned' })

        res.status(200).json({ url: imageData })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate image', details: err.message })
    }
}
