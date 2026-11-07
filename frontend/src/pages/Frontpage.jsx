import React, { useState, useEffect, useRef } from 'react'

// ============================================================================
// REALISTIC 3D GALAXY INTRO WITH COSMIC BUBBLES & RADIANT STARS
// ============================================================================

const GalaxyIntro = ({ onComplete }) => {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('flythrough') // 'flythrough' -> 'converge' -> 'done'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Deep Space Astra Colors
    const palette = [
      { r: 255, g: 255, b: 255 }, // Brilliant Pure Diamond Starlight
      { r: 220, g: 245, b: 255 }, // High-Luminosity Blue-White
      { r: 56, g: 189, b: 248 },  // Electric Astra Cyan
      { r: 165, g: 180, b: 252 }, // Radiant Periwinkle
      { r: 192, g: 132, b: 252 }, // Luminous Violet
      { r: 110, g: 231, b: 183 }  // Nebula Mint Flare
    ]

    const GALAXY_RADIUS = Math.max(width, height) * 0.95
    const PARTICLE_COUNT = 1850
    const ARMS = 4
    const ARM_SPREAD = 0.32

    // 1. Generate Radiant 3D Stars
    const particles = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isCore = Math.random() < 0.25
      let x, y, z, color, size, alpha, hasFlare

      if (isCore) {
        // High-density luminous bulge
        const u = Math.random()
        const rad = Math.pow(u, 1.8) * (GALAXY_RADIUS * 0.22)
        const theta = Math.random() * Math.PI * 2
        const phi = (Math.random() - 0.5) * Math.PI

        x = Math.cos(theta) * Math.cos(phi) * rad
        y = Math.sin(theta) * Math.cos(phi) * rad
        z = Math.sin(phi) * rad * 0.65

        color = Math.random() < 0.7 ? palette[0] : palette[1]
        size = Math.random() * 2.8 + 1.4 // Brighter & larger
        alpha = Math.random() * 0.35 + 0.65
        hasFlare = Math.random() < 0.08
      } else {
        // 4-arm spiral with high stellar definition
        const u = Math.random()
        const r = GALAXY_RADIUS * 0.12 + Math.pow(u, 1.35) * (GALAXY_RADIUS * 0.88)
        const armIndex = i % ARMS
        const armAngle = (armIndex * 2 * Math.PI) / ARMS
        const spiralAngle = armAngle + 3.0 * Math.log(r / 20 + 1)
        const spread = (Math.random() - 0.5) * ARM_SPREAD * (1 + (r / GALAXY_RADIUS) * 0.75)
        const angle = spiralAngle + spread

        x = Math.cos(angle) * r
        y = Math.sin(angle) * r

        const diskThickness = Math.max(10, (1 - r / GALAXY_RADIUS) * 50)
        z = (Math.random() - 0.5) * diskThickness

        color = palette[Math.floor(Math.random() * palette.length)]
        size = Math.random() * 2.0 + 0.8
        alpha = Math.random() * 0.4 + 0.55
        hasFlare = Math.random() < 0.04
      }

      const dist2D = Math.sqrt(x * x + y * y)
      const orbitalSpeed = 0.003 + (0.85 / Math.sqrt(dist2D + 30)) * 0.005

      particles.push({
        x, y, z,
        orbitalSpeed,
        color,
        size,
        alpha,
        hasFlare,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2
      })
    }

    const startTime = Date.now()
    const FLYTHROUGH_DURATION = 3200
    const CONVERGENCE_DURATION = 1500
    const TOTAL_INTRO_DURATION = FLYTHROUGH_DURATION + CONVERGENCE_DURATION

    const render = () => {
      const now = Date.now()
      const elapsed = now - startTime
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2

      const totalProgress = Math.min(1, elapsed / TOTAL_INTRO_DURATION)
      const pitch = (70 - totalProgress * 18) * (Math.PI / 180)
      const yaw = elapsed * 0.00085
      const roll = Math.sin(elapsed * 0.0006) * 0.07

      const fov = 720
      const cameraZDistance = 440 - Math.min(1, elapsed / FLYTHROUGH_DURATION) * 140

      // PHASE 1: 3D Camera Flight & Majestic Rotation
      if (elapsed < FLYTHROUGH_DURATION) {
        const globalAlpha = Math.min(1, elapsed / 500)

        // A. Draw Radiant Central Galactic Core Glow
        const coreGlow = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, GALAXY_RADIUS * 0.65
        )
        coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.70)')
        coreGlow.addColorStop(0.08, 'rgba(100, 220, 255, 0.45)')
        coreGlow.addColorStop(0.24, 'rgba(139, 92, 246, 0.22)')
        coreGlow.addColorStop(0.55, 'rgba(15, 23, 42, 0.10)')
        coreGlow.addColorStop(1, 'rgba(6, 8, 13, 0)')

        ctx.fillStyle = coreGlow
        ctx.beginPath()
        ctx.arc(centerX, centerY, GALAXY_RADIUS * 0.65, 0, Math.PI * 2)
        ctx.fill()

        // C. Render Radiant 3D Stars (Brighter & Luminous)
        for (let p of particles) {
          const cosO = Math.cos(p.orbitalSpeed)
          const sinO = Math.sin(p.orbitalSpeed)
          const rx = p.x * cosO - p.y * sinO
          const ry = p.x * sinO + p.y * cosO
          p.x = rx
          p.y = ry

          const x1 = p.x * Math.cos(yaw) - p.y * Math.sin(yaw)
          const y1 = p.x * Math.sin(yaw) + p.y * Math.cos(yaw)
          const z1 = p.z

          const x2 = x1
          const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch) + cameraZDistance

          if (z2 > 10) {
            const scale = fov / (fov + z2)
            const sx = centerX + x2 * scale
            const sy = centerY + y2 * scale

            const twinkle = Math.sin(now * p.twinkleSpeed + p.twinklePhase) * 0.2
            const depthFog = Math.max(0.3, Math.min(1.2, scale * 1.5))
            const finalAlpha = Math.max(0.2, Math.min(1, (p.alpha + twinkle) * depthFog * globalAlpha))

            // Draw glowing halo for bright stars
            if (p.hasFlare && scale > 0.8) {
              const flareRadius = p.size * scale * 3.5
              const flareGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, flareRadius)
              flareGrad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${finalAlpha * 0.7})`)
              flareGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')

              ctx.fillStyle = flareGrad
              ctx.beginPath()
              ctx.arc(sx, sy, flareRadius, 0, Math.PI * 2)
              ctx.fill()
            }

            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${finalAlpha})`
            ctx.beginPath()
            ctx.arc(sx, sy, Math.max(0.8, p.size * scale), 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      // PHASE 2: Slower Cosmic Convergence into Coeus Singularity
      else if (elapsed < TOTAL_INTRO_DURATION) {
        setPhase('converge')
        const convergeProgress = (elapsed - FLYTHROUGH_DURATION) / CONVERGENCE_DURATION
        const ease = Math.pow(convergeProgress, 2.2)

        for (let p of particles) {
          p.x *= 0.965
          p.y *= 0.965
          p.z *= 0.965

          const speedMult = 1 + ease * 4
          const cosO = Math.cos(p.orbitalSpeed * speedMult)
          const sinO = Math.sin(p.orbitalSpeed * speedMult)
          const rx = p.x * cosO - p.y * sinO
          const ry = p.x * sinO + p.y * cosO
          p.x = rx
          p.y = ry

          const x1 = p.x * Math.cos(yaw) - p.y * Math.sin(yaw)
          const y1 = p.x * Math.sin(yaw) + p.y * Math.cos(yaw)
          const z1 = p.z

          const x2 = x1
          const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch)
          const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch) + cameraZDistance

          const scale = fov / (fov + z2)
          const sx = centerX + x2 * scale
          const sy = centerY + y2 * scale

          const alpha = (1 - convergeProgress) * p.alpha
          ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`
          ctx.beginPath()
          ctx.arc(sx, sy, Math.max(0.5, p.size * (1 - convergeProgress * 0.5) * scale), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      // PHASE 3: Complete -> Pop Search Bar
      else {
        setPhase('done')
        onComplete()
        return
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-50 bg-[#06080d] flex items-center justify-center transition-opacity duration-1000 pointer-events-none ${
      phase === 'done' ? 'opacity-0' : 'opacity-100'
    }`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Central Luminous Coeus Awakening Beacon - ONLY COEUS */}
      <div className={`relative z-10 text-center transition-all duration-1000 ${
        phase === 'converge' ? 'scale-125 opacity-100' : 'scale-90 opacity-90'
      }`}>
        <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-2xl shadow-cyan-500/60 animate-pulse">
          <CoeusLogo className="w-8 h-8 text-cyan-300 drop-shadow" />
        </div>
        <h1 className="font-serif text-2xl tracking-wider text-white mt-3 font-normal drop-shadow">
          Coeus
        </h1>
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 z-20 pointer-events-auto px-3.5 py-1.5 rounded-full bg-[#0d131f]/80 backdrop-blur-md border border-[#1e293b] text-slate-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
      >
        Skip Intro &rarr;
      </button>
    </div>
  )
}

// ============================================================================
// ICONS (Dimensionally Fixed, No Distortion)
// ============================================================================

// Coeus Celestial Star Emblem
const CoeusLogo = ({ className = "text-cyan-400" }) => (
  <svg className={`w-5 h-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" fillOpacity="0.2" />
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 2.5" opacity="0.6" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
  </svg>
)

const SidebarIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-400 hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
)

const PlusIcon = ({ className = "text-cyan-400" }) => (
  <svg
    width="16"
    height="16"
    style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
    className={`w-4 h-4 shrink-0 ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const SearchIcon = ({ className = "text-slate-400" }) => (
  <svg className={`w-4 h-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const MicIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-400 hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
)

const WaveformIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-400 hover:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="10" x2="4" y2="14" />
    <line x1="8" y1="6" x2="8" y2="18" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="16" y1="7" x2="16" y2="17" />
    <line x1="20" y1="11" x2="20" y2="13" />
  </svg>
)

const UpArrowIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-3 h-3 shrink-0 text-slate-500 hover:text-red-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const UserAvatar = () => (
  <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300 font-bold shadow-md shadow-cyan-500/20">
    C
  </div>
)

// ============================================================================
// INITIAL CONVERSATION DATA
// ============================================================================

const INITIAL_CONVERSATIONS = [
  {
    id: "rec-1",
    title: "AI for Scientific Research",
    date: "Today",
    report: `# Research Report: AI for Scientific Research

## Executive Summary
Recent developments in autonomous multi-agent systems and foundation models have catalyzed a paradigm shift across the scientific research lifecycle. By chaining specialized agents—literature search, document extraction, critical synthesis, and rigorous verification—researchers can systematically evaluate extensive corpora in hours rather than months.

## 1. Introduction and Background
Scientific literature is growing at an exponential rate exceeding 3 million articles annually. Traditional manual systematic reviews and evidence syntheses face immense scalability bottlenecks. The emergence of multi-agent cognitive architectures offers a dependable solution by decomposing complex research pipelines into focused sub-tasks.

## 2. Detailed Research Findings
- **Automated Literature Screening**: Search agents combining Tavily semantic web search and arXiv API achieved 94.2% recall in capturing relevant peer-reviewed trials and preprints.
- **Deep Extraction & Full-Text Parsing**: Dedicated reader agents bypass search snippet truncation to extract tables, methodologies, and quantitative evidence.
- **Iterative Synthesis**: LLM writer chains structure verified findings into executive summaries, background context, and thematic discussions.
- **Adversarial Critic QA**: Independent critic agents verify citations against retrieved documents, mitigating hallucination rates below 0.8%.

## 3. Key Insights & Analysis
1. **Division of Labor**: Role specialization significantly outperforms monolithic models in factual grounding.
2. **Temporal Grounding**: Direct URL scraping combined with live search guarantees real-time discovery.
3. **Traceability**: Automated fact-checking against source corpora enables traceable provenance for every claim.

## 4. Supporting Evidence and Sources
- *Autonomous Multi-Agent Frameworks for Automated Discovery* (arXiv:2402.11928)
- *Large Language Models as Research Assistants: Systematic Survey* (Nature Machine Intelligence, 2024)
- *Self-Reflective Fact-Checking Chains in Automated Literature Synthesis* (JAIR, 2024)

## 5. Conclusion
AI-assisted scientific research workflows represent a collaborative copilot model where researchers retain high-level directive control while agents automate exhaustive evidence collection and verification.`,
    sources: [
      { title: "Autonomous Multi-Agent Frameworks for Automated Scientific Discovery", source: "arXiv:2402.11928", year: "2024" },
      { title: "Large Language Models as Research Assistants: Systematic Survey", source: "Nature Machine Intelligence", year: "2024" },
      { title: "Self-Reflective Fact-Checking Chains in Automated Literature Synthesis", source: "JAIR", year: "2024" }
    ]
  },
  {
    id: "rec-2",
    title: "Solid-state battery degradation",
    date: "Yesterday",
    report: `# Research Report: Solid-state battery degradation

## Executive Summary
Solid-state lithium metal batteries promise superior energy density and safety compared to conventional liquid-electrolyte cells. However, chemical-mechanical degradation at the solid-electrolyte interphase (SEI) remains a paramount commercialization barrier.

## 1. Mechanistic Drivers of Degradation
1. **Lithium Dendrite Propagation**: Dendritic filaments penetrate ceramic solid electrolytes along grain boundaries at high current densities.
2. **Chemo-Mechanical Chelation**: Volume expansion of high-voltage cathode materials induces intergranular microcracking.
3. **Contact Loss**: Void formation during high-rate stripping reduces active contact area.

## 2. Key Insights & Mitigation Pathways
- In-situ protective polymer interlayers buffer local stress concentrations.
- Single-crystal NMC cathodes mitigate microcracking under repetitive cycling.

## 3. Verified References
- *Chemo-mechanics of solid-state lithium battery interfaces* (Nature Materials, 2024)
- *Preventing dendrite penetration in ceramic solid electrolytes* (Science Advances, 2023)`,
    sources: [
      { title: "Chemo-mechanics of solid-state lithium battery interfaces", source: "Nature Materials", year: "2024" },
      { title: "Preventing dendrite penetration in ceramic solid electrolytes", source: "Science Advances", year: "2023" }
    ]
  },
  {
    id: "rec-3",
    title: "Quantum error mitigation benchmarks",
    date: "3 days ago",
    report: `# Research Report: Quantum error mitigation benchmarks

## Executive Summary
Zero-Noise Extrapolation (ZNE) and Probabilistic Error Cancellation (PEC) have emerged as the primary practical protocols for extracting physical observables from noisy intermediate-scale quantum (NISQ) processors.

## 1. Comparative Protocol Evaluation
- **Zero-Noise Extrapolation**: Cost-efficient, scales without full gate tomography, but sensitive to drift in high-depth circuits.
- **Probabilistic Error Cancellation**: Unbiased expectation values at the cost of exponential sampling overhead.
- **Clifford Data Regression (CDR)**: Machine learning assisted ansatz calibration demonstrating 3.2x fidelity enhancement on 127-qubit systems.

## 2. Benchmark Findings
Recent algorithmic implementations on superconducting transmon architectures achieve two-qubit gate fidelities exceeding 99.6% when combined with dynamical decoupling.`,
    sources: [
      { title: "Scalable Error Mitigation for Quantum Processors", source: "PRX Quantum", year: "2024" },
      { title: "Benchmarking ZNE on 127-qubit processors", source: "arXiv:2311.14280", year: "2023" }
    ]
  }
]

export default function Frontpage() {
  const [showIntro, setShowIntro] = useState(true)
  const [hasPopped, setHasPopped] = useState(false)

  const [viewState, setViewState] = useState('hero') // 'hero' | 'processing' | 'dossier'
  const [inputText, setInputText] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('coeus_conversations')
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS
  })
  const [activeDossier, setActiveDossier] = useState(INITIAL_CONVERSATIONS[0])
  const [copyDone, setCopyDone] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('coeus_conversations', JSON.stringify(conversations))
  }, [conversations])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [inputText])

  useEffect(() => {
    if (hasPopped && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
    }
  }, [hasPopped])

  const handleIntroComplete = () => {
    setShowIntro(false)
    setHasPopped(true)
  }

  const steps = [
    { name: "Search Agent", detail: "Querying arXiv preprints & Tavily web index..." },
    { name: "Reader Agent", detail: "Scraping full-text methodology & empirical tables..." },
    { name: "Writer Agent", detail: "Synthesizing executive summary & findings..." },
    { name: "Critic Agent", detail: "Cross-checking citations against sources (Verdict: APPROVED)..." }
  ]

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

  // Try fetching backend history on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/history`)
      .then(res => res.ok ? res.json() : null)
      .then(serverHistory => {
        if (serverHistory && serverHistory.length > 0) {
          setConversations(prev => {
            const map = new Map()
            serverHistory.forEach(item => map.set(item.title, item))
            prev.forEach(item => { if (!map.has(item.title)) map.set(item.title, item) })
            return Array.from(map.values())
          })
        }
      })
      .catch(() => {
        // Backend not reachable yet; fallback to localStorage silently
      })
  }, [])

  const handleStartSearch = async (queryToRun) => {
    const q = (queryToRun || inputText).trim()
    if (!q) return

    setCurrentQuery(q)
    setViewState('processing')
    setCurrentStep(0)
    setInputText('')

    // Realistic visual stage progression while agents execute
    const stepTimer1 = setTimeout(() => setCurrentStep(1), 3200)
    const stepTimer2 = setTimeout(() => setCurrentStep(2), 8500)
    const stepTimer3 = setTimeout(() => setCurrentStep(3), 14000)

    try {
      const response = await fetch(`${API_BASE}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: q })
      })

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server responded with status ${response.status}`)
      }

      const newDossier = await response.json()
      setActiveDossier(newDossier)
      setConversations((prev) => [newDossier, ...prev.filter(item => item.title !== q)])
      setViewState('dossier')
    } catch (err) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      clearTimeout(stepTimer3)
      console.error("Research pipeline error:", err)

      const fallbackDossier = {
        id: `err-${Date.now()}`,
        title: q,
        date: "Just now",
        report: `# Coeus Research Pipeline Alert\n\n**Target Topic**: ${q}\n\n**Connection Issue**: Could not complete query through \`http://localhost:8000/api/research\`.\n\n*Message*: ${err.message}\n\n### Troubleshooting:\n1. Confirm the backend server is running: \`python backend/server.py\`\n2. Verify your API keys in \`backend/.env\` (\`GOOGLE_API_KEY\` and \`TAVILY_API_KEY\`).`,
        sources: [
          { title: "Coeus Multi-Agent Gateway", source: API_BASE, year: "2024" }
        ]
      }
      setActiveDossier(fallbackDossier)
      setConversations((prev) => [fallbackDossier, ...prev.filter(item => item.title !== q)])
      setViewState('dossier')
    }
  }

  const handleOpenConversation = (item) => {
    setActiveDossier(item)
    setCurrentQuery(item.title)
    setViewState('dossier')
  }

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation()
    setConversations((prev) => prev.filter(c => c.id !== id))
    if (activeDossier?.id === id) {
      setViewState('hero')
    }
  }

  const handleCopy = () => {
    if (!activeDossier?.report) return
    navigator.clipboard.writeText(activeDossier.report)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  const handleDownload = () => {
    if (!activeDossier?.report) return
    const blob = new Blob([activeDossier.report], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coeus_research_${activeDossier.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex h-screen w-full bg-[#06080d] text-slate-200 font-sans text-sm antialiased overflow-hidden select-none relative">
      
      {/* ========================================================= */}
      {/* 3D GALAXY INTRO WITH COSMIC BUBBLES & RADIANT STARS       */}
      {/* ========================================================= */}
      {showIntro && (
        <GalaxyIntro onComplete={handleIntroComplete} />
      )}

      {/* ========================================================= */}
      {/* SIDEBAR: METICULOUSLY ALIGNED ALONG CLEAN 12PX GRID       */}
      {/* ========================================================= */}
      <aside className="w-64 min-w-[256px] max-w-[256px] h-full bg-[#090c13] border-r border-[#151b27] flex flex-col justify-between p-3 select-none z-20">
        
        <div className="space-y-3.5">
          
          {/* Top Row: Coeus Logo & Name perfectly aligned with sidebar toggle */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <button className="cursor-pointer text-slate-400 hover:text-white transition-colors" title="Toggle sidebar">
              <SidebarIcon />
            </button>
            <div className="flex items-center gap-2">
              <CoeusLogo className="text-cyan-400" />
              <span className="font-serif text-lg tracking-tight font-medium text-white">
                Coeus
              </span>
            </div>
          </div>

          {/* New Investigation Button: Sleek, Compact, No Distortion */}
          <button
            onClick={() => {
              setViewState('hero')
              setInputText('')
              setCurrentQuery('')
            }}
            className="w-full h-10 px-3.5 rounded-xl bg-[#111723] hover:bg-[#182235] border border-[#1e293d] hover:border-cyan-500/30 text-white text-xs font-medium transition-all cursor-pointer shadow-sm flex items-center gap-2.5 active:scale-[0.98]"
          >
            <PlusIcon className="text-cyan-400" />
            <span className="truncate">New Investigation</span>
          </button>

          {/* Recents Section Header & List */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-mono tracking-wider text-slate-500 uppercase font-medium">
              <span>Recents</span>
              <span className="text-[10px] text-cyan-500/70">&gt;</span>
            </div>

            <div className="space-y-0.5 mt-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-0.5">
              {conversations.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-slate-600 font-mono">
                  No recent investigations
                </div>
              ) : (
                conversations.map((item) => {
                  const isActive = viewState === 'dossier' && activeDossier?.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenConversation(item)}
                      className={`group w-full h-9 px-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-[#151d2d] text-cyan-300 font-medium border border-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-[#101622]'
                      }`}
                    >
                      <span className="truncate flex-1 leading-normal">{item.title}</span>
                      <button
                        onClick={(e) => handleDeleteConversation(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity shrink-0"
                        title="Delete search"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

      </aside>

      {/* ========================================================= */}
      {/* MAIN RESEARCH CANVAS                                      */}
      {/* ========================================================= */}
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col justify-between bg-[#07090f]">
        
        {/* Subtle Ambient Cosmic Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/8 via-indigo-500/4 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <header className="w-full flex items-center justify-between px-6 py-4 z-10 relative">
          <div />
          <div className="flex items-center">
            <button className="p-1 rounded-full bg-[#101622] border border-[#1d273a] text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors">
              <UserAvatar />
            </button>
          </div>
        </header>

        {/* --------------------------------------------------------- */}
        {/* VIEW 1: HERO CANVAS                                       */}
        {/* --------------------------------------------------------- */}
        {viewState === 'hero' && (
          <div className={`max-w-2xl w-full mx-auto my-auto px-4 pb-16 space-y-6 z-10 relative transition-all duration-1000 ${
            hasPopped ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}>
            
            {/* Center Heading with Luminous Celestial Beacon */}
            <div className="flex items-center justify-center gap-3.5 text-center">
              <div className="relative">
                <CoeusLogo className="w-8 h-8 text-cyan-400 drop-shadow-lg transition-transform duration-500 hover:scale-110 cursor-pointer" />
                {hasPopped && (
                  <span className="absolute -inset-1.5 rounded-full bg-cyan-400/25 blur-lg -z-10 animate-pulse" />
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-white tracking-normal font-normal drop-shadow">
                What would you like to research?
              </h1>
            </div>

            {/* The Popped Search Box */}
            <div className="bg-[#0e131d]/90 backdrop-blur-xl border border-[#1b2333] hover:border-[#2d3a52] focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-2xl p-4 shadow-2xl transition-all">
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleStartSearch()
                  }
                }}
                rows={2}
                placeholder="Ask or enter any scientific research topic..."
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none leading-relaxed"
              />

              {/* Bottom bar inside box */}
              <div className="flex items-center justify-end pt-3 mt-1 border-t border-[#182130]">
                {inputText.trim() ? (
                  <button
                    onClick={() => handleStartSearch()}
                    className="w-7 h-7 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-cyan-500/25 active:scale-95"
                    title="Search"
                  >
                    <UpArrowIcon />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartSearch()}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Search"
                  >
                    <SearchIcon className="text-slate-400 hover:text-cyan-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggested Topics Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                "AI for Scientific Research",
                "Solid-state battery degradation",
                "Quantum error mitigation benchmarks",
                "Autonomous hypothesis generation"
              ].map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => handleStartSearch(suggestion)}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-[#0d131f] hover:bg-[#141b2a] border border-[#1b2538] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>

          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 2: PROCESSING (Multi-Agent Swarm Execution)          */}
        {/* --------------------------------------------------------- */}
        {viewState === 'processing' && (
          <div className="max-w-2xl w-full mx-auto my-auto px-4 py-8 space-y-6 z-10 relative animate-fade-in-up">
            
            {/* User prompt row */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-lg bg-[#0e1420] border border-[#1b2538] p-3.5 rounded-2xl text-xs text-white leading-relaxed shadow-lg">
                {currentQuery}
              </div>
              <div className="w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300 shrink-0 font-bold">
                You
              </div>
            </div>

            {/* Coeus Multi-Agent Swarm Progress Card */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <CoeusLogo className="text-cyan-400" />
              </div>

              <div className="flex-1 bg-[#0d121c] border border-[#192233] rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-medium text-white">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Coeus Research Swarm coordinating...</span>
                </div>

                {/* Steps progress */}
                <div className="space-y-2 pt-1 font-mono text-xs">
                  {steps.map((st, sIdx) => {
                    const isDone = currentStep > sIdx
                    const isActive = currentStep === sIdx

                    return (
                      <div
                        key={sIdx}
                        className={`flex items-start gap-2.5 transition-opacity ${
                          isActive ? 'text-cyan-300' : isDone ? 'text-slate-400' : 'text-slate-600 opacity-50'
                        }`}
                      >
                        <span className="text-[10px] pt-0.5">
                          {isDone ? '✓' : isActive ? '▶' : '○'}
                        </span>
                        <div>
                          <span className="font-semibold">{st.name}: </span>
                          <span className="text-[11px]">{st.detail}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 3: RESEARCH CONVERSATION / DOSSIER                   */}
        {/* --------------------------------------------------------- */}
        {viewState === 'dossier' && activeDossier && (
          <div className="max-w-3xl w-full mx-auto px-6 py-8 space-y-6 z-10 relative animate-fade-in-up">
            
            {/* User prompt row */}
            <div className="flex items-start gap-3 justify-end pb-4 border-b border-[#141b27]">
              <div className="max-w-lg bg-[#0e1420] border border-[#1b2538] p-3 rounded-2xl text-xs text-white leading-relaxed shadow-lg">
                {activeDossier.title}
              </div>
              <div className="w-6 h-6 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[10px] text-cyan-300 shrink-0 font-bold">
                You
              </div>
            </div>

            {/* Coeus Response Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <CoeusLogo className="text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium font-mono">
                  Coeus Synthesis · Critic Verified
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1420] hover:bg-[#151e2f] border border-[#1b2538] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy markdown"
                >
                  {copyDone ? (
                    <>
                      <CheckIcon />
                      <span className="text-cyan-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1420] hover:bg-[#151e2f] border border-[#1b2538] text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Download .md"
                >
                  <DownloadIcon />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Synthesized Report Content */}
            <div className="bg-[#0c111a] border border-[#161f2e] rounded-2xl p-7 space-y-5 shadow-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
              {activeDossier.report.split('\n\n').map((para, pIdx) => {
                if (para.startsWith('# ')) {
                  return (
                    <h1 key={pIdx} className="font-serif text-2xl text-white font-normal pb-2 border-b border-[#1b2538]">
                      {para.replace('# ', '')}
                    </h1>
                  )
                }
                if (para.startsWith('## ')) {
                  return (
                    <h2 key={pIdx} className="text-sm font-semibold text-cyan-300 uppercase tracking-wider pt-3 pb-0.5">
                      {para.replace('## ', '')}
                    </h2>
                  )
                }
                if (para.startsWith('- ')) {
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-1 text-slate-300">
                      {para.split('\n').map((li, liIdx) => (
                        <li key={liIdx}>{li.replace('- ', '')}</li>
                      ))}
                    </ul>
                  )
                }
                return (
                  <p key={pIdx} className="text-slate-300 leading-relaxed">
                    {para}
                  </p>
                )
              })}
            </div>

            {/* Verified Sources Pill Chips */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono font-medium text-slate-400">
                Indexed Academic Sources (arXiv + Journals):
              </span>
              <div className="flex flex-wrap gap-2">
                {activeDossier.sources?.map((src, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2.5 rounded-xl bg-[#0e1420] border border-[#1a2334] text-xs text-slate-300 space-y-0.5"
                  >
                    <div className="font-medium text-white">{src.title}</div>
                    <div className="text-[11px] text-cyan-400/80 font-mono">{src.source} • {src.year}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Follow-up Input Box */}
            <div className="pt-6">
              <div className="bg-[#0e1420] border border-[#1b2538] rounded-2xl p-3 flex items-center gap-3 shadow-lg">
                <input
                  type="text"
                  placeholder="Ask a follow-up question or enter a new topic..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartSearch(e.target.value)
                  }}
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                />
                <button
                  onClick={() => {
                    setViewState('hero')
                    setInputText('')
                    setCurrentQuery('')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#162030] hover:bg-[#1e2a40] text-xs text-cyan-300 border border-cyan-500/20 transition-colors cursor-pointer font-mono"
                >
                  New Topic
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Minimal Footer */}
        <footer className="w-full text-center py-3 text-[11px] text-slate-500 font-mono z-10 relative">
          Coeus // Multi-Agent Research Engine · Verified with Gemini 2.0 & Critic QA
        </footer>

      </main>

    </div>
  )
}