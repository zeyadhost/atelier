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
                model: 'qwen/qwen3-32b',
                messages: [{ role: 'user', content: prompt }]
            })
        })

        const data = await response.json()
        res.status(200).json(data)
    } catch (error) {
        console.error('Text generation error:', error)
        res.status(500).json({ error: 'Failed to generate text' })
    }
}