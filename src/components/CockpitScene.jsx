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

const PATIENCE_SECONDS = {
  'Very Low': 45,
  'Low': 75,
  'Medium': 120,
  'High': 180,
  'Infinite': 600,
  'Ticking': 30
}

function renderMarkdown(text) {
  if (!text) return text
  const parts = []
  let remaining = String(text)
  let key = 0
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index))
    }
    if (match[2]) {
      parts.push(React.createElement('strong', { key: key++ }, match[2]))
    } else if (match[3]) {
      parts.push(React.createElement('em', { key: key++ }, match[3]))
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex))
  }
  return parts.length > 0 ? parts : text
}

function generateCustomer() {
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]
  const species = CUSTOMER_SPECIES[Math.floor(Math.random() * CUSTOMER_SPECIES.length)]
  const patience = CUSTOMER_PATIENCE[Math.floor(Math.random() * CUSTOMER_PATIENCE.length)]
  const craving = CUSTOMER_CRAVINGS[Math.floor(Math.random() * CUSTOMER_CRAVINGS.length)]
  const avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}`
  return { name, species, patience, craving, avatar }
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
    { prompt: '', progress: 0, status: 'empty', name: '', description: '', price: 0, bakeTime: 30 },
    { prompt: '', progress: 0, status: 'empty', name: '', description: '', price: 0, bakeTime: 30 },
    { prompt: '', progress: 0, status: 'empty', name: '', description: '', price: 0, bakeTime: 30 }
  ])
  const [maxSlots, setMaxSlots] = useState(3)
  const [bakeSlots, setBakeSlots] = useState(Array.from({ length: 10 }, () => ({ status: 'empty', name: '', price: 0, progress: 0, bakeTime: 30 })))
  const maxBakeSlots = 10
  const [currentCustomer, setCurrentCustomer] = useState(null)
  const [inputLocked, setInputLocked] = useState(false)
  const [registerScreen, setRegisterScreen] = useState('main')
  const [registerDialogue, setRegisterDialogue] = useState(null)
  const [bellNotice, setBellNotice] = useState(null)
  const [bellNoticeLeaving, setBellNoticeLeaving] = useState(false)
  const [dialogueLeaving, setDialogueLeaving] = useState(false)
  const [servedItems, setServedItems] = useState([])
  const [patienceRemaining, setPatienceRemaining] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const bellTimeoutRef = useRef(null)
  const noticeTimeoutRef = useRef(null)
  const bellAudioRef = useRef(null)
  const pcAmbientRef = useRef(null)
  const cassetteTapeRef = useRef(null)
  const terminalEndRef = useRef(null)
  const terminalInputRef = useRef(null)
  const genIntervalsRef = useRef([])
  const bakeIntervalsRef = useRef([])
  const buyAnimRef = useRef(null)
  const patienceIntervalRef = useRef(null)
  const currentCustomerRef = useRef(null)
  const servedItemsRef = useRef([])
  const chitchatIndexRef = useRef(0)
  const dialogueTimeoutRef = useRef(null)

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
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
      if (patienceIntervalRef.current) clearInterval(patienceIntervalRef.current)
    }
  }, [])

  useEffect(() => { currentCustomerRef.current = currentCustomer }, [currentCustomer])
  useEffect(() => { servedItemsRef.current = servedItems }, [servedItems])

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
      bakeIntervalsRef.current.forEach(id => clearInterval(id))
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

  const dismissBellNotice = useCallback(() => {
    setBellNoticeLeaving(true)
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    noticeTimeoutRef.current = setTimeout(() => {
      setBellNotice(null)
      setBellNoticeLeaving(false)
    }, 400)
  }, [])

  const showBellNotice = useCallback((notice) => {
    setBellNoticeLeaving(false)
    setBellNotice(notice)
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    noticeTimeoutRef.current = setTimeout(() => dismissBellNotice(), 3000)
  }, [dismissBellNotice])

  const startPatienceTimer = useCallback((seconds) => {
    if (patienceIntervalRef.current) clearInterval(patienceIntervalRef.current)
    setPatienceRemaining(seconds)
    patienceIntervalRef.current = setInterval(() => {
      setPatienceRemaining(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(patienceIntervalRef.current)
          patienceIntervalRef.current = null
          return 0
        }
        return prev !== null ? prev - 1 : null
      })
    }, 1000)
  }, [])

  const stopPatienceTimer = useCallback(() => {
    if (patienceIntervalRef.current) {
      clearInterval(patienceIntervalRef.current)
      patienceIntervalRef.current = null
    }
    setPatienceRemaining(null)
  }, [])

  const dismissDialogue = useCallback(() => {
    setDialogueLeaving(true)
    if (dialogueTimeoutRef.current) clearTimeout(dialogueTimeoutRef.current)
    dialogueTimeoutRef.current = setTimeout(() => {
      setRegisterDialogue(null)
      setDialogueLeaving(false)
    }, 350)
  }, [])

  useEffect(() => {
    if (patienceRemaining === 0) {
      const customer = currentCustomerRef.current
      if (!customer) return
      const currentServed = [...servedItemsRef.current]
      const requestedItems = customer.requestedItems || []
      const subtotal = currentServed.reduce((sum, item) => sum + item.price, 0)
      setRegisterDialogue({
        name: customer.name,
        tag: 'LEAVING',
        text: customer.timeoutDialogue || '*Walks away into the rain.*',
        options: []
      })
      setReceipt({
        customerName: customer.name,
        items: currentServed,
        requestedItems,
        subtotal,
        tip: 0,
        total: subtotal,
        status: 'timeout'
      })
      setCurrentCustomer(null)
      setRegisterScreen('receipt')
      setServedItems([])
    }
  }, [patienceRemaining])

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
    let price = 120
    let bakeTime = 30

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
        if (data.price) price = data.price
        if (data.bakeTime) bakeTime = data.bakeTime
      }
    } catch (e) {
    }

    clearInterval(intervalId)

    setGenSlots(prev => {
      const next = [...prev]
      if (next[slotIndex]) {
        next[slotIndex] = { ...next[slotIndex], name, description, price, bakeTime, progress: 100, status: 'ready' }
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
        '\u2551  BAKE COMMANDS:                          \u2551',
        '\u2551    bake <slot>     \u2014 Bake a gen slot    \u2551',
        '\u2551    bake list       \u2014 View oven slots    \u2551',
        '\u2551    bake trash <n>  \u2014 Clear oven slot    \u2551',
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
            setGenSlots(prev => [...prev, { prompt: '', progress: 0, status: 'empty', name: '', description: '', price: 0, bakeTime: 30 }])
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
          `  Price: $${slot.price}  |  Bake Time: ${slot.bakeTime || 30}s`,
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
        newSlots[slotNum - 1] = { prompt: '', progress: 0, status: 'empty', name: '', description: '', price: 0, bakeTime: 30 }
        setGenSlots(newSlots)
        pushSystem(`  Slot ${slotNum} cleared. "${name}" has been discarded.`)
        pushLines([''])
        return
      }

      pushError("  ERROR: Unknown gen command. Use 'help' for usage.")
      return
    }

    if (cmd === 'bake') {
      const sub = parts[1]

      if (sub === 'list') {
        pushLines(['', '  ──────────────────────────────────────────────────'])
        bakeSlots.forEach((slot, i) => {
          if (i >= maxBakeSlots) return
          if (slot.status === 'empty') {
            pushLines([`  OVEN ${i + 1}: [EMPTY]`])
          } else if (slot.status === 'baking') {
            const pct = Math.floor(slot.progress)
            const barLen = 15
            const filled = Math.round((pct / 100) * barLen)
            const bar = '#'.repeat(filled) + '.'.repeat(barLen - filled)
            pushLines([`  OVEN ${i + 1}: [${bar}] ${String(pct).padStart(3)}% - "${slot.name}" [BAKING]`])
          } else {
            pushLines([`  OVEN ${i + 1}: "${slot.name}" ($${slot.price}) [READY]`])
          }
        })
        pushLines(['  ──────────────────────────────────────────────────', ''])
        return
      }

      if (sub === 'trash') {
        const slotNum = parseInt(parts[2])
        if (!slotNum || slotNum < 1 || slotNum > maxBakeSlots) {
          pushError(`  ERROR: Usage: bake trash <1-${maxBakeSlots}>`)
          return
        }
        const slot = bakeSlots[slotNum - 1]
        if (slot.status === 'empty') {
          pushError(`  ERROR: Oven slot ${slotNum} is already empty.`)
          return
        }
        const name = slot.name
        const newBake = [...bakeSlots]
        newBake[slotNum - 1] = { status: 'empty', name: '', price: 0, progress: 0, bakeTime: 30 }
        setBakeSlots(newBake)
        pushSystem(`  Oven slot ${slotNum} cleared. "${name}" discarded.`)
        pushLines([''])
        return
      }

      if (!sub) {
        pushError('  ERROR: Usage: bake <gen_slot>, bake list, or bake trash <oven_slot>')
        return
      }

      const slotNum = parseInt(sub)
      if (!slotNum || slotNum < 1 || slotNum > maxSlots) {
        pushError(`  ERROR: Usage: bake <1-${maxSlots}>, bake list, or bake trash <oven_slot>`)
        return
      }
      const slot = genSlots[slotNum - 1]
      if (slot.status !== 'ready' || !slot.description) {
        pushError(`  ERROR: Slot ${slotNum} is not ready to bake.`)
        return
      }
      const emptyBake = bakeSlots.findIndex(b => b.status === 'empty')
      if (emptyBake === -1) {
        pushError(`  ERROR: All ${maxBakeSlots} oven slots are full. Use bake trash <slot>.`)
        return
      }
      const bakeTime = slot.bakeTime || 30
      const newBake = [...bakeSlots]
      newBake[emptyBake] = { status: 'baking', name: slot.name, price: slot.price || 0, progress: 0, bakeTime }
      setBakeSlots(newBake)
      pushSystem(`  ✓ "${slot.name}" placed in Oven Slot ${emptyBake + 1}. Baking for ${bakeTime}s...`)
      pushLines([''])

      const intervalMs = 500
      const tick = 100 / (bakeTime * 1000 / intervalMs)
      const bakeIntervalId = setInterval(() => {
        setBakeSlots(prev => {
          const next = [...prev]
          if (next[emptyBake] && next[emptyBake].status === 'baking') {
            const newProgress = Math.min(100, next[emptyBake].progress + tick)
            if (newProgress >= 100) {
              next[emptyBake] = { ...next[emptyBake], progress: 100, status: 'ready' }
              clearInterval(bakeIntervalId)
            } else {
              next[emptyBake] = { ...next[emptyBake], progress: newProgress }
            }
          }
          return next
        })
      }, intervalMs)
      bakeIntervalsRef.current.push(bakeIntervalId)
      return
    }

    if (cmd === 'serve' || cmd === 'refuse' || cmd === 'scan') {
      pushError("  ERROR: Service commands moved to the REGISTER.")
      pushLines(["  Click the POS device on the right wall to serve, refuse, or scan."])
      return
    }

    pushError(`  ERROR: Unknown command "${cmd}". Type 'help' for a list of commands.`)
  }, [money, ownedItems, genSlots, maxSlots, bakeSlots, maxBakeSlots, currentCustomer, pushLines, pushError, pushSystem, pushInput, animateProgressBar, generateWithAI])

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
    const readyCount = genSlots.filter(s => s.status === 'ready' && s.description).length
    if (readyCount < 2) {
      showBellNotice({ type: 'warning', title: 'Need More Pastries', text: 'Generate at least 2 pastries before ringing the bell.' })
      return
    }
    if (currentCustomer) {
      showBellNotice({ type: 'info', title: 'Customer Waiting', text: `${currentCustomer.name} is already at the window.` })
      return
    }
    const customer = generateCustomer()
    const patienceSeconds = PATIENCE_SECONDS[customer.patience] || 120
    setCurrentCustomer({ ...customer, patienceSeconds })
    setServedItems([])
    setReceipt(null)
    chitchatIndexRef.current = 0
    setDialogueLeaving(false)
    setRegisterDialogue({ name: customer.name, tag: 'ORDER', text: '...', options: [] })
    const menu = genSlots
      .map((slot, i) => ({ ...slot, index: i + 1 }))
      .filter(slot => slot.status === 'ready' && slot.description)
      .map(slot => ({ name: slot.name, price: slot.price || 0 }))
    fetch('/api/generate-dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, menu })
    })
      .then(res => res.json())
      .then(data => {
        const positiveReply = data.positiveReply || { text: '"Coming right up!"', response: 'Good. Make it fast.' }
        const negativeReply = data.negativeReply || { text: '"Ugh, fine..."', response: '*Glares.* Watch the attitude.' }
        const requestedItems = Array.isArray(data.requestedItems) ? data.requestedItems : [menu[0]?.name || '']
        const replies = [
          { id: 'positive', text: positiveReply.text, response: positiveReply.response, mood: 'positive' },
          { id: 'negative', text: negativeReply.text, response: negativeReply.response, mood: 'negative' }
        ]
        setCurrentCustomer(prev => prev ? {
          ...prev,
          requestedItems,
          positiveReaction: data.positiveReaction || '*Takes a bite.* Not bad. **Not bad at all.**',
          negativeReaction: data.negativeReaction || 'This is **not** what I ordered. *Are you even listening?*',
          timeoutDialogue: data.timeoutDialogue || '*Checks watch.* Forget it. **I have places to be.**',
          leavingMessage: data.leavingMessage || '*Scoffs.* Fine. **I didn\'t want your pastries anyway.** *Storms off.*',
          chitchat: Array.isArray(data.chitchat) ? data.chitchat : [],
          tip: data.tip || 0,
          mood: null
        } : prev)
        setRegisterDialogue({ name: customer.name, tag: 'ORDER', text: data.greeting || 'Evening. Got anything edible?', options: replies })
      })
      .catch(() => {
        setRegisterDialogue({ name: customer.name, tag: 'ORDER', text: 'Evening. Got anything edible?', options: [] })
      })
  }, [bellAnimating, currentCustomer, ringBell, genSlots, showBellNotice])

  const handleServe = useCallback((bakeIndex) => {
    const slot = bakeSlots[bakeIndex]
    if (!slot || slot.status !== 'ready') return
    if (!currentCustomer) return

    ringBell()

    const name = slot.name
    const requestedItems = currentCustomer.requestedItems || []
    const unservedItems = requestedItems.filter(reqName =>
      !servedItems.some(s => s.name.toLowerCase().trim() === reqName.toLowerCase().trim())
    )
    const isCorrectOrder = unservedItems.some(
      reqName => name.toLowerCase().trim() === reqName.toLowerCase().trim()
    )

    const newBake = [...bakeSlots]
    newBake[bakeIndex] = { status: 'empty', name: '', price: 0, progress: 0, bakeTime: 30 }
    setBakeSlots(newBake)

    if (isCorrectOrder) {
      const price = slot.price || 0
      setMoney(prev => prev + price)
      const newServed = [...servedItems, { name, price }]
      setServedItems(newServed)

      const allDone = requestedItems.every(reqName =>
        newServed.some(s => s.name.toLowerCase().trim() === reqName.toLowerCase().trim())
      )

      if (allDone) {
        const tip = currentCustomer.mood === 'positive' ? (currentCustomer.tip || 0) : 0
        if (tip > 0) setMoney(prev => prev + tip)
        const subtotal = newServed.reduce((sum, item) => sum + item.price, 0)
        setReceipt({
          customerName: currentCustomer.name,
          items: newServed,
          requestedItems,
          subtotal,
          tip,
          total: subtotal + tip,
          status: 'complete'
        })
        setRegisterDialogue({
          name: currentCustomer.name,
          tag: 'HAPPY',
          text: currentCustomer.positiveReaction || '*Takes a bite.* Not bad. **Not bad at all.**',
          options: []
        })
        stopPatienceTimer()
        setCurrentCustomer(null)
        setRegisterScreen('receipt')
        setServedItems([])
      } else {
        setRegisterScreen('main')
        showBellNotice({ type: 'info', title: 'Item Served', text: `"${name}" checked off. ${unservedItems.length - 1} more to go.` })
      }
    } else {
      stopPatienceTimer()
      const currentServed = [...servedItems]
      const subtotal = currentServed.reduce((sum, item) => sum + item.price, 0)
      setReceipt({
        customerName: currentCustomer.name,
        items: currentServed,
        requestedItems,
        subtotal,
        tip: 0,
        total: subtotal,
        status: 'wrong',
        wrongItem: name
      })
      setRegisterDialogue({
        name: currentCustomer.name,
        tag: 'ANGRY',
        text: currentCustomer.negativeReaction || 'This is **not** what I ordered. *Are you even listening?*',
        options: []
      })
      setCurrentCustomer(null)
      setRegisterScreen('receipt')
      setServedItems([])
    }
  }, [bakeSlots, currentCustomer, ringBell, servedItems, showBellNotice, stopPatienceTimer])

  const handleRefuse = useCallback(() => {
    if (!currentCustomer) return
    const refundAmount = servedItems.reduce((sum, item) => sum + item.price, 0)
    if (refundAmount > 0) {
      setMoney(prev => prev - refundAmount)
    }
    stopPatienceTimer()
    const leaveName = currentCustomer.name
    const leaveText = currentCustomer.leavingMessage || '*Scoffs.* Fine. **I\'ll take my business elsewhere.**'
    setCurrentCustomer(null)
    setServedItems([])
    setZoomTarget(null)
    setRegisterScreen('main')
    setRegisterDialogue({
      name: leaveName,
      tag: 'LEAVING',
      text: leaveText,
      options: []
    })
    if (dialogueTimeoutRef.current) clearTimeout(dialogueTimeoutRef.current)
    dialogueTimeoutRef.current = setTimeout(() => {
      setDialogueLeaving(true)
      setTimeout(() => {
        setRegisterDialogue(null)
        setDialogueLeaving(false)
      }, 350)
    }, 2500)
  }, [currentCustomer, servedItems, stopPatienceTimer])

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

  const readyBakeSlots = bakeSlots.map((s, i) => ({ ...s, index: i })).filter(s => s.status === 'ready')

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
                        src={currentCustomer.avatar}
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
        </div>
      </div>

      {bellNotice && (
        <div className={`bell-notice bell-notice-${bellNotice.type || 'info'} ${bellNoticeLeaving ? 'bell-notice-leaving' : ''}`}>
          <div className="bell-notice-icon">{bellNotice.type === 'warning' ? '\u26a0' : '\u2139'}</div>
          <div className="bell-notice-content">
            <div className="bell-notice-title">{bellNotice.title}</div>
            <div className="bell-notice-text">{bellNotice.text}</div>
          </div>
        </div>
      )}

      {registerDialogue && (
        <div className={`register-dialogue${dialogueLeaving ? ' register-dialogue-leaving' : ''}`}>
          <div className="register-dialogue-bar">
            <div className="register-dialogue-name">{registerDialogue.name}</div>
            <div className="register-dialogue-bar-right">
              {registerDialogue.tag && (
                <div className="register-dialogue-tag">{registerDialogue.tag}</div>
              )}
              <button className="register-dialogue-close" onClick={dismissDialogue}>{"\u00d7"}</button>
            </div>
          </div>
          <div className="register-dialogue-text" onClick={() => {
            const customer = currentCustomerRef.current
            if (customer?.mood === 'positive' && customer?.chitchat?.length > 0 && registerDialogue.options.length === 0 && registerDialogue.tag !== 'LEAVING' && registerDialogue.tag !== 'HAPPY' && registerDialogue.tag !== 'ANGRY') {
              const idx = chitchatIndexRef.current % customer.chitchat.length
              setRegisterDialogue(prev => prev ? ({
                ...prev,
                tag: 'CHAT',
                text: customer.chitchat[idx]
              }) : prev)
              chitchatIndexRef.current++
            }
          }}>{renderMarkdown(registerDialogue.text)}</div>
          {registerDialogue.options.length > 0 && (
            <div className="register-dialogue-options">
              {registerDialogue.options.map(option => (
                <button
                  key={option.id}
                  className={`register-dialogue-option ${option.mood === 'positive' ? 'reply-positive' : 'reply-negative'}`}
                  onClick={() => {
                    const customer = currentCustomerRef.current
                    if (customer?.patienceSeconds) {
                      startPatienceTimer(customer.patienceSeconds)
                    }
                    setCurrentCustomer(prev => prev ? { ...prev, mood: option.mood } : prev)
                    setRegisterDialogue(prev => ({
                      name: prev.name,
                      tag: option.mood === 'positive' ? 'FRIENDLY' : 'RUDE',
                      text: option.response,
                      options: []
                    }))
                  }}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      {currentCustomer && patienceRemaining !== null && currentCustomer.patienceSeconds && (
        <div className="patience-hud">
          <div className="patience-hud-name">{currentCustomer.name}</div>
          <div className="patience-hud-row">
            <div className="patience-hud-bar-track">
              <div
                className={`patience-hud-bar-fill ${patienceRemaining / currentCustomer.patienceSeconds <= 0.25 ? 'critical' : patienceRemaining / currentCustomer.patienceSeconds <= 0.5 ? 'warning' : ''}`}
                style={{ width: `${(patienceRemaining / currentCustomer.patienceSeconds) * 100}%` }}
              />
            </div>
            <div className="patience-hud-time">{Math.floor(patienceRemaining / 60)}:{(patienceRemaining % 60).toString().padStart(2, '0')}</div>
          </div>
        </div>
      )}

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
                                src={currentCustomer.avatar}
                                alt={currentCustomer.name}
                                draggable={false}
                              />
                              <div className="register-customer-details">
                                <div className="register-customer-name">{currentCustomer.name}</div>
                                <div className="register-scan-results">
                                  <div className="register-scan-row"><span className="scan-label">Species:</span> <span className="scan-value">{currentCustomer.species}</span></div>
                                  <div className="register-scan-row"><span className="scan-label">Patience:</span> <span className="scan-value">{currentCustomer.patience}</span></div>
                                  <div className="register-scan-row"><span className="scan-label">Craving:</span> <span className="scan-value">{currentCustomer.craving}</span></div>
                                </div>
                              </div>
                              {patienceRemaining !== null && currentCustomer.patienceSeconds && (
                                <div className="patience-bar-container">
                                  <div className="patience-bar-label">
                                    {Math.floor(patienceRemaining / 60)}:{(patienceRemaining % 60).toString().padStart(2, '0')}
                                  </div>
                                  <div className="patience-bar-track">
                                    <div
                                      className={`patience-bar-fill ${patienceRemaining / currentCustomer.patienceSeconds <= 0.25 ? 'critical' : patienceRemaining / currentCustomer.patienceSeconds <= 0.5 ? 'warning' : ''}`}
                                      style={{ width: `${(patienceRemaining / currentCustomer.patienceSeconds) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {currentCustomer.requestedItems && currentCustomer.requestedItems.length > 0 && (
                                <div className="order-checklist">
                                  <div className="order-checklist-title">ORDER</div>
                                  {currentCustomer.requestedItems.map((itemName, idx) => {
                                    const isServed = servedItems.some(s => s.name.toLowerCase().trim() === itemName.toLowerCase().trim())
                                    return (
                                      <div key={idx} className={`order-checklist-item ${isServed ? 'served' : ''}`}>
                                        <span className="order-check">{isServed ? '\u2713' : '\u25cb'}</span>
                                        <span className="order-item-name">{itemName}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="register-no-customer">
                              <div className="register-empty-msg">No customer at window. Ring the bell.</div>
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
                          {readyBakeSlots.length > 0 ? (
                            <div className="register-serve-slots">
                              {readyBakeSlots.map(slot => (
                                <div
                                  key={slot.index}
                                  className="register-serve-slot-btn"
                                  onClick={() => handleServe(slot.index)}
                                >
                                  <span className="serve-slot-num">OVEN {slot.index + 1}</span>
                                  <span className="serve-slot-name">"{slot.name}"</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="register-no-customer">
                              <div className="register-empty-msg">No baked pastries ready. Use the terminal to bake.</div>
                            </div>
                          )}
                        </div>
                        <div className="zoomed-pos-btn zp-gray" onClick={() => setRegisterScreen('main')}>BACK</div>
                      </>
                    )}

                    {registerScreen === 'receipt' && receipt && (
                      <>
                        <div className="zoomed-pos-items">
                          <div className="receipt-container">
                            <div className="receipt-header">HAZARDOUS ATELIER</div>
                            <div className="receipt-subheader">Customer: {receipt.customerName}</div>
                            <div className="receipt-divider"></div>
                            {receipt.status === 'complete' && (
                              <div className="receipt-status receipt-complete">{'\u2605'} ORDER COMPLETE</div>
                            )}
                            {receipt.status === 'wrong' && (
                              <div className="receipt-status receipt-wrong">{'\u2716'} WRONG ORDER{receipt.wrongItem ? ` ("${receipt.wrongItem}")` : ''}</div>
                            )}
                            {receipt.status === 'timeout' && (
                              <div className="receipt-status receipt-timeout">{'\u23f0'} CUSTOMER LEFT</div>
                            )}
                            <div className="receipt-divider"></div>
                            <div className="receipt-section-title">SERVED</div>
                            {receipt.items.length > 0 ? receipt.items.map((item, idx) => (
                              <div key={idx} className="receipt-item-row">
                                <span className="receipt-item-name">{item.name}</span>
                                <span className="receipt-item-price">${item.price}</span>
                              </div>
                            )) : (
                              <div className="receipt-item-row receipt-empty">No items served</div>
                            )}
                            {receipt.requestedItems.length > receipt.items.length && (
                              <>
                                <div className="receipt-divider"></div>
                                <div className="receipt-section-title">UNFULFILLED</div>
                                {receipt.requestedItems.filter(reqName =>
                                  !receipt.items.some(s => s.name.toLowerCase().trim() === reqName.toLowerCase().trim())
                                ).map((name, idx) => (
                                  <div key={idx} className="receipt-item-row receipt-unfulfilled">{name}</div>
                                ))}
                              </>
                            )}
                            <div className="receipt-divider thick"></div>
                            <div className="receipt-total-row">
                              <span>Subtotal</span>
                              <span>${receipt.subtotal}</span>
                            </div>
                            {receipt.tip > 0 && (
                              <div className="receipt-total-row receipt-tip">
                                <span>Tip</span>
                                <span>+${receipt.tip}</span>
                              </div>
                            )}
                            <div className="receipt-total-row receipt-grand-total">
                              <span>TOTAL</span>
                              <span>${receipt.total}</span>
                            </div>
                            <div className="receipt-footer">
                              {receipt.status === 'complete' ? 'THANK YOU!' : receipt.status === 'timeout' ? 'PATIENCE EXPIRED' : 'TRANSACTION ENDED'}
                            </div>
                          </div>
                        </div>
                        <div className="zoomed-pos-btn zp-gray" onClick={() => {
                          setRegisterScreen('main')
                          setReceipt(null)
                          dismissDialogue()
                        }}>DONE</div>
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
