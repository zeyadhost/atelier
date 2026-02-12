export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    try {
        const response = await fetch('https://ai.hackclub.com/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_HACKCLUB_API_KEY}`
            },
            body: JSON.stringify({ prompt, n: 1, size: '256x256' })
        })

        const text = await response.text()
        if (!response.ok) return res.status(502).json({ error: 'AI request failed', status: response.status, body: text.slice(0, 300) })

        const data = JSON.parse(text)
        const url = data.data?.[0]?.url || data.data?.[0]?.b64_json || null

        if (!url) return res.status(502).json({ error: 'No image returned' })

        res.status(200).json({ url })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate image', details: err.message })
    }
}
