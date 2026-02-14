import React, { useState, useEffect, useCallback, useRef } from 'react'

const SHOP_ITEMS = [
  {
    id: "cpu-turbo",
    name: "Overclocked 486 CPU",
    price: 500,
    desc: "Reduces generation time by 30%.",
    flavor: "Smells like burning silicon."
  },
  {
    id: "ram-stick",
    name: "4MB RAM Expansion",
    price: 300,
    desc: "Adds +1 Generation Slot (Max 3 -> 4).",
    flavor: "More memory, more problems."
  },
  {
    id: "model-v2",
    name: "Stable-Pastry v2.0",
    price: 2000,
    desc: "AI generates richer, more detailed pastry descriptions.",
    flavor: "Trained on photos of non-poisonous food."
  }
]

const CUSTOMER_NAMES = [
  "Hungry Trucker", "Inspector Vex", "Karen Prime", "Rat King", "Time Traveler",
  "Zorp the Eater", "Glorbax", "Nyx Phantom", "Chef Ramzoid", "Blobbert",
  "Captain Crumbz", "Void Mother", "Lurk", "Mx. Peculiar", "Dr. Frosting",
  "Xel'nath", "Brenda", "Fangsworth", "The Watcher", "Crispy Dave",
  "Shadow Entity", "Quantum Karen", "Grizzok", "Pastry Inspector #7", "Nebula Jane",
  "Slurpus Rex", "Officer Dough", "Yennefer of Pastries", "Old Man Jenkins", "Zuul",
  "Muffin Bandit", "Spectral Greg", "Xylarith", "Big Tony", "The Collector",
  "Madame Cr\u00e8me", "Fleeblix", "Clank", "Tartarus", "Sizzle McBurn",
  "Aether Monk", "Gertrude", "Klaxon", "Pie Fiend", "Bzzt-7",
  "Senator Crust", "Voidwalker Kim", "Torqx", "Crystal Entity", "Dimension Hopper",
  "Frostaline", "Mugwort", "Teeth Collector", "Neon Drifter", "Ambassador Glaze",
  "The Craveling", "Pixel Pete", "Oozeworth", "Hazmat Hank", "Duchess Fondant"
]

const CUSTOMER_SPECIES = [
  "Human", "Human", "Human", "Human", "Alien", "Alien", "Alien",
  "Robot", "Rodent Royalty", "Eldritch", "Temporal Anomaly", "Inspector",
  "Unknown", "Interdimensional", "Spectral", "Mutant", "Void Entity",
  "Corporate Drone", "Cryptid", "Sentient Pastry"
]

const CUSTOMER_PATIENCE = ["Very Low", "Low", "Medium", "High", "Infinite", "Ticking"]

const CUSTOMER_CRAVINGS = [
  "Anything greasy", "Perfection", "Something void-flavored", "To speak with the manager",
  "Cheese-adjacent pastries", "Retro snacks", "Eldritch confections", "Sugar overdose",
  "Something crunchy", "Radioactive goods", "Classic donuts", "Surprise me",
  "Organic nightmares", "Extra frosting", "The forbidden pastry", "Gluten-free chaos"
]

const CUSTOMER_REACTIONS = [
  "Mmm, this hits different at 3AM.",
  "Hmm... acceptable. Barely.",
  "*incomprehensible vibrations of approval*",
  "This isn't what I ordered but I'll take it.",
  "*squeaks of royal approval*",
  "In the year 3000 this is considered art.",
  "My taste receptors are... confused but satisfied.",
  "I'll give you 3 stars. Out of 5000.",
  "The void appreciates your offering.",
  "Not poisonous! A pleasant surprise.",
  "My circuits detect adequate flavor.",
  "You call this food? ...I love it.",
  "*phases through the pastry, absorbs nutrients*",
  "Chef's kiss. And by chef I mean a war criminal.",
  "Finally, someone who understands chaos baking."
]

const CUSTOMER_REFUSALS = [
  "Fine. I'll go to Waffle House.",
  "You WILL be hearing from the health board.",
  "*phases through the wall*",
  "I'm leaving a 1-star review.",
  "My subjects will remember this slight.",
  "I'll just come back yesterday.",
  "*emits a frequency that cracks a glass*",
  "The Yelp review will be legendary.",
  "You haven't seen the last of me. Literally. I'm invisible.",
  "I didn't want your pastries anyway. *sobs quietly*"
]

function generateCustomer() {
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
  const species = CUSTOMER_SPECIES[Math.floor(Math.random() * CUSTOMER_SPECIES.length)]
  const patience = CUSTOMER_PATIENCE[Math.floor(Math.random() * CUSTOMER_PATIENCE.length)]
  const craving = CUSTOMER_CRAVINGS[Math.floor(Math.random() * CUSTOMER_CRAVINGS.length)]
  const reaction = CUSTOMER_REACTIONS[Math.floor(Math.random() * CUSTOMER_REACTIONS.length)]
  const refusal = CUSTOMER_REFUSALS[Math.floor(Math.random() * CUSTOMER_REFUSALS.length)]
  const colorAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
  const bwAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
  return { name, species, patience, craving, reaction, refusal, colorAvatar, bwAvatar }
}

export default function CockpitScene() {
  const [zoomTarget, setZoomTarget] = useState(null)
  const [bellAnimating, setBellAnimating] = useState(false)
  const [clockTime, setClockTime] = useState(new Date())
  const [terminalLines, setTerminalLines] = useState([])
  const [terminalInput, setTerminalInput] = useState('')
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [money, setMoney] = useState(1000)
  const [ownedItems, setOwnedItems] = useState(new Set())
  const [genSlots, setGenSlots] = useState([
    { prompt: '', progress: 0, status: 'empty', name: '', description: '' },
    { prompt: '', progress: 0, status: 'empty', name: '', description: '' },
    { prompt: '', progress: 0, status: 'empty', name: '', description: '' }
  ])
  const [maxSlots, setMaxSlots] = useState(3)
  const [currentCustomer, setCurrentCustomer] = useState(null)
  const [inputLocked, setInputLocked] = useState(false)
  const [serveResult, setServeResult] = useState(null)
  const [registerScreen, setRegisterScreen] = useState('main')
  const bellTimeoutRef = useRef(null)
  const bellAudioRef = useRef(null)
  const pcAmbientRef = useRef(null)
  const cassetteTapeRef = useRef(null)
  const terminalEndRef = useRef(null)
  const terminalInputRef = useRef(null)
  const genIntervalsRef = useRef([])
  const buyAnimRef = useRef(null)
  const serveTimerRef = useRef(null)

  useEffect(() => {
    bellAudioRef.current = new Audio('/audio/bell-ring.mp3')
    pcAmbientRef.current = new Audio('/audio/pc-ambient.mp3')
    pcAmbientRef.current.loop = true
    cassetteTapeRef.current = new Audio('/audio/cassette-insert.mp3')
    return () => {
      if (bellAudioRef.current) bellAudioRef.current.pause()
      if (pcAmbientRef.current) pcAmbientRef.current.pause()
      if (cassetteTapeRef.current) cassetteTapeRef.current.pause()
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current)
      if (serveTimerRef.current) clearTimeout(serveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (zoomTarget === 'computer' && cassetteTapeRef.current && pcAmbientRef.current) {
      const cassette = cassetteTapeRef.current
      const ambient = pcAmbientRef.current

      cassette.volume = 1
      cassette.currentTime = 0
      cassette.play().catch(() => {})

      ambient.volume = 0
      ambient.currentTime = 0

      const handleCrossfade = () => {
        const timeLeft = cassette.duration - cassette.currentTime
        if (timeLeft <= 0.5 && ambient.paused) {
          ambient.play().catch(() => {})
          let cassetteVol = 1
          let ambientVol = 0
          const crossfade = setInterval(() => {
            cassetteVol -= 0.1
            ambientVol += 0.1
            if (cassetteVol <= 0) {
              cassette.volume = 0
              cassette.pause()
              clearInterval(crossfade)
            } else {
              cassette.volume = cassetteVol
            }
            if (ambientVol >= 1) {
              ambient.volume = 1
            } else {
              ambient.volume = ambientVol
            }
          }, 50)
        }
      }

      const checkInterval = setInterval(handleCrossfade, 50)

      return () => {
        clearInterval(checkInterval)
        cassette.pause()
      }
    } else if (pcAmbientRef.current && !pcAmbientRef.current.paused) {
      const audio = pcAmbientRef.current
      let vol = audio.volume
      const fadeOut = setInterval(() => {
        vol -= 0.05
        if (vol <= 0) {
          vol = 0
          audio.volume = vol
          audio.pause()
          clearInterval(fadeOut)
        } else {
          audio.volume = vol
        }
      }, 30)
      return () => clearInterval(fadeOut)
    }
  }, [zoomTarget])

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLines])

  useEffect(() => {
    if (zoomTarget === 'computer' && terminalInputRef.current) {
      setTimeout(() => {
        if (terminalInputRef.current) terminalInputRef.current.focus()
      }, 400)
    }
  }, [zoomTarget])

  useEffect(() => {
    return () => {
      genIntervalsRef.current.forEach(id => clearInterval(id))
      if (buyAnimRef.current) clearTimeout(buyAnimRef.current)
    }
  }, [])

  const ringBell = useCallback(() => {
    setBellAnimating(true)
    if (bellAudioRef.current) {
      bellAudioRef.current.currentTime = 1.9
      bellAudioRef.current.play().catch(() => {})
    }
    if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current)
    bellTimeoutRef.current = setTimeout(() => setBellAnimating(false), 600)
  }, [])

  const pushLines = useCallback((lines) => {
    setTerminalLines(prev => [...prev, ...lines.map(l => (typeof l === 'string' ? { text: l, type: 'output' } : l))])
  }, [])

  const pushError = useCallback((text) => {
    setTerminalLines(prev => [...prev, { text, type: 'error' }])
  }, [])

  const pushSystem = useCallback((text) => {
    setTerminalLines(prev => [...prev, { text, type: 'system' }])
  }, [])

  const pushInput = useCallback((text) => {
    setTerminalLines(prev => [...prev, { text: `> ${text}`, type: 'input' }])
  }, [])

  const animateProgressBar = useCallback((onComplete) => {
    setInputLocked(true)
    let step = 0
    const total = 10
    const animate = () => {
      const filled = '#'.repeat(step)
      const empty = '.'.repeat(total - step)
      setTerminalLines(prev => {
        const next = [...prev]
        const lastIdx = next.length - 1
        if (lastIdx >= 0 && next[lastIdx].type === 'progress') {
          next[lastIdx] = { text: `  [${filled}${empty}] ${step * 10}%`, type: 'progress' }
        } else {
          next.push({ text: `  [${filled}${empty}] ${step * 10}%`, type: 'progress' })
        }
        return next
      })
      step++
      if (step <= total) {
        buyAnimRef.current = setTimeout(animate, 120)
      } else {
        setInputLocked(false)
        if (onComplete) onComplete()
      }
    }
    animate()
  }, [])

  const generateWithAI = useCallback(async (slotIndex, prompt) => {
    const hasTurbo = ownedItems.has('cpu-turbo')
    const baseTime = hasTurbo ? 7000 : 10000
    const intervalMs = 200
    const maxFake = 85
    const tick = maxFake / (baseTime / intervalMs)

    const intervalId = setInterval(() => {
      setGenSlots(prev => {
        const next = [...prev]
        if (next[slotIndex] && next[slotIndex].status === 'cooking' && next[slotIndex].progress < maxFake) {
          next[slotIndex] = { ...next[slotIndex], progress: Math.min(maxFake, next[slotIndex].progress + tick) }
        }
        return next
      })
    }, intervalMs)

    genIntervalsRef.current.push(intervalId)

    let name = 'Mystery Pastry'
    let description = 'The AI had a meltdown. This is what came out.'

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.name) name = data.name
        if (data.description) description = data.description
      }
    } catch (e) {
    }

    clearInterval(intervalId)

    setGenSlots(prev => {
      const next = [...prev]
      if (next[slotIndex]) {
        next[slotIndex] = { ...next[slotIndex], name, description, progress: 100, status: 'ready' }
      }
      return next
    })

    pushSystem(`  \u2713 Slot ${slotIndex + 1}: "${name}" is READY.`)
  }, [ownedItems, pushSystem])

  const handleCommand = useCallback((raw) => {
    const input = raw.trim()
    if (!input) return

    pushInput(input)
    setCommandHistory(prev => [...prev, input])
    setHistoryIndex(-1)

    const parts = input.toLowerCase().split(/\s+/)
    const cmd = parts[0]

    if (cmd === 'help') {
      pushLines([
        '',
        '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557',
        '\u2551         AtelierOS v1.0 \u2014 HELP            \u2551',
        '\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563',
        '\u2551  SHOP COMMANDS:                          \u2551',
        '\u2551    shop list       \u2014 View upgrades       \u2551',
        '\u2551    shop buy <id>   \u2014 Purchase upgrade    \u2551',
        '\u2551    shop info <id>  \u2014 Item details        \u2551',
        '\u2551                                          \u2551',
        '\u2551  GENERATION COMMANDS:                    \u2551',
        '\u2551    gen new "<prompt>" \u2014 Create pastry    \u2551',
        '\u2551    gen list         \u2014 View all slots     \u2551',
        '\u2551    gen view <slot>  \u2014 Preview ready item \u2551',
        '\u2551    gen trash <slot> \u2014 Delete slot item   \u2551',
        '\u2551                                          \u2551',
        '\u2551  OTHER:                                  \u2551',
        '\u2551    balance         \u2014 Check funds         \u2551',
        '\u2551    clear           \u2014 Clear terminal      \u2551',
        '\u2551                                          \u2551',
        '\u2551  NOTE: Use the REGISTER to serve         \u2551',
        '\u2551  customers, refuse, or scan.             \u2551',
        '\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d',
        ''
      ])
      return
    }

    if (cmd === 'clear') {
      setTerminalLines([])
      return
    }

    if (cmd === 'balance') {
      pushLines(['', `  BALANCE: $${money.toFixed(2)}`, ''])
      return
    }

    if (cmd === 'shop') {
      const sub = parts[1]

      if (sub === 'list') {
        pushLines([
          '',
          '\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510',
          '\u2502 ID           \u2502 NAME                     \u2502 PRICE  \u2502 STATUS    \u2502',
          '\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524'
        ])
        SHOP_ITEMS.forEach(item => {
          const status = ownedItems.has(item.id) ? 'OWNED' : 'AVAILABLE'
          const id = item.id.padEnd(12)
          const name = item.name.padEnd(24)
          const price = ('$' + item.price).padEnd(6)
          const stat = status.padEnd(9)
          pushLines([`\u2502 ${id} \u2502 ${name} \u2502 ${price} \u2502 ${stat} \u2502`])
        })
        pushLines([
          '\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518',
          `  Your balance: $${money.toFixed(2)}`,
          ''
        ])
        return
      }

      if (sub === 'buy') {
        const itemId = parts[2]
        if (!itemId) {
          pushError('  ERROR: Usage: shop buy <item_id>')
          return
        }
        const item = SHOP_ITEMS.find(i => i.id === itemId)
        if (!item) {
          pushError(`  ERROR: Unknown item "${itemId}". Use 'shop list' to see items.`)
          return
        }
        if (ownedItems.has(item.id)) {
          pushError(`  ERROR: You already own "${item.name}".`)
          return
        }
        if (money < item.price) {
          pushError(`  ERROR: Insufficient funds. Need $${item.price}, have $${money.toFixed(2)}.`)
          return
        }

        pushSystem(`  Installing ${item.name}...`)
        animateProgressBar(() => {
          setMoney(prev => prev - item.price)
          setOwnedItems(prev => {
            const next = new Set(prev)
            next.add(item.id)
            return next
          })
          if (item.id === 'ram-stick') {
            setMaxSlots(4)
            setGenSlots(prev => [...prev, { prompt: '', progress: 0, status: 'empty', name: '', description: '' }])
          }
          pushSystem(`  \u2713 ${item.name} installed successfully.`)
          pushLines([`  Remaining balance: $${(money - item.price).toFixed(2)}`, ''])
        })
        return
      }

      if (sub === 'info') {
        const itemId = parts[2]
        if (!itemId) {
          pushError('  ERROR: Usage: shop info <item_id>')
          return
        }
        const item = SHOP_ITEMS.find(i => i.id === itemId)
        if (!item) {
          pushError(`  ERROR: Unknown item "${itemId}".`)
          return
        }
        pushLines([
          '',
          `  \u250c\u2500 ${item.name} [$${item.price}]`,
          `  \u2502`,
          `  \u2502  ${item.desc}`,
          `  \u2502`,
          `  \u2502  "${item.flavor}"`,
          `  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
          ''
        ])
        return
      }

      pushError("  ERROR: Unknown shop command. Use 'help' for usage.")
      return
    }

    if (cmd === 'gen') {
      const sub = parts[1]

      if (sub === 'new') {
        const promptMatch = raw.match(/gen\s+new\s+["'](.+?)["']/i)
        if (!promptMatch) {
          pushError('  ERROR: Usage: gen new "<prompt>"')
          return
        }
        const prompt = promptMatch[1]
        const emptyIdx = genSlots.findIndex(s => s.status === 'empty')
        if (emptyIdx === -1) {
          pushError('  ERROR: No empty generation slots. Use gen trash <slot> to free one.')
          return
        }

        const newSlots = [...genSlots]
        newSlots[emptyIdx] = { prompt, progress: 0, status: 'cooking', name: 'Generating...', description: '' }
        setGenSlots(newSlots)
        generateWithAI(emptyIdx, prompt)
        pushSystem(`  Querying AI core for Slot ${emptyIdx + 1}...`)
        pushLines([`  Prompt: "${prompt}"`, ''])
        return
      }

      if (sub === 'list') {
        pushLines(['', '  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'])
        genSlots.forEach((slot, i) => {
          if (i >= maxSlots) return
          const barLen = 20
          if (slot.status === 'empty') {
            const bar = '.'.repeat(barLen)
            pushLines([`  SLOT ${i + 1}: [${bar}]   0% - [EMPTY]`])
          } else if (slot.status === 'cooking') {
            const pct = Math.floor(slot.progress)
            const filled = Math.round((pct / 100) * barLen)
            const bar = '#'.repeat(filled) + '.'.repeat(barLen - filled)
            pushLines([`  SLOT ${i + 1}: [${bar}] ${String(pct).padStart(3)}% - "${slot.name}" [COOKING]`])
          } else if (slot.status === 'ready') {
            const done = !!slot.description
            const bar = done ? '#'.repeat(barLen) : '#'.repeat(Math.round((slot.progress / 100) * barLen)) + '.'.repeat(barLen - Math.round((slot.progress / 100) * barLen))
            const label = done ? 'READY' : 'COOKING'
            pushLines([`  SLOT ${i + 1}: [${bar}] ${done ? '100' : String(Math.floor(slot.progress)).padStart(3)}% - "${slot.name}" [${label}]`])
          }
        })
        pushLines(['  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', ''])
        return
      }

      if (sub === 'view') {
        const slotNum = parseInt(parts[2])
        if (!slotNum || slotNum < 1 || slotNum > maxSlots) {
          pushError(`  ERROR: Usage: gen view <1-${maxSlots}>`)
          return
        }
        const slot = genSlots[slotNum - 1]
        if (slot.status === 'empty') {
          pushError(`  ERROR: Slot ${slotNum} is empty.`)
          return
        }
        if (slot.status === 'cooking') {
          pushError(`  ERROR: Slot ${slotNum} is still cooking (${Math.floor(slot.progress)}%).`)
          return
        }

        pushLines([
          '',
          `  \u2550\u2550\u2550 "${slot.name}" \u2550\u2550\u2550`,
          `  Prompt: "${slot.prompt}"`,
          '',
          `  ${slot.description}`,
          '',
          '  Status: READY TO SERVE',
          ''
        ])
        return
      }

      if (sub === 'trash') {
        const slotNum = parseInt(parts[2])
        if (!slotNum || slotNum < 1 || slotNum > maxSlots) {
          pushError(`  ERROR: Usage: gen trash <1-${maxSlots}>`)
          return
        }
        const slot = genSlots[slotNum - 1]
        if (slot.status === 'empty') {
          pushError(`  ERROR: Slot ${slotNum} is already empty.`)
          return
        }
        const name = slot.name
        const newSlots = [...genSlots]
        newSlots[slotNum - 1] = { prompt: '', progress: 0, status: 'empty', name: '', description: '' }
        setGenSlots(newSlots)
        pushSystem(`  Slot ${slotNum} cleared. "${name}" has been discarded.`)
        pushLines([''])
        return
      }

      pushError("  ERROR: Unknown gen command. Use 'help' for usage.")
      return
    }

    if (cmd === 'serve' || cmd === 'refuse' || cmd === 'scan') {
      pushError("  ERROR: Service commands moved to the REGISTER.")
      pushLines(["  Click the POS device on the right wall to serve, refuse, or scan."])
      return
    }

    pushError(`  ERROR: Unknown command "${cmd}". Type 'help' for a list of commands.`)
  }, [money, ownedItems, genSlots, maxSlots, pushLines, pushError, pushSystem, pushInput, animateProgressBar, generateWithAI])

  const handleTerminalKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !inputLocked) {
      handleCommand(terminalInput)
      setTerminalInput('')
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIdx)
        setTerminalInput(commandHistory[newIdx])
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex === -1) return
      const newIdx = historyIndex + 1
      if (newIdx >= commandHistory.length) {
        setHistoryIndex(-1)
        setTerminalInput('')
      } else {
        setHistoryIndex(newIdx)
        setTerminalInput(commandHistory[newIdx])
      }
    }
  }, [terminalInput, inputLocked, handleCommand, commandHistory, historyIndex])

  const handleBellClick = useCallback(() => {
    if (bellAnimating) return
    ringBell()
    if (!currentCustomer) {
      setCurrentCustomer(generateCustomer())
    }
  }, [bellAnimating, currentCustomer, ringBell])

  const handleServe = useCallback((slotNum) => {
    const slot = genSlots[slotNum - 1]
    if (!slot || slot.status !== 'ready') return
    if (!currentCustomer) return

    ringBell()

    const name = slot.name
    const earnings = Math.floor(Math.random() * 300) + 100
    setMoney(prev => prev + earnings)
    const newSlots = [...genSlots]
    newSlots[slotNum - 1] = { prompt: '', progress: 0, status: 'empty', name: '', description: '' }
    setGenSlots(newSlots)
    setServeResult({
      pastryName: name,
      customerName: currentCustomer.name,
      reaction: currentCustomer.reaction,
      earnings
    })
    setCurrentCustomer(null)
    setRegisterScreen('main')
    if (serveTimerRef.current) clearTimeout(serveTimerRef.current)
    serveTimerRef.current = setTimeout(() => setServeResult(null), 5000)
  }, [genSlots, currentCustomer, ringBell])

  const handleRefuse = useCallback(() => {
    if (!currentCustomer) return
    setServeResult({
      pastryName: null,
      customerName: currentCustomer.name,
      reaction: currentCustomer.refusal,
      earnings: 0
    })
    setCurrentCustomer(null)
    setRegisterScreen('main')
    if (serveTimerRef.current) clearTimeout(serveTimerRef.current)
    serveTimerRef.current = setTimeout(() => setServeResult(null), 4000)
  }, [currentCustomer])

  const handleComputerClick = useCallback(() => {
    setZoomTarget('computer')
    setTerminalLines(prev => {
      if (prev.length === 0) {
        return [
          { text: 'Welcome to AtelierOS v1.0', type: 'system' },
          { text: "Type 'help' for a list of commands.", type: 'system' },
          { text: '', type: 'output' }
        ]
      }
      return prev
    })
    setTerminalInput('')
    setHistoryIndex(-1)
  }, [])

  const handleClockClick = useCallback(() => {
    setZoomTarget('clock')
  }, [])

  const handlePosClick = useCallback(() => {
    setZoomTarget('pos')
  }, [])

  const closeZoom = useCallback(() => {
    setZoomTarget(null)
  }, [])

  const hours = clockTime.getHours() % 12
  const minutes = clockTime.getMinutes()
  const seconds = clockTime.getSeconds()
  const hourDeg = (hours * 30) + (minutes * 0.5)
  const minuteDeg = minutes * 6
  const secondDeg = seconds * 6

  const formatTime = (date) => {
    let h = date.getHours()
    const m = date.getMinutes().toString().padStart(2, '0')
    const s = date.getSeconds().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m}:${s} ${ampm}`
  }

  const readySlots = genSlots.map((s, i) => ({ ...s, index: i + 1 })).filter(s => s.status === 'ready' && s.description)

  return (
    <div className="cockpit">
      <div className="ceiling">
        <div className="ceiling-panels">
          <div className="ceiling-panel"></div>
          <div className="ceiling-panel"></div>
          <div className="ceiling-panel"></div>
          <div className="ceiling-panel"></div>
          <div className="ceiling-panel"></div>
          <div className="ceiling-panel"></div>
        </div>
        <div className="fluorescent-light">
          <div className="light-fixture">
            <div className="light-tube flickering"></div>
            <div className="light-tube flickering f2"></div>
          </div>
          <div className="light-glow"></div>
        </div>
        <div className="exposed-pipe pipe-1"></div>
        <div className="exposed-pipe pipe-2"></div>
        <div className="exposed-pipe pipe-3"></div>
        <div className="ceiling-vent">
          <div className="vent-slat"></div>
          <div className="vent-slat"></div>
          <div className="vent-slat"></div>
          <div className="vent-slat"></div>
        </div>
      </div>

      <div className="back-wall">
        <div className="tile-grid"></div>

        <div className="left-section">
          <div className="metal-shelf">
            <div className="shelf-bracket left"></div>
            <div className="shelf-bracket right"></div>
            <div className="shelf-surface">
              <div className="jar jar-green"></div>
              <div className="jar jar-amber"></div>
              <div className="jar jar-red"></div>
            </div>
          </div>
          <div className="metal-shelf lower">
            <div className="shelf-bracket left"></div>
            <div className="shelf-bracket right"></div>
            <div className="shelf-surface">
              <div className="tin-can"></div>
              <div className="tin-can"></div>
              <div className="bottle"></div>
            </div>
          </div>
          <div className="crt-monitor" onClick={handleComputerClick}>
            <div className="crt-body">
              <div className="crt-screen">
                <div className="crt-scanlines"></div>
                <div className="crt-glitch-bar"></div>
                <div className="crt-text-line l1">{'>'} SYSTEM ONLINE</div>
                <div className="crt-text-line l2">{'>'} WAITING FOR INPUT...</div>
              </div>
              <div className="crt-bezel-bottom">
                <div className="crt-led"></div>
              </div>
            </div>
            <div className="crt-stand"></div>
          </div>
        </div>

        <div className="center-section">
          <div className="serving-hatch">
            <div className="hatch-frame">
              <div className="hatch-track-top"></div>
              <div className="hatch-window">
                <div className="outside-darkness">
                  <div className="distant-streetlight"></div>
                  <div className="distant-streetlight s2"></div>
                  <div className="neon-glow"></div>
                  <div className="neon-glow n2"></div>
                  <div className="rain-streak"></div>
                  <div className="rain-streak r2"></div>
                  <div className="rain-streak r3"></div>
                  <div className="rain-streak r4"></div>
                  <div className="rain-streak r5"></div>
                  {currentCustomer && (
                    <div className="customer-at-window">
                      <div className="customer-name-tag">{currentCustomer.name}</div>
                      <img
                        className="customer-avatar-bw"
                        src={currentCustomer.bwAvatar}
                        alt={currentCustomer.name}
                        draggable={false}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="hatch-sill"></div>
            </div>
            <div
              className={`order-bell ${bellAnimating ? 'ringing' : ''}`}
              onClick={handleBellClick}
            >
              <div className="bell-top-knob"></div>
              <div className="bell-dome"></div>
              <div className="bell-base"></div>
            </div>
          </div>
        </div>

        <div className="wall-clock" onClick={handleClockClick}>
          <div className="clock-face">
            <div className="clock-tick t12"></div>
            <div className="clock-tick t3"></div>
            <div className="clock-tick t6"></div>
            <div className="clock-tick t9"></div>
            <div
              className="clock-hand hour"
              style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
            ></div>
            <div
              className="clock-hand minute"
              style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
            ></div>
            <div
              className="clock-hand second"
              style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
            ></div>
            <div className="clock-center-dot"></div>
          </div>
        </div>

        <div className="right-section">
          <div className="pos-device" onClick={handlePosClick}>
            <div className="pos-screen">
              <div className="pos-header">
                <div className="pos-header-dot"></div>
                <div className="pos-header-title">REGISTER</div>
                <div className="pos-header-time">{clockTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
              </div>
              <div className="pos-body">
                <div className="pos-total-area">
                  <div className="pos-total-label">TOTAL</div>
                  <div className="pos-total-amount">${money.toFixed(2)}</div>
                </div>
                <div className="pos-items-area">
                  <div className="pos-item-row">{currentCustomer ? currentCustomer.name : 'No customer'}</div>
                </div>
                <div className="pos-buttons">
                  <div className="pos-btn pos-btn-orange">SERVE</div>
                  <div className="pos-btn pos-btn-red">REFUSE</div>
                </div>
              </div>
            </div>
            <div className="pos-stand"></div>
          </div>
        </div>
      </div>

      <div className="counter-area">
        <div className="counter-top">
          <div className="counter-surface-texture"></div>
        </div>
        <div className="counter-front">
          <div className="counter-front-panel"></div>
          <div className="counter-drawer">
            <div className="drawer-handle"></div>
          </div>
          <div className="counter-drawer d2">
            <div className="drawer-handle"></div>
          </div>
        </div>
      </div>

      <div className="floor-strip">
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
        <div className="floor-tile"></div>
        <div className="floor-tile dark"></div>
      </div>

      <div className="ambient-light"></div>
      <div className="oven-ambient"></div>
      <div className="vignette"></div>

      {zoomTarget && (
        <div className="zoom-overlay" onClick={closeZoom}>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            {zoomTarget === 'computer' && (
              <div className="zoomed-computer">
                <div className="zoomed-crt-frame">
                  <button className="zoomed-close-x" onClick={closeZoom}>{'\u00d7'}</button>
                  <div className="zoomed-crt-screen terminal-screen" onClick={() => terminalInputRef.current && terminalInputRef.current.focus()}>
                    <div className="zoomed-scanlines"></div>
                    <div className="terminal-output">
                      {terminalLines.map((line, i) => (
                        <div key={i} className={`terminal-line ${line.type}`}>
                          <pre>{line.text}</pre>
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                    <div className="terminal-input-row">
                      <span className="terminal-prompt">{'>'}</span>
                      <input
                        ref={terminalInputRef}
                        className="terminal-input"
                        type="text"
                        value={terminalInput}
                        onChange={e => setTerminalInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        disabled={inputLocked}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                      />
                    </div>
                  </div>
                  <div className="zoomed-crt-bezel">
                    <div className="zoomed-crt-led"></div>
                    <span className="zoomed-crt-label">ATELIER-PC</span>
                    <span className="terminal-balance">${money.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {zoomTarget === 'clock' && (
              <div className="zoomed-clock">
                <div className="zoomed-clock-face">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="zoomed-clock-number"
                      style={{
                        transform: `rotate(${(i + 1) * 30}deg) translateY(-120px) rotate(-${(i + 1) * 30}deg)`
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={`m${i}`}
                      className={`zoomed-minute-tick ${i % 5 === 0 ? 'major' : ''}`}
                      style={{ transform: `rotate(${i * 6}deg)` }}
                    ></div>
                  ))}
                  <div
                    className="zoomed-hand hour"
                    style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
                  ></div>
                  <div
                    className="zoomed-hand minute"
                    style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
                  ></div>
                  <div
                    className="zoomed-hand second"
                    style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
                  ></div>
                  <div className="zoomed-clock-center"></div>
                </div>
                <div className="zoomed-clock-digital">{formatTime(clockTime)}</div>
                <button className="zoom-close-btn" onClick={closeZoom}>ESC</button>
              </div>
            )}

            {zoomTarget === 'pos' && (
              <div className="zoomed-pos">
                <div className="zoomed-pos-screen">
                  <div className="zoomed-pos-header">
                    <div className="zoomed-pos-header-dot"></div>
                    <div className="zoomed-pos-title">REGISTER</div>
                    <div className="zoomed-pos-header-right">
                      <div className="zoomed-pos-time">{clockTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</div>
                      <button className="zoomed-pos-close" onClick={closeZoom}>{'\u00d7'}</button>
                    </div>
                  </div>
                  <div className="zoomed-pos-body">
                    <div className="zoomed-pos-total">
                      <span className="zoomed-pos-total-label">TOTAL</span>
                      <span className="zoomed-pos-total-amount">${money.toFixed(2)}</span>
                    </div>

                    {registerScreen === 'main' && (
                      <>
                        <div className="zoomed-pos-items">
                          {currentCustomer ? (
                            <div className="register-customer-card">
                              <img
                                className="register-customer-avatar"
                                src={currentCustomer.colorAvatar}
                                alt={currentCustomer.name}
                                draggable={false}
                              />
                              <div className="register-customer-details">
                                <div className="register-customer-name">{currentCustomer.name}</div>
                                <div className="register-customer-waiting">Waiting at window...</div>
                                <div className="register-scan-results">
                                  <div className="register-scan-row"><span className="scan-label">Species:</span> <span className="scan-value">{currentCustomer.species}</span></div>
                                  <div className="register-scan-row"><span className="scan-label">Patience:</span> <span className="scan-value">{currentCustomer.patience}</span></div>
                                  <div className="register-scan-row"><span className="scan-label">Craving:</span> <span className="scan-value">{currentCustomer.craving}</span></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="register-no-customer">
                              {serveResult ? (
                                <div className="register-serve-result">
                                  {serveResult.earnings > 0 ? (
                                    <>
                                      <div className="serve-result-icon">{'\u2605'}</div>
                                      <div className="serve-result-text">Served "{serveResult.pastryName}" to {serveResult.customerName}</div>
                                      <div className="serve-result-reaction">"{serveResult.reaction}"</div>
                                      <div className="serve-result-earnings">+${serveResult.earnings}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="serve-result-icon refuse">{'\u2716'}</div>
                                      <div className="serve-result-text">Dismissed {serveResult.customerName}</div>
                                      <div className="serve-result-reaction">"{serveResult.reaction}"</div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="register-empty-msg">No customer at window. Ring the bell.</div>
                              )}
                            </div>
                          )}
                        </div>

                        {currentCustomer && (
                          <div className="zoomed-pos-buttons">
                            <div className="zoomed-pos-btn zp-orange" onClick={() => setRegisterScreen('serve')}>SERVE</div>
                            <div className="zoomed-pos-btn zp-red" onClick={handleRefuse}>REFUSE</div>
                          </div>
                        )}
                      </>
                    )}

                    {registerScreen === 'serve' && (
                      <>
                        <div className="zoomed-pos-items">
                          {readySlots.length > 0 ? (
                            <div className="register-serve-slots">
                              {readySlots.map(slot => (
                                <div
                                  key={slot.index}
                                  className="register-serve-slot-btn"
                                  onClick={() => handleServe(slot.index)}
                                >
                                  <span className="serve-slot-num">SLOT {slot.index}</span>
                                  <span className="serve-slot-name">"{slot.name}"</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="register-no-customer">
                              <div className="register-empty-msg">No pastries available.</div>
                            </div>
                          )}
                        </div>
                        <div className="zoomed-pos-btn zp-gray" onClick={() => setRegisterScreen('main')}>BACK</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
