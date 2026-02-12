export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt, hasDescription } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const systemMsg = `You generate pastries for "Hazardous Atelier", a dark comedy late-night bakery game with eldritch customers. Respond EXACTLY in this format with no markdown, no code fences, no extra text:\n\nNAME: [creative 2-4 word pastry name]\nASCII:\n[7 lines of ASCII art, max 28 chars each, depicting the pastry]${hasDescription ? '\nDESC: [1-2 sentence darkly humorous description]' : ''}`

    try {
        const response = await fetch('https://ai.hackclub.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_HACKCLUB_API_KEY}`
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-32b',
                messages: [
                    { role: 'system', content: systemMsg },
                    { role: 'user', content: `/no_think\nCustomer order: "${prompt}"` }
                ]
            })
        })

        const text = await response.text()
        if (!response.ok) return res.status(502).json({ error: 'AI request failed', status: response.status, body: text.slice(0, 300) })

        const data = JSON.parse(text)
        const content = (data.choices?.[0]?.message?.content || '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .trim()

        let name = 'Mystery Pastry'
        let ascii = ['⠀⠀⠀⣴⣯⠟⠛⠻⡝⡗⡀⠀', '⠀⠀⠀⠘⠿⠃⠀⠀⠀⠀⣿⣷', '⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣿⡿', '⠀⠀⠀⠀⠀⠀⠀⠀⣞⣿⢟⠁', '⠀⠀⠀⠀⠀⠀⠀⣼⣿⠀⠀⠀', '⠀⠀⠀⠀⠀⠀⠉⠁⠀⠀⠀⠀', '⠀⠀⠀⠀⠀⠀⣿⡟⠀⠀⠀⠀']
        let description = ''

        const nameMatch = content.match(/NAME:\s*(.+)/i)
        if (nameMatch) name = nameMatch[1].trim().replace(/[\[\]]/g, '')

        const asciiMatch = content.match(/ASCII:\s*\n([\s\S]*?)(?:\nDESC:|$)/i)
        if (asciiMatch) {
            const lines = asciiMatch[1].trim().split('\n').slice(0, 7)
            if (lines.length >= 3) ascii = lines
        }

        if (hasDescription) {
            const descMatch = content.match(/DESC:\s*(.+)/i)
            if (descMatch) description = descMatch[1].trim().replace(/[\[\]]/g, '')
        }

        res.status(200).json({ name, ascii, description })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate pastry', details: err.message })
    }
}
