// The Brynz motion layer: every animation and small behaviour on the marketing pages is
// declared in markup with a data-* hook and run from here, so pages stay server components.
// Ported from the design source (brynz-site/assets/motion.js + app.js). One rule for all of
// it: the resting HTML already shows the final state, motion only replays it while on screen.
//
// Hooks: data-live, data-flow, data-typer, data-cycle, data-thread, data-net, data-funnel,
// data-odo, data-days, data-ring, data-pool, data-pitch, data-kw, data-track, data-ticker,
// data-type-ph, data-tabs, data-form, data-copy, .fit, .file-drop.
import { BOOKING_URL } from './site'

type El = HTMLElement

export function startMotion(root: Document): () => void {
  const $ = <T extends Element = El>(s: string, r: ParentNode = root) => r.querySelector<T>(s)
  const $$ = <T extends Element = El>(s: string, r: ParentNode = root) => Array.from(r.querySelectorAll<T>(s))
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Everything started here is tracked so a route change stops it.
  const timers = new Set<number>()
  const frames = new Set<number>()
  const observers: IntersectionObserver[] = []
  const unlisten: (() => void)[] = []
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
    return id
  }
  const cancel = (id?: number) => { if (id != null) { clearTimeout(id); timers.delete(id) } }
  const every = (fn: () => void, ms: number) => { const id = window.setInterval(fn, ms); timers.add(id); return id }
  const stopEvery = (id?: number) => { if (id != null) { clearInterval(id); timers.delete(id) } }
  const frame = (fn: FrameRequestCallback) => { const id = requestAnimationFrame(t => { frames.delete(id); fn(t) }); frames.add(id); return id }
  const listen = (target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
    target.addEventListener(type, fn, opts)
    unlisten.push(() => target.removeEventListener(type, fn, opts))
  }
  function watch(el: Element, on: () => void, off?: () => void, threshold = 0.2) {
    let vis = false
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting && !vis) { vis = true; on() } else if (!e.isIntersecting && vis) { vis = false; off?.() }
    }), { threshold })
    io.observe(el)
    observers.push(io)
  }
  const replay = (el: Element) => { el.classList.remove('live'); void (el as El).offsetWidth; el.classList.add('live') }

  /* ---- One-line headline fitting ---- */
  function fitAll() {
    $$('.fit').forEach(el => {
      el.style.fontSize = ''
      const max = parseFloat(getComputedStyle(el).fontSize)
      const avail = el.clientWidth, need = el.scrollWidth
      if (need > avail && avail > 0) el.style.fontSize = Math.floor((max * avail / need) * 0.985) + 'px'
    })
  }
  fitAll()
  document.fonts?.ready.then(fitAll)
  let rz: number | undefined
  listen(window, 'resize', () => { cancel(rz); rz = later(fitAll, 80) })

  /* ---- .live while on screen ---- */
  if (!RM) $$('[data-live]').forEach(el => watch(el, () => el.classList.add('live'), () => el.classList.remove('live')))

  /* ---- Count up ---- */
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count!), pre = el.dataset.pre ?? '', suf = el.dataset.suf ?? ''
    const fmt = (n: number) => pre + Math.round(n).toLocaleString('en-US') + suf
    el.textContent = fmt(target)
    if (RM) return
    let done = false
    watch(el, () => {
      if (done && !el.hasAttribute('data-repeat')) return
      done = true
      const t0 = performance.now()
      const step = (t: number) => { const p = Math.min(1, (t - t0) / 1400); el.textContent = fmt(target * (1 - Math.pow(1 - p, 3))); if (p < 1) frame(step) }
      step(t0)
    })
  })

  /* ---- Flow centerpiece (tabbed steps that auto-advance) ---- */
  $$('[data-flow]').forEach(flow => {
    const btns = $$<HTMLButtonElement>('.flow-steps button', flow)
    const dur = parseFloat(flow.dataset.dur ?? '5.5') * 1000
    let idx = 0, timer: number | undefined, visible = false
    flow.style.setProperty('--dur', dur / 1000 + 's')
    function schedule() { cancel(timer); if (RM || !visible) return; timer = later(() => show((idx + 1) % btns.length), dur) }
    function show(i: number) {
      idx = i
      btns.forEach((b, j) => {
        const on = j === i
        b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1
        const sc = document.getElementById(b.getAttribute('aria-controls')!)!
        sc.hidden = !on
        if (on && !RM) { replay(sc); const bar = $('.bar i', b); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '' } }
      })
      schedule()
    }
    btns.forEach((b, i) => {
      listen(b, 'click', () => show(i))
      listen(b, 'keydown', e => {
        const k = (e as KeyboardEvent).key
        const d = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0
        if (d) { e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].focus(); show(n) }
      })
    })
    watch(flow, () => { visible = true; flow.classList.add('playing'); show(idx) }, () => { visible = false; flow.classList.remove('playing'); cancel(timer) })
  })

  /* ---- Typing search mini (home "Talent" door) ---- */
  const TYPER = [
    { q: 'AI engineer, remote', jobs: [['S', '#1E88D6', 'AI Software Engineer', '96%'], ['P', '#374151', 'Senior AI Engineer, Agents', '92%']] },
    { q: 'Backend, Pune', jobs: [['P', '#374151', 'Backend Engineer, DocAI', '94%'], ['A', '#7C2D12', 'SAP FICO Consultant', '81%']] },
    { q: 'Founding ML engineer', jobs: [['L', '#6A3FD1', 'Founding ML Engineer, CV', '97%'], ['T', '#C2410C', 'Applied AI, 3D', '90%']] },
  ]
  $$('[data-typer]').forEach(el => {
    const text = $('.typer-text', el)!, rows = $$('.mini-job', el)
    let k = 0, running = false, t: number | undefined
    const setJobs = (set: typeof TYPER[number]) => rows.forEach((r, i) => {
      const [letter, color, title, match] = set.jobs[i]
      r.innerHTML = `<span class="lg" style="background:${color}">${letter}</span><b>${title}</b><span class="m">${match}</span>`
    })
    function cycle() {
      if (!running) return
      const set = TYPER[k % TYPER.length], s = set.q
      let i = 0
      rows.forEach(r => r.classList.add('swap'))
      const type = () => {
        if (!running) return
        text.textContent = s.slice(0, ++i)
        if (i < s.length) t = later(type, 55)
        else {
          setJobs(set)
          rows.forEach((r, n) => later(() => r.classList.remove('swap'), 120 + n * 140))
          t = later(() => { k++; cycle() }, 2600)
        }
      }
      type()
    }
    setJobs(TYPER[0]); text.textContent = TYPER[0].q
    if (RM) return
    watch(el, () => { if (!running) { running = true; cycle() } }, () => { running = false; cancel(t) })
  })

  /* ---- Status cyclers (requisitions) ---- */
  const STAGES = ['Intake', 'Screening', 'Submitted', 'Deployed']
  $$('[data-cycle]').forEach(el => {
    const items = $$('[data-row]', el)
    let t: number | undefined
    const paint = (row: El, s: number) => {
      const st = $('.status', row)!
      st.dataset.s = String(s); st.textContent = STAGES[s]
      $$('.prog i', row).forEach((b, i) => b.classList.toggle('f', i <= s))
    }
    items.forEach(r => paint(r, +r.dataset.row!))
    if (RM) return
    const tick = () => {
      const r = items[Math.floor(Math.random() * items.length)], s = (+r.dataset.row! + 1) % 4
      r.dataset.row = String(s); paint(r, s)
      const dep = $('[data-deployed]', el)
      if (dep && s === 3) dep.textContent = String(+dep.textContent! + 1)
      t = later(tick, 1500)
    }
    watch(el, () => { cancel(t); t = later(tick, 900) }, () => cancel(t))
  })

  /* ---- Rails: active step sweeps ---- */
  $$('.rail[data-loop]').forEach(rail => {
    const lis = $$('li', rail)
    let i = 0, t: number | undefined
    const paint = () => lis.forEach((li, j) => { li.classList.toggle('done', j < i); li.classList.toggle('on', j === i) })
    paint()
    if (RM) return
    const tick = () => { i = (i + 1) % (lis.length + 1); paint(); t = later(tick, i === lis.length ? 1400 : 800) }
    watch(rail, () => { cancel(t); i = 0; paint(); t = later(tick, 1000) }, () => cancel(t))
  })

  /* ---- Story thread replay ---- */
  if (!RM) $$('[data-thread]').forEach(el => {
    let t: number | undefined
    watch(el, () => { replay(el); t = every(() => replay(el), 9000) }, () => { stopEvery(t); el.classList.remove('live') })
  })

  /* ---- Canvases ---- */
  function sizeCanvas(c: HTMLCanvasElement) {
    const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2)
    c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d)
    const ctx = c.getContext('2d')!
    ctx.setTransform(d, 0, 0, d, 0, 0)
    return { ctx, w: r.width, h: r.height }
  }

  // Constellation network
  $$<HTMLCanvasElement>('canvas[data-net]').forEach(c => {
    type Node = { x: number; y: number; vx: number; vy: number; r: number; hot: boolean }
    let dims = sizeCanvas(c), nodes: Node[] = [], raf: number | undefined, running = false
    const density = parseFloat(c.dataset.net || '1'), tone = !!c.dataset.tone
    function init() {
      dims = sizeCanvas(c); nodes = []
      const n = Math.round(Math.min(90, (dims.w * dims.h) / 9000) * density)
      for (let i = 0; i < n; i++) nodes.push({ x: Math.random() * dims.w, y: Math.random() * dims.h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.8 + 1, hot: Math.random() < 0.08 })
    }
    function draw() {
      const { ctx, w, h } = dims, L = Math.min(140, w / 5)
      const base = tone ? getComputedStyle(c).getPropertyValue('--bar').trim() || '#141A4D' : '#F3F2EE'
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (running) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1 }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < L) { ctx.globalAlpha = (tone ? 0.42 : 0.28) * (1 - d / L); ctx.strokeStyle = base; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke() }
        }
      }
      nodes.forEach(a => { ctx.globalAlpha = a.hot ? 1 : 0.85; ctx.fillStyle = a.hot ? '#F26522' : base; ctx.beginPath(); ctx.arc(a.x, a.y, a.hot ? a.r + 1.5 : a.r, 0, 6.283); ctx.fill() })
      ctx.globalAlpha = 1
      if (running) raf = frame(draw)
    }
    init(); draw()
    listen(window, 'resize', () => { init(); draw() })
    if (RM) return
    watch(c, () => { if (!running) { running = true; draw() } }, () => { running = false; if (raf) cancelAnimationFrame(raf) })
  })

  // Hiring funnel: many applicants in, a few bought-in builders out
  $$<HTMLCanvasElement>('canvas[data-funnel]').forEach(c => {
    type P = { x: number; y: number; v: number; stage: number; alive: boolean; gold: boolean; fade?: number }
    let dims = sizeCanvas(c), ps: P[] = [], raf: number | undefined, running = false
    const cut = [0.25, 0.5, 0.75], keep = [0.42, 0.3, 0.22]
    const half = (x: number) => { const p = Math.min(1, Math.max(0, x / dims.w)); return dims.h * 0.36 * (1 - p) + dims.h * 0.035 * p }
    const cy = () => dims.h * 0.42
    const spawn = (x?: number): P => ({ x: x || -4, y: cy() + (Math.random() * 2 - 1) * half(x || 0), v: 1.1 + Math.random() * 1.1, stage: 0, alive: true, gold: false })
    function init() { dims = sizeCanvas(c); ps = []; for (let i = 0; i < 220; i++) ps.push(spawn(Math.random() * dims.w)) }
    function draw() {
      const { ctx, w, h } = dims, mid = cy()
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(243,242,238,.18)'; ctx.lineWidth = 1.2
      ;[1, -1].forEach(s => { ctx.beginPath(); for (let x = 0; x <= w; x += 8) { const y = mid + s * (half(x) + 8); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y) } ctx.stroke() })
      ctx.setLineDash([3, 6])
      cut.forEach(f => { ctx.beginPath(); ctx.moveTo(w * f, mid - half(w * f) - 8); ctx.lineTo(w * f, mid + half(w * f) + 8); ctx.stroke() })
      ctx.setLineDash([])
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        if (running) {
          p.x += p.v
          if (Math.abs(p.y - mid) > half(p.x)) p.y = mid + (p.y - mid) * 0.985; else p.y += (Math.random() - 0.5) * 0.6
          if (p.stage < 3 && p.x > w * cut[p.stage]) { if (Math.random() > keep[p.stage]) p.alive = false; p.stage++; if (p.stage === 3) p.gold = true }
          if (!p.alive) { p.fade = (p.fade || 1) - 0.06; if (p.fade <= 0) { ps[i] = spawn(); continue } }
          if (p.x > w + 6) { ps[i] = spawn(); continue }
        }
        const a = p.alive ? 0.9 : Math.max(0, p.fade || 0) * 0.6
        ctx.fillStyle = p.gold ? `rgba(242,101,34,${a})` : `rgba(243,242,238,${a})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.gold ? 3.2 : 1.8, 0, 6.283); ctx.fill()
      }
      if (running) raf = frame(draw)
    }
    init(); draw()
    listen(window, 'resize', () => { init(); draw() })
    if (RM) return
    watch(c, () => { if (!running) { running = true; draw() } }, () => { running = false; if (raf) cancelAnimationFrame(raf) })
  })

  /* ---- Odometer digits: rest state shows the final number ---- */
  $$('[data-odo]').forEach(el => {
    const val = el.dataset.odo!, cols: El[] = []
    el.classList.add('odo'); el.setAttribute('aria-label', val); el.innerHTML = ''
    val.split('').forEach(ch => {
      const c = document.createElement('span'); c.className = 'col'; c.setAttribute('aria-hidden', 'true')
      if (/\d/.test(ch)) { for (let d = 0; d <= 9; d++) { const s = document.createElement('span'); s.textContent = String(d); c.appendChild(s) } c.dataset.d = ch }
      else { const s = document.createElement('span'); s.textContent = ch; c.appendChild(s) }
      el.appendChild(c); cols.push(c)
    })
    const set = (zero: boolean) => cols.forEach((c, i) => { if (c.dataset.d === undefined) return; c.style.transitionDelay = i * 120 + 'ms'; c.style.transform = `translateY(${-(zero ? 0 : +c.dataset.d)}em)` })
    set(false)
    if (RM) return
    watch(el.closest('.stile') ?? el, () => {
      cols.forEach(c => { c.style.transition = 'none' }); set(true); void el.offsetWidth
      cols.forEach(c => { c.style.transition = '' }); frame(() => set(false))
    }, undefined, 0.3)
  })

  /* ---- Day strips fill in sequence ---- */
  $$('[data-days]').forEach(el => {
    const n = +el.dataset.days!, fill = +el.dataset.fill!
    let ts: number[] = []
    el.innerHTML = ''
    for (let i = 0; i < n; i++) el.appendChild(document.createElement('i'))
    const cells = $$('i', el)
    const paint = (k: number) => cells.forEach((c, i) => {
      c.classList.toggle('on', i < k && !(i === fill - 1 && el.dataset.end))
      c.classList.toggle('end', !!el.dataset.end && i === fill - 1 && k >= fill)
    })
    paint(fill)
    if (RM) return
    watch(el, () => {
      ts.forEach(cancel); ts = []; paint(0)
      for (let k = 1; k <= fill; k++) ts.push(later(() => paint(k), 250 + k * (1100 / fill)))
    }, () => ts.forEach(cancel), 0.3)
  })

  /* ---- Guarantee ring ---- */
  if (!RM) $$('[data-ring]').forEach(el => {
    const fg = $<SVGCircleElement>('.fg', el)!
    watch(el, () => {
      fg.style.transition = 'none'; fg.style.strokeDashoffset = '113.1'; fg.getBoundingClientRect()
      fg.style.transition = ''; frame(() => { fg.style.strokeDashoffset = '0' })
    }, undefined, 0.3)
  })

  /* ---- Talent pool dots light up ---- */
  $$('[data-pool]').forEach(el => {
    const n = +el.dataset.pool!
    let t: number | undefined
    el.innerHTML = ''
    for (let i = 0; i < n; i++) el.appendChild(document.createElement('i'))
    const dots = $$('i', el)
    dots.forEach((d, i) => { d.className = (i * 7) % 5 === 0 ? '' : 'on' })
    dots[11].className = 'hot'; dots[29].className = 'hot'
    if (RM) return
    const tick = () => { const d = dots[Math.floor(Math.random() * dots.length)]; d.className = d.className === 'on' ? '' : Math.random() < 0.12 ? 'hot' : 'on'; t = later(tick, 140) }
    watch(el, () => { cancel(t); tick() }, () => cancel(t), 0.3)
  })

  /* ---- Typed pitch ---- */
  $$('[data-pitch]').forEach(el => {
    const lines = el.dataset.pitch!.split('|'), out = $('.t', el)!
    let k = 0, t: number | undefined, run = false
    out.textContent = lines[0]
    if (RM) return
    function type() {
      if (!run) return
      const s = lines[k % lines.length]
      let i = 0
      const step = () => { if (!run) return; out.textContent = s.slice(0, ++i); t = i < s.length ? later(step, 28) : later(() => { k++; type() }, 2600) }
      step()
    }
    watch(el, () => { run = true; type() }, () => { run = false; cancel(t) }, 0.3)
  })

  /* ---- Keyword filter: buzzwords struck, real signal kept ---- */
  $$('[data-kw]').forEach(el => {
    const chips = $$('span', el)
    let ts: number[] = []
    chips.forEach(c => c.classList.add(c.dataset.keep ? 'keep' : 'x'))
    if (RM) return
    function run() {
      ts.forEach(cancel); ts = []
      chips.forEach(c => c.classList.remove('x', 'keep'))
      chips.forEach((c, i) => ts.push(later(() => c.classList.add(c.dataset.keep ? 'keep' : 'x'), 500 + i * 380)))
      ts.push(later(run, 500 + chips.length * 380 + 2600))
    }
    watch(el, run, () => ts.forEach(cancel), 0.3)
  })

  /* ---- Stage tracks ---- */
  $$('[data-track]').forEach(el => {
    const steps = $$('.tstep', el)
    let i = steps.length - 1, t: number | undefined
    el.style.setProperty('--n', String(steps.length))
    const paint = () => {
      steps.forEach((s, j) => { s.classList.toggle('done', j < i); s.classList.toggle('on', j === i) })
      el.style.setProperty('--p', String(steps.length > 1 ? Math.min(1, (i + 0.5) / steps.length) : 1))
    }
    paint()
    if (RM) return
    const tick = () => { i = (i + 1) % steps.length; paint(); t = later(tick, i === steps.length - 1 ? 1600 : 900) }
    watch(el, () => { cancel(t); i = 0; paint(); t = later(tick, 800) }, () => cancel(t), 0.3)
  })

  /* ---- Role tickers ---- */
  $$('[data-ticker]').forEach(el => {
    const items = Array.from(el.children)
    const ms = +el.dataset.ticker! || 2400
    let i = 0, t: number | undefined
    items.forEach(it => it.classList.remove('in', 'out'))
    items[0]?.classList.add('in')
    if (RM || items.length < 2) return
    const step = () => {
      const cur = items[i], nx = items[(i + 1) % items.length]
      cur.classList.remove('in'); cur.classList.add('out')
      nx.classList.remove('out'); nx.classList.add('in')
      later(() => cur.classList.remove('out'), 600)
      i = (i + 1) % items.length
    }
    watch(el, () => { if (t == null) t = every(step, ms) }, () => { stopEvery(t); t = undefined }, 0)
  })

  /* ---- Typing placeholder in a search input ---- */
  $$<HTMLInputElement>('[data-type-ph]').forEach(el => {
    if (RM) return
    const lines = el.dataset.typePh!.split('|')
    let k = 0, i = 0, del = false
    const idle = () => !el.value && document.activeElement !== el
    const tick = () => {
      if (!idle()) { later(tick, 400); return }
      const s = lines[k % lines.length]
      if (!del) {
        i++; el.placeholder = s.slice(0, i) + (i < s.length ? '|' : '')
        if (i >= s.length) { del = true; later(tick, 1600); return }
        later(tick, 45)
      } else {
        i--; el.placeholder = s.slice(0, i) + '|'
        if (i <= 0) { del = false; k++; el.placeholder = ''; later(tick, 250); return }
        later(tick, 22)
      }
    }
    el.placeholder = ''
    later(tick, 500)
    listen(el, 'focus', () => { el.placeholder = lines[1] ?? lines[0] })
    listen(el, 'blur', () => { if (!el.value) { i = 0; del = false } })
  })

  /* ---- Tabs ---- */
  $$('[data-tabs]').forEach(tabsRoot => {
    const tabs = $$('[role=tab]', tabsRoot)
    let idx = 0, paused = false, at: number | undefined
    const select = (t: El) => tabs.forEach(x => {
      const on = x === t
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1
      document.getElementById(x.getAttribute('aria-controls')!)!.hidden = !on
    })
    const auto = +(tabsRoot.dataset.auto ?? 0)
    if (auto && !RM) {
      at = every(() => { if (!paused) { idx = (idx + 1) % tabs.length; select(tabs[idx]) } }, auto)
      listen(tabsRoot, 'mouseenter', () => { paused = true })
      listen(tabsRoot, 'mouseleave', () => { paused = false })
    }
    tabs.forEach((t, i) => {
      listen(t, 'click', () => { idx = i; stopEvery(at); at = undefined; select(t) })
      listen(t, 'keydown', e => {
        const k = (e as KeyboardEvent).key, d = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0
        if (d) { e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n) }
      })
    })
  })

  /* ---- Company-side note forms ----
     No backend endpoint takes these notes yet, so a valid note hands the visitor a booking
     link. When one exists, POST the fields here and show the "sent" state instead. */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  function validate(form: HTMLFormElement) {
    let first: Field | null = null
    $$('.field', form).forEach(f => {
      const el = $<Field>('input, select, textarea', f)
      if (!el) return
      const v = (el.value || '').trim()
      const file = el instanceof HTMLInputElement && el.type === 'file' ? el.files?.[0] : undefined
      const bad =
        (el.required && !v) ||
        (!!v && el.type === 'email' && !EMAIL_RE.test(v)) ||
        (!!file && (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx?)$/i.test(file.name))) ||
        (!!v && el.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v) && !/^[\w.-]+\.\w{2,}\/?\S*$/.test(v))
      f.classList.toggle('invalid', bad)
      el.setAttribute('aria-invalid', String(bad))
      if (bad && !first) first = el
    })
    ;(first as Field | null)?.focus()
    return !first
  }
  $$<HTMLFormElement>('form[data-form]').forEach(form => {
    $$<Field>('input, select, textarea', form).forEach(el => listen(el, 'input', () => { if (el.closest('.field')?.classList.contains('invalid')) validate(form) }))
    listen(form, 'submit', e => {
      e.preventDefault()
      if (!validate(form)) return
      const done = document.createElement('div')
      done.className = 'done'; done.tabIndex = -1
      done.innerHTML = `<h3 class="d2" style="font-size:1.8rem">One last step.</h3><p style="color:var(--ink-2)">Pick a 15-minute slot and we'll pick this up from your note.</p><a class="btn btn-primary" href="${BOOKING_URL}" target="_blank" rel="noopener">Book a 15-minute call</a>`
      form.hidden = true
      form.after(done)
      done.focus()
    })
  })
  $$<HTMLInputElement>('.file-drop input[type=file]').forEach(inp => listen(inp, 'change', () => {
    const f = inp.files?.[0]
    inp.parentElement!.querySelector('.fd-t')!.textContent = f ? f.name : 'Upload PDF or Word, up to 5 MB'
    inp.parentElement!.classList.toggle('has', !!f)
  }))

  /* ---- Copy buttons ---- */
  $$<HTMLButtonElement>('[data-copy]').forEach(b => listen(b, 'click', () => {
    const label = b.textContent
    navigator.clipboard?.writeText(b.dataset.copy!).then(() => {
      b.textContent = 'Copied'
      later(() => { b.textContent = label }, 1600)
    })
  }))

  return () => {
    timers.forEach(id => { clearTimeout(id); clearInterval(id) })
    frames.forEach(id => cancelAnimationFrame(id))
    observers.forEach(io => io.disconnect())
    unlisten.forEach(off => off())
  }
}
