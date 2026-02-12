export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const systemMsg = 'You generate pastries for "Hazardous Atelier", a dark comedy late-night bakery game with eldritch customers. Respond EXACTLY in this format with no markdown, no code fences, no extra text:\n\nNAME: [creative 2-4 word pastry name]\nDESC: [2-3 sentence darkly humorous description of the pastry, its appearance, smell, and probable side effects]'

    try {
        const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
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
        let description = 'Something went wrong. It smells like burnt code.'

        const nameMatch = content.match(/NAME:\s*(.+)/i)
        if (nameMatch) name = nameMatch[1].trim().replace(/[\[\]]/g, '')

        const descMatch = content.match(/DESC:\s*(.+)/i)
        if (descMatch) description = descMatch[1].trim().replace(/[\[\]]/g, '')

        res.status(200).json({ name, description })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate pastry', details: err.message })
    }
}
