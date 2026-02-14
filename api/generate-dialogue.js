const safeJsonParse = (raw) => {
    try {
        return JSON.parse(raw)
    } catch (err) {
        const sanitized = raw.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')
        return JSON.parse(sanitized)
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { customer, menu } = req.body
    if (!customer || !Array.isArray(menu)) return res.status(400).json({ error: 'Missing customer or menu' })

    const menuText = menu.map(item => `${item.name} ($${item.price})`).join(', ')

    const exampleJson = JSON.stringify({
      greeting: "*Slithers up to the counter.* I need a **Void Croissant** and a **Neon Eclair**. Don't ask why.",
      positiveReply: { text: "\"Two items, coming right up!\"", response: "*Nods approvingly.* Finally, someone with **manners**. I'll wait." },
      negativeReply: { text: "\"Ugh, more work...\"", response: "*Narrows eyes.* You're lucky I'm **hungry**, pal." },
      requestedItems: ["Void Croissant", "Neon Eclair"],
      positiveReaction: "*Takes a bite and the lights flicker.* **Exquisite.** My void-stomach approves.",
      negativeReaction: "*Stares at pastry.* This is **not** what I asked for. *Slides it back across the counter.*",
      timeoutDialogue: "*Checks a pocket watch made of teeth.* Too slow. **I'll eat somewhere in the 4th dimension.**",
      leavingMessage: "*Slams fist on counter.* Fine. **I didn't want your cursed pastries anyway.** *Vanishes in a puff of crumbs.*",
      chitchat: [
        "*Drums fingers on counter rhythmically.*",
        "Do you ever wonder what bread thinks about?",
        "*Stares at the ceiling fan like it owes money.*",
        "*Mutters something in a dead language.*",
        "The fluorescent lights here are... *almost* soothing."
      ],
      tip: 15
    })

    const systemMsg = `You are a dialogue writer for a dark-comedy late-night bakery video game. You output ONLY valid JSON with EXACTLY these fields — nothing else:

{
  "greeting": "(string) The customer's opening line when they arrive at the window. 1-2 sentences. Must mention the specific pastry names they want from the menu. Use *asterisks* for italics (actions/gestures) and **double asterisks** for bold (emphasis). Match the customer's personality.",

  "positiveReply": "(object with 'text' and 'response') The FRIENDLY player response option. 'text' is what the player says (warm, professional, enthusiastic — in double quotes). 'response' is the customer's pleased reaction to the player's friendliness (1-2 sentences, use *italic* and **bold**).",

  "negativeReply": "(object with 'text' and 'response') The RUDE/SNARKY player response option. 'text' is what the player says (rude, dismissive, annoyed — in double quotes). 'response' is the customer's annoyed/offended reaction (1-2 sentences, use *italic* and **bold**).",

  "requestedItems": "(array of 1-3 strings) EXACT pastry names copied from the menu that the customer wants. Must match the menu names character-for-character. Low-patience customers order 1 item. High-patience customers may order 2-3.",

  "positiveReaction": "(string) What the customer says when served the CORRECT pastry. 1-2 sentences. Satisfied but still in-character. Use *italic* and **bold** markdown.",

  "negativeReaction": "(string) What the customer says when served the WRONG pastry. 1-2 sentences. Angry, disappointed, or dramatic. Use *italic* and **bold** markdown.",

  "timeoutDialogue": "(string) What the customer says when they run out of patience and leave. 1-2 sentences. Frustrated departure. Use *italic* and **bold** markdown.",

  "leavingMessage": "(string) What the customer says when the player REFUSES to serve them (hits the refuse button). 1-2 sentences. Dramatic, offended departure with flair. Use *italic* and **bold** markdown.",

  "chitchat": "(array of 4-6 strings) Short idle lines muttered while the customer waits for their order. Only used if the player was friendly. Mix of actions (*leans on counter*), observations, and weird comments fitting their personality.",

  "tip": "(integer 0-50) Dollar tip amount. Only awarded if the player chose the positive/friendly reply. Generous/patient customers tip more (20-50). Impatient/rude customers tip 0-5."
}

RULES:
- Output RAW JSON only. No markdown fences, no explanation, no extra keys.
- requestedItems MUST use exact pastry names from the menu — never invent names.
- All dialogue must be short (1-2 sentences max per field).
- positiveReply.text and negativeReply.text must be clearly different tones (friendly vs rude).
- Tone: dark humor, absurdist, late-night weirdness.

EXAMPLE OUTPUT:
${exampleJson}`

    const userMsg = `Customer: ${customer.name} (Species: ${customer.species}, Patience: ${customer.patience}, Craving: ${customer.craving})
Available Menu: ${menuText}
Generate the dialogue JSON for this customer. Remember: requestedItems must be EXACT names from the menu above.`

    try {
        const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VITE_HACKCLUB_API_KEY}`
            },
            body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                    { role: 'system', content: systemMsg },
                    { role: 'user', content: userMsg }
                ]
            })
        })

        const text = await response.text()
        if (!response.ok) return res.status(502).json({ error: 'AI request failed', status: response.status, body: text.slice(0, 300) })

        let data
        try {
            data = safeJsonParse(text)
        } catch (parseErr) {
            return res.status(502).json({ error: 'AI response parse failed', details: parseErr.message, body: text.slice(0, 300) })
        }
        const content = (data.choices?.[0]?.message?.content || '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/```json?\s*/gi, '')
            .replace(/```/g, '')
            .trim()

        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : content

        let greeting = 'Evening. Got anything edible?'
        let requestedItems = [menu[0]?.name || 'house special']
        let positiveReply = { text: '"Coming right up!"', response: 'Good. *Taps counter.* Make it fast.' }
        let negativeReply = { text: '"Ugh, fine..."', response: '*Glares.* Watch the attitude, **pal**.' }
        let positiveReaction = '*Takes a bite.* Not bad. **Not bad at all.**'
        let negativeReaction = 'This is **not** what I ordered. *Are you even listening?*'
        let timeoutDialogue = '*Checks watch.* Forget it. **I have places to be.**'
        let leavingMessage = '*Scoffs.* Fine. **I didn\'t want your cursed pastries anyway.** *Storms off.*'
        let chitchat = ['*Taps counter impatiently.*', '*Stares into the void.*', '*Hums an unsettling tune.*', '*Checks phone.*']
        let tip = 0

        const menuNames = menu.map(m => m.name.toLowerCase().trim())

        try {
            const parsed = JSON.parse(jsonStr)
            if (parsed.greeting) greeting = String(parsed.greeting).trim()
            if (Array.isArray(parsed.requestedItems) && parsed.requestedItems.length > 0) {
                const raw = parsed.requestedItems.map(n => String(n).trim()).filter(Boolean).slice(0, 3)
                const validated = raw.filter(name =>
                    menuNames.includes(name.toLowerCase().trim())
                )
                if (validated.length > 0) {
                    const exactNames = validated.map(name => {
                        const idx = menuNames.indexOf(name.toLowerCase().trim())
                        return menu[idx].name
                    })
                    requestedItems = exactNames
                }
            } else if (parsed.requestedName) {
                const rn = String(parsed.requestedName).trim()
                if (menuNames.includes(rn.toLowerCase().trim())) {
                    const idx = menuNames.indexOf(rn.toLowerCase().trim())
                    requestedItems = [menu[idx].name]
                }
            }
            if (parsed.positiveReply && parsed.positiveReply.text && parsed.positiveReply.response) {
                positiveReply = {
                    text: String(parsed.positiveReply.text).trim(),
                    response: String(parsed.positiveReply.response).trim()
                }
            }
            if (parsed.negativeReply && parsed.negativeReply.text && parsed.negativeReply.response) {
                negativeReply = {
                    text: String(parsed.negativeReply.text).trim(),
                    response: String(parsed.negativeReply.response).trim()
                }
            }
            if (parsed.positiveReaction) positiveReaction = String(parsed.positiveReaction).trim()
            if (parsed.negativeReaction) negativeReaction = String(parsed.negativeReaction).trim()
            if (parsed.timeoutDialogue) timeoutDialogue = String(parsed.timeoutDialogue).trim()
            if (parsed.leavingMessage) leavingMessage = String(parsed.leavingMessage).trim()
            if (Array.isArray(parsed.chitchat) && parsed.chitchat.length > 0) {
                chitchat = parsed.chitchat.map(c => String(c).trim()).filter(Boolean)
            }
            if (parsed.tip !== undefined) tip = Math.max(0, Math.min(50, parseInt(parsed.tip, 10) || 0))
        } catch (e) {
        }

        res.status(200).json({ greeting, positiveReply, negativeReply, requestedItems, positiveReaction, negativeReaction, timeoutDialogue, leavingMessage, chitchat, tip })
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate dialogue', details: err.message })
    }
}
