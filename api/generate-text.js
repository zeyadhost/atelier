export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const systemMsg = 'You generate pastries for "Hazardous Atelier", a dark comedy late-night bakery game with eldritch customers. Respond ONLY as valid JSON (no markdown fences, no extra text) with these exact keys:\n{\n  "name": "creative 2-4 word pastry name",\n  "description": "2-3 sentence darkly humorous description of the pastry, its appearance, smell, and probable side effects",\n  "price": random integer between 80 and 220 (VARY this — do NOT always use the same number),\n  "bakeTime": random integer seconds between 15 and 55 (VARY this — cheap/simple items bake faster, complex ones slower)\n}'

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
        let price = 120
        let bakeTime = 30

        try {
            const parsed = JSON.parse(content)
            if (parsed.name) name = String(parsed.name).trim()
            if (parsed.description) description = String(parsed.description).trim()
            if (parsed.price) price = Math.max(60, Math.min(240, parseInt(parsed.price, 10) || 120))
            if (parsed.bakeTime) bakeTime = Math.max(10, Math.min(60, parseInt(parsed.bakeTime, 10) || 30))
        } catch (e) {
            const nameMatch = content.match(/NAME:\s*(.+)/i)
            if (nameMatch) name = nameMatch[1].trim().replace(/[\[\]]/g, '')
            const descMatch = content.match(/DESC:\s*(.+)/i)
            if (descMatch) description = descMatch[1].trim().replace(/[\[\]]/g, '')
            const priceMatch = content.match(/PRICE:\s*(\d+)/i)
            if (priceMatch) price = Math.max(60, Math.min(240, parseInt(priceMatch[1], 10)))
        }

        res.status(200).json({ name, description, price, bakeTime })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate pastry', details: err.message })
    }
}
