"use client"

import * as React from "react"

/**
 * Strobe Diva Footer — screen-printed fashion poster footer.
 * React-only. Math helpers exported for tests.
 */

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

export const springStep = (
  x: number,
  v: number,
  target: number,
  k: number,
  zeta: number,
  dt: number,
): [number, number] => {
  const c = 2 * zeta * Math.sqrt(k)
  const a = k * (target - x) - c * v
  const nv = v + a * dt
  return [x + nv * dt, nv]
}

export const settled = (x: number, v: number, target: number, eps: number = 0.02): boolean =>
  Math.abs(x - target) < eps && Math.abs(v) < eps * 6

export const stiffness = (i: number): number => 200 / (1 + i * 0.5)

export const fanAngle = (i: number, step: number, spread: number, open: boolean): number =>
  open && i > 0 ? i * step * spread : 0

export const armAngle = (i: number, dir: number, step: number, spread: number, swing: number, open: boolean): number =>
  i === 0 ? 0 : clamp(dir * fanAngle(i, step, spread, open) + swing, -165, 165)

export const echoScale = (i: number, opened: number): number => 1 + i * 0.06 * clamp(opened, 0, 1)

export const pointerDrive = (nx: number, ny: number): { swing: number; spread: number } => ({
  swing: clamp((nx - 0.5) * 2, -1, 1) * 18,
  spread: clamp(1 + (0.5 - ny) * 0.5, 0.74, 1.24),
})

export const hexRgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? "").trim())
  if (!m) return null
  const s = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}

export const luma = (r: number, g: number, b: number): number => (0.299 * r + 0.587 * g + 0.114 * b) / 255

export const tone = (l: number, mid: number, k: number): number => 1 / (1 + Math.exp(-(l - mid) * k))

export const hash2 = (x: number, y: number, seed: number): number => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export const grain = (x: number, y: number, cell: number, seed: number): number => {
  const c = cell > 1 ? cell : 1
  return 0.62 * hash2(Math.floor(x / c), Math.floor(y / c), seed) + 0.38 * hash2(x, y, seed + 7)
}

export const keyMask = (lum: Float32Array, w: number, h: number, light: boolean, thresh: number): Uint8Array => {
  const n = w * h
  const bg = new Uint8Array(n)
  const q = new Int32Array(n)
  let head = 0
  let tail = 0
  const push = (i: number) => {
    if (bg[i]) return
    if (light ? lum[i] >= thresh : lum[i] <= thresh) {
      bg[i] = 1
      q[tail++] = i
    }
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (head < tail) {
    const i = q[head++]
    const x = i % w
    if (x > 0) push(i - 1)
    if (x < w - 1) push(i + 1)
    if (i >= w) push(i - w)
    if (i < n - w) push(i + w)
  }
  const m = new Uint8Array(n)
  for (let i = 0; i < n; i++) m[i] = bg[i] ? 0 : 1
  return m
}

export const dilate = (m: Uint8Array, w: number, h: number, r: number): Uint8Array => {
  const R = Math.max(0, Math.round(r))
  if (!R) return m.slice()
  const a = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    let last = -1e9
    for (let x = 0; x < w; x++) {
      if (m[row + x]) last = x
      if (x - last <= R) a[row + x] = 1
    }
    last = 1e9
    for (let x = w - 1; x >= 0; x--) {
      if (m[row + x]) last = x
      if (last - x <= R) a[row + x] = 1
    }
  }
  const b = new Uint8Array(w * h)
  for (let x = 0; x < w; x++) {
    let last = -1e9
    for (let y = 0; y < h; y++) {
      if (a[y * w + x]) last = y
      if (y - last <= R) b[y * w + x] = 1
    }
    last = 1e9
    for (let y = h - 1; y >= 0; y--) {
      if (a[y * w + x]) last = y
      if (last - y <= R) b[y * w + x] = 1
    }
  }
  return b
}

export const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"]

export const barcodeModules = (digits: string): string => {
  const d = String(digits ?? "").replace(/\D/g, "")
  if (!d) return ""
  let m = "101"
  for (const c of d) m += EAN_L[+c]
  return m + "101"
}

export const barcodeBars = (modules: string): { x: number; w: number }[] => {
  const bars: { x: number; w: number }[] = []
  let i = 0
  while (i < modules.length) {
    if (modules[i] === "1") {
      let j = i
      while (j < modules.length && modules[j] === "1") j++
      bars.push({ x: i, w: j - i })
      i = j
    } else i++
  }
  return bars
}

export const fitScale = (textW: number, textH: number, boxW: number, boxH: number): { sx: number; sy: number } => {
  if (!(textW > 0) || !(textH > 0) || !(boxW > 0) || !(boxH > 0)) return { sx: 0, sy: 0 }
  const sx = boxW / textW
  const sy = clamp(boxH / textH, sx * 0.8, sx * 2.6)
  return { sx, sy }
}

export const figureBox = (
  w: number,
  h: number,
  aspect: number,
  headY: number,
  narrow: boolean,
): { F: number; W: number; left: number; top: number; disc: number; discTop: number; band: number } => {
  const a = aspect > 0.15 ? aspect : 0.15
  const F = Math.max(0, Math.min(h * 0.9, (w * (narrow ? 0.92 : 0.5)) / a))
  const W = F * a
  const top = h - F
  const disc = Math.min(F * 0.56, w * 0.9)
  return { F, W, left: (w - W) / 2, top, disc, discTop: top + F * clamp(headY, 0, 1) - disc / 2, band: h * 0.44 }
}

export const STORY = { head: 0, disc: 80, letter: 220, letterStep: 46, figure: 380, scan: 950, arms: 120, armStep: 70, columns: 1000, legal: 1100 }


const PRESETS: { [k: string]: StrobePalette } = {
  crimson: { paper: "#efeae2", ink: "#0f0e0d", accent: "#c9171e", figure: "#0f0e0d", figureLight: "#f5f2eb" },
  midnight: { paper: "#141313", ink: "#ebe6dc", accent: "#e3211b", figure: "#0e0d0d", figureLight: "#efe9de" },
  cobalt: { paper: "#e9ecf0", ink: "#0a0f24", accent: "#1f3fd9", figure: "#0a0f24", figureLight: "#f3f5f8" },
  gilt: { paper: "#f1ece1", ink: "#171310", accent: "#c08f2c", figure: "#171310", figureLight: "#f7f2e7" },
  shadjewel: { paper: "#fff5f0", ink: "#2a1810", accent: "#f08080", figure: "#2a1810", figureLight: "#ffdab9" },
}

const DISPLAY_FONT = 'Impact, Haettenschweiler, "Franklin Gothic Medium", "Arial Narrow", "Helvetica Neue", Arial, sans-serif'
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace'

const DEFAULT_COLUMNS: StrobeColumn[] = [
  {
    title: "فروشگاه",
    links: [
      { label: "محصولات", href: "/محصولات" },
      { label: "دسته‌ها", href: "/دسته-ها" },
      { label: "درباره ما", href: "/درباره-ما" },
      { label: "تماس", href: "/تماس" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "راهنمای سایز", href: "/راهنمای-سایز" },
      { label: "ارسال", href: "/ارسال" },
      { label: "مرجوعی", href: "/مرجوعی" },
      { label: "ضمانت و اصالت", href: "/ضمانت" },
      { label: "سوالات متداول", href: "/سوالات-متداول" },
    ],
  },
  {
    title: "قانونی",
    links: [
      { label: "شرایط استفاده", href: "/شرایط-استفاده" },
      { label: "حریم خصوصی", href: "/حریم-خصوصی" },
    ],
  },
]

const DEFAULT_LEGAL_LINKS: StrobeLink[] = [
  { label: "شرایط استفاده", href: "/شرایط-استفاده" },
  { label: "حریم خصوصی", href: "/حریم-خصوصی" },
]

const GESTURES = ["open", "peace", "point", "horns", "open", "fist", "peace", "point", "open", "horns"]


const SDF_CSS = `
.sdf { position: relative; isolation: isolate; width: 100%; display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; background: var(--sdf-paper); color: var(--sdf-ink); font-family: var(--sdf-mono); font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
.sdf *, .sdf *::before, .sdf *::after { box-sizing: border-box; }
.sdf[data-layout="narrow"] { grid-template-rows: auto auto auto auto; height: auto !important; min-height: 0 !important; }
.sdf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.sdf-head { position: relative; z-index: 5; display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 16px; padding: 22px 28px 0; min-height: 104px; }
.sdf[data-layout="narrow"] .sdf-head { padding: 18px 18px 0; min-height: 88px; }
.sdf-seal { width: 64px; height: 64px; display: block; }
.sdf[data-layout="narrow"] .sdf-seal { width: 52px; height: 52px; }
.sdf-seal-ring { transform-origin: 50px 50px; }
.sdf-seal:hover .sdf-seal-ring { animation: sdf-spin 14s linear infinite; }
.sdf-seal text { font-family: var(--sdf-mono); fill: currentColor; }
.sdf-seal .sdf-seal-mark { font-family: var(--sdf-display); font-weight: 900; }
.sdf-year { text-align: center; font-size: 12px; letter-spacing: 0.26em; text-transform: uppercase; padding-top: 8px; white-space: nowrap; }
.sdf-year b { font-weight: 400; display: block; font-size: 17px; letter-spacing: 0.3em; margin-top: 2px; }
.sdf-code { justify-self: end; width: 122px; text-align: right; }
.sdf[data-layout="narrow"] .sdf-code { width: 96px; }
.sdf-code svg { display: block; width: 100%; height: 34px; }
.sdf-code rect { fill: currentColor; transform-origin: 50% 100%; transform-box: fill-box; }
.sdf-code span { display: block; font-size: 10px; letter-spacing: 0.32em; margin-top: 3px; white-space: nowrap; }
.sdf-stage { position: relative; overflow: hidden; touch-action: pan-y; }
.sdf[data-layout="narrow"] .sdf-stage { height: clamp(430px, 118vw, 620px); }
.sdf-disc { position: absolute; z-index: 1; left: var(--sdf-disc-left, 50%); top: var(--sdf-disc-top); width: var(--sdf-disc); height: var(--sdf-disc); margin: 0; padding: 0; border: 0; border-radius: 50%; background: var(--sdf-accent); cursor: pointer; transform: translate(calc(-50% + var(--sdf-dx, 0px)), var(--sdf-dy, 0px)); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); -webkit-tap-highlight-color: transparent; }
.sdf-disc::before { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--sdf-paper); opacity: 0; transition: opacity 0.3s; }
.sdf-disc:hover::before { opacity: 0.35; inset: 6%; }
.sdf-disc:focus-visible { outline: 2px solid var(--sdf-ink); outline-offset: 4px; }
.sdf-disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--sdf-accent); opacity: 0; pointer-events: none; }
.sdf-disc[data-pulse="1"]::after { animation: sdf-pulse 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sdf-disc svg { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 50%; pointer-events: none; }
.sdf-band { position: absolute; z-index: 2; left: 0; right: 0; bottom: 0; height: var(--sdf-band); background: var(--sdf-ink); overflow: hidden; }
.sdf-word { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.sdf-word text { font-family: var(--sdf-display); font-weight: 900; font-size: 100px; fill: var(--sdf-accent); }
.sdf-word .sdf-measure { visibility: hidden; }
.sdf-let { transform-box: fill-box; transform-origin: 50% 85%; }
.sdf-word-lens { opacity: 0; transition: opacity 0.4s; }
.sdf-band[data-lens="1"] .sdf-word-lens { opacity: 1; }
.sdf-photo { position: absolute; z-index: 3; inset: 0; width: 100%; height: 100%; max-width: none; pointer-events: none; display: block; }
.sdf-figure { position: absolute; z-index: 3; left: 50%; bottom: 0; height: var(--sdf-fig); width: calc(var(--sdf-fig) * 0.4878); transform: translateX(-50%); pointer-events: none; }
.sdf-figure svg { display: block; width: 100%; height: 100%; overflow: visible; }
.sdf-flank { position: absolute; z-index: 4; top: 10px; display: grid; grid-auto-flow: column; gap: 36px; }
.sdf-flank-l { left: 28px; }
.sdf-flank-r { right: 28px; text-align: right; }
.sdf[data-layout="mid"] .sdf-flank { grid-auto-flow: row; gap: 22px; }
.sdf-cols { position: relative; z-index: 2; background: var(--sdf-ink); color: var(--sdf-paper); display: grid; grid-template-columns: 1fr 1fr; gap: 26px 18px; padding: 26px 18px 30px; }
.sdf-col h3 { margin: 0 0 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--sdf-accent); }
.sdf-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.sdf-col a { color: inherit; text-decoration: none; font-size: 12.5px; letter-spacing: 0.02em; background-image: linear-gradient(var(--sdf-accent), var(--sdf-accent)); background-repeat: no-repeat; background-size: 0 1px; background-position: 0 100%; transition: background-size 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.2s; padding-bottom: 1px; }
.sdf-flank-r .sdf-col a { background-position: 100% 100%; }
.sdf-col a:hover, .sdf-col a:focus-visible { background-size: 100% 1px; color: var(--sdf-accent); outline: none; }
.sdf-legal { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 56px; padding: 0 28px; background: var(--sdf-ink); color: var(--sdf-paper); font-size: 11px; letter-spacing: 0.08em; }
.sdf[data-layout="narrow"] .sdf-legal { flex-wrap: wrap; padding: 14px 18px; gap: 10px 18px; }
.sdf-legal::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--sdf-paper); opacity: 0.18; }
.sdf-floor { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.sdf-floor line { stroke: var(--sdf-paper); stroke-width: 1; opacity: 0.16; vector-effect: non-scaling-stroke; }
.sdf-legal > :not(.sdf-floor) { position: relative; white-space: nowrap; }
.sdf-legal-links { display: flex; gap: 18px; margin: 0; padding: 0; list-style: none; }
.sdf-legal a { color: inherit; text-decoration: none; opacity: 0.78; transition: opacity 0.2s, color 0.2s; }
.sdf-legal a:hover, .sdf-legal a:focus-visible { opacity: 1; color: var(--sdf-accent); outline: none; }
.sdf-top { display: inline-flex; align-items: center; gap: 10px; margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; letter-spacing: inherit; text-transform: uppercase; cursor: pointer; }
.sdf-top svg { width: 14px; height: 14px; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.sdf-top:hover svg, .sdf-top:focus-visible svg { transform: translateY(-3px); }
.sdf-top:hover, .sdf-top:focus-visible { color: var(--sdf-accent); outline: none; }
.sdf-top:focus-visible, .sdf-legal a:focus-visible, .sdf-col a:focus-visible { box-shadow: 0 0 0 2px var(--sdf-accent); border-radius: 2px; }
.sdf-grain { position: absolute; inset: 0; z-index: 8; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: overlay; opacity: var(--sdf-grain); }
.sdf[data-seen="0"] .sdf-ent, .sdf[data-seen="0"] .sdf-let, .sdf[data-seen="0"] .sdf-code rect { opacity: 0; }
.sdf[data-seen="1"] .sdf-ent { animation: sdf-up 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-ent-disc { animation: sdf-rise 1s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-ent-fig { animation: sdf-print 0.75s cubic-bezier(0.4, 0, 0.2, 1) backwards; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-let { animation: sdf-stamp 0.55s cubic-bezier(0.16, 1.3, 0.3, 1) both; animation-delay: var(--d); }
.sdf[data-seen="1"] .sdf-code rect { animation: sdf-bar 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d); }
@keyframes sdf-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes sdf-rise { from { opacity: 0; transform: translate(-50%, 6%) scale(0.72); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes sdf-print { from { clip-path: inset(-40% -80% 100% -80%); } to { clip-path: inset(-40% -80% 0 -80%); } }
@keyframes sdf-stamp { from { opacity: 0; transform: scale(1.28) translateY(-3%); } 55% { opacity: 1; } to { opacity: 1; transform: none; } }
@keyframes sdf-bar { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: none; } }
@keyframes sdf-spin { to { transform: rotate(360deg); } }
@keyframes sdf-pulse { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(1.5); } }
@media (prefers-reduced-motion: reduce) {
  .sdf .sdf-ent, .sdf .sdf-ent-disc, .sdf .sdf-ent-fig, .sdf .sdf-let, .sdf .sdf-code rect { animation: none !important; opacity: 1 !important; transform: none !important; clip-path: none !important; }
  .sdf .sdf-ent-disc { transform: translate(-50%, 0) !important; }
  .sdf-disc { transition: none; }
  .sdf-seal:hover .sdf-seal-ring { animation: none; }
  .sdf-disc[data-pulse="1"]::after { animation: none; }
}
`


function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function Hand(props: { x: number; y: number; dx: number; dy: number; gesture: string; color: string }) {
  const { x, y, dx, dy, gesture, color } = props
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const base = Math.atan2(uy, ux)
  const px = x + ux * 9
  const py = y + uy * 9
  let fingers: number[] = []
  let flen = 19
  let palm = 9.5
  let thumb: [number, number] | null = [-80, 13]
  if (gesture === "open") fingers = [-38, -13, 12, 36]
  else if (gesture === "peace") { fingers = [-15, 15]; flen = 20; thumb = [-76, 10] }
  else if (gesture === "point") { fingers = [0]; flen = 21; thumb = [-76, 11] }
  else if (gesture === "horns") { fingers = [-36, 36]; flen = 19; thumb = [-76, 10] }
  else { palm = 11.5; thumb = [-62, 7] }
  const deg = Math.PI / 180
  const line = (a: number, l: number, key: string) => (
    <line key={key} x1={px} y1={py} x2={px + Math.cos(base + a * deg) * l} y2={py + Math.sin(base + a * deg) * l} stroke={color} strokeWidth={5} strokeLinecap="round" />
  )
  return (
    <g>
      <circle cx={px} cy={py} r={palm} fill={color} />
      {fingers.map((a, i) => line(a, flen, "f" + i))}
      {thumb ? line(thumb[0], thumb[1], "t") : null}
    </g>
  )
}

function Arm(props: { gesture: string; color: string }) {
  const c = props.color
  return (
    <g>
      <path d="M158 268 L100 192" stroke={c} strokeWidth={21} strokeLinecap="round" fill="none" />
      <path d="M100 192 L128 112" stroke={c} strokeWidth={17} strokeLinecap="round" fill="none" />
      <circle cx={100} cy={192} r={10.5} fill={c} />
      <Hand x={128} y={112} dx={22} dy={-36} gesture={props.gesture} color={c} />
    </g>
  )
}

const GOWN = "M156 346 C 150 430, 62 600, 26 790 Q 200 814 374 790 C 338 600, 250 430, 244 346 Z"

type ArmRefs = { l: (SVGGElement | null)[]; r: (SVGGElement | null)[] }

function Figure(props: { id: string; arms: number; color: string; light: string; mark: string; refs: ArmRefs }) {
  const { id, arms, color, light, mark, refs } = props
  const n = Math.max(0, Math.min(10, Math.round(arms)))
  const echoes: number[] = []
  for (let i = n; i >= 1; i--) echoes.push(i)
  const lace = id + "-lace"
  const dots = id + "-dots"
  const folds = id + "-folds"
  const hem = id + "-hem"
  const round = id + "-round"
  const faceR = id + "-face"
  return (
    <svg viewBox="0 0 400 820" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={lace} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke={light} strokeWidth="0.8" opacity="0.55" />
          <g fill={light} opacity="0.8">
            <ellipse cx="12" cy="7.6" rx="1.7" ry="3.4" />
            <ellipse cx="12" cy="16.4" rx="1.7" ry="3.4" />
            <ellipse cx="7.6" cy="12" rx="3.4" ry="1.7" />
            <ellipse cx="16.4" cy="12" rx="3.4" ry="1.7" />
            <circle cx="12" cy="12" r="1.1" fill={color} />
          </g>
        </pattern>
        <pattern id={dots} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.05" fill={color} opacity="0.5" />
        </pattern>
        <linearGradient id={folds} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a9a9a" />
          <stop offset="0.5" stopColor="#f4f4f4" />
          <stop offset="1" stopColor="#8a8a8a" />
        </linearGradient>
        <mask id={folds + "m"} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="820">
          <rect x="0" y="300" width="400" height="520" fill={"url(#" + folds + ")"} />
        </mask>
        <linearGradient id={hem} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={round} cx="0.42" cy="0.4" r="0.72">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={faceR} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity="0.42" />
        </radialGradient>
      </defs>
      <g>
        {echoes.map((i) => (
          <g key={"l" + i} ref={(el) => { refs.l[i] = el }} transform="rotate(0 158 268)">
            <Arm gesture={GESTURES[i % GESTURES.length]} color={color} />
          </g>
        ))}
        <g transform="matrix(-1 0 0 1 400 0)">
          {echoes.map((i) => (
            <g key={"r" + i} ref={(el) => { refs.r[i] = el }} transform="rotate(0 158 268)">
              <Arm gesture={GESTURES[(i + 2) % GESTURES.length]} color={color} />
            </g>
          ))}
        </g>
      </g>
      <path d={GOWN} fill={color} />
      <path d={GOWN} fill={"url(#" + lace + ")"} mask={"url(#" + folds + "m)"} />
      <path d={GOWN} fill={"url(#" + hem + ")"} />
      <path d="M163 298 C 158 318, 158 334, 162 350 L 238 350 C 242 334, 242 318, 237 298 Z" fill={light} />
      <path d="M163 298 C 158 318, 158 334, 162 350 L 238 350 C 242 334, 242 318, 237 298 Z" fill={"url(#" + dots + ")"} />
      <path d="M155 340 Q 200 352 245 340 L 246 352 Q 200 364 154 352 Z" fill={color} />
      <circle cx="200" cy="348" r="7.5" fill="none" stroke={light} strokeWidth="2.4" />
      <path d="M148 262 Q 200 248 252 262 L 249 304 Q 200 316 151 304 Z" fill={color} />
      <circle cx="200" cy="282" r="15" fill={light} />
      <text x="200" y="287.5" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily={DISPLAY_FONT} fill={color}>{mark}</text>
      <rect x="189" y="236" width="22" height="32" fill={light} />
      <circle cx="200" cy="170" r="9.5" fill={color} />
      <ellipse cx="200" cy="194" rx="29" ry="25" fill={color} />
      <ellipse cx="200" cy="213" rx="25" ry="31" fill={light} />
      <ellipse cx="200" cy="213" rx="25" ry="31" fill={"url(#" + faceR + ")"} />
      <path d="M175 208 Q 178 184 200 182 Q 222 184 225 208 Q 215 194 200 193 Q 185 194 175 208 Z" fill={color} />
      <g fill={color}>
        <rect x="176" y="202" width="21" height="12.5" rx="5.5" />
        <rect x="203" y="202" width="21" height="12.5" rx="5.5" />
      </g>
      <g ref={(el) => { refs.l[0] = el }} transform="rotate(0 158 268)"><Arm gesture="open" color={color} /></g>
      <g transform="matrix(-1 0 0 1 400 0)">
        <g ref={(el) => { refs.r[0] = el }} transform="rotate(0 158 268)"><Arm gesture="open" color={color} /></g>
      </g>
    </svg>
  )
}

function Seal(props: { id: string; text: string; mark: string }) {
  const circ = props.id + "-c"
  let ring = props.text.trim()
  if (ring && !/[·•|/]$/.test(ring)) ring += " ·"
  let run = ""
  while (ring && run.length < 44) run += ring + " "
  return (
    <svg className="sdf-seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs><path id={circ} d="M50 50 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0" /></defs>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1" />
      <g className="sdf-seal-ring">
        <text fontSize="8.6" fontWeight="700" letterSpacing="1.4">
          <textPath href={"#" + circ} startOffset="0">{run}</textPath>
        </text>
      </g>
      <text className="sdf-seal-mark" x="50" y="59.5" textAnchor="middle" fontSize="27">{props.mark}</text>
    </svg>
  )
}

function Barcode(props: { digits: string; seen: boolean }) {
  const modules = barcodeModules(props.digits)
  const bars = barcodeBars(modules)
  const w = Math.max(1, modules.length)
  return (
    <div className="sdf-code" aria-hidden="true">
      <svg viewBox={"0 0 " + w + " 40"} preserveAspectRatio="none" focusable="false">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={40} style={{ ["--d" as string]: STORY.head + 120 + i * 18 + "ms" }} />
        ))}
      </svg>
      <span>{props.digits.replace(/\D/g, "")}</span>
    </div>
  )
}

function Wordmark(props: { id: string; word: string; font: string; w: number; h: number; grit: number; lensRef: React.MutableRefObject<SVGRadialGradientElement | null>; run: number }) {
  const { id, word, font, w, h, grit, lensRef, run } = props
  const measureRef = React.useRef(null as SVGTextElement | null)
  const [layout, setLayout] = React.useState({ adv: [] as number[], bx: 0, by: 0, bw: 0, bh: 0 })
  const letters = Array.from(word)
  React.useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const measure = () => {
      try {
        const cv = typeof document !== "undefined" ? document.createElement("canvas") : null
        const ctx = cv ? cv.getContext("2d") : null
        if (ctx && "actualBoundingBoxAscent" in ctx.measureText("A")) {
          ctx.font = "900 100px " + font
          const mw = ctx.measureText(word)
          const adv: number[] = []
          for (const ch of letters) adv.push(ctx.measureText(ch).width)
          if (mw.actualBoundingBoxAscent > 0) {
            setLayout({ adv, bx: -mw.actualBoundingBoxLeft, by: -mw.actualBoundingBoxAscent, bw: mw.actualBoundingBoxLeft + mw.actualBoundingBoxRight, bh: mw.actualBoundingBoxAscent + mw.actualBoundingBoxDescent })
            return
          }
        }
        const box = el.getBBox()
        const adv: number[] = []
        for (let i = 0; i < letters.length; i++) adv.push(el.getSubStringLength(i, 1))
        setLayout({ adv, bx: box.x, by: box.y + box.height * 0.2, bw: box.width, bh: box.height * 0.72 })
      } catch {}
    }
    measure()
  }, [word, font])
  const pad = Math.max(8, w * 0.012)
  const track = -2.5
  const total = layout.adv.reduce((a, b) => a + b, 0) + track * Math.max(0, letters.length - 1)
  const inkW = layout.bw > 0 ? Math.min(total, layout.bw + track * Math.max(0, letters.length - 1)) : total
  const { sx, sy } = fitScale(inkW, layout.bh, w - pad * 2, h * 0.98)
  const ready = sx > 0 && sy > 0 && w > 0 && h > 0
  const ty = h * 1.05 - (layout.by + layout.bh) * sy
  const tx = pad - layout.bx * sx
  const grit1 = id + "-grit"
  const lensG = id + "-lensg"
  const lensM = id + "-lens"
  const g = clamp(grit, 0, 1)
  const fq = clamp(320 / Math.max(1, h), 1, 2.2)
  const speck = 0.2 + g * 0.14
  const streak = 0.07 + g * 0.09
  let x = 0
  const placed = letters.map((ch, i) => { const lx = x; x += (layout.adv[i] || 0) + track; return { ch, x: lx, i } })
  const glyphs = (cls: string) => placed.map((p) => (
    <text key={run + ":" + p.i} className={cls} x={p.x} y={0} style={{ ["--d" as string]: STORY.letter + p.i * STORY.letterStep + "ms" }}>{p.ch}</text>
  ))
  return (
    <svg className="sdf-word" viewBox={"0 0 " + Math.max(1, w) + " " + Math.max(1, h)} aria-hidden="true" focusable="false">
      <defs>
        <filter id={grit1} x="-2%" y="-5%" width="104%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={(0.028 * fq).toFixed(4)} numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={(2 + g * 6) / fq} xChannelSelector="R" yChannelSelector="G" result="rag" />
          <feTurbulence type="fractalNoise" baseFrequency={(0.55 * fq).toFixed(3)} numOctaves="2" seed="11" result="fine" />
          <feColorMatrix in="fine" type="matrix" values={"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 " + (-30 * speck).toFixed(3)} result="specks" />
          <feComposite in="rag" in2="specks" operator="in" result="cut1" />
          <feTurbulence type="fractalNoise" baseFrequency={(0.01 * fq).toFixed(4) + " " + (0.45 * fq).toFixed(3)} numOctaves="3" seed="17" result="long" />
          <feColorMatrix in="long" type="matrix" values={"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 30 " + (-30 * streak).toFixed(3)} result="streaks" />
          <feComposite in="cut1" in2="streaks" operator="in" />
        </filter>
        <radialGradient id={lensG} gradientUnits="userSpaceOnUse" cx="-1000" cy="-1000" r={Math.max(90, h * 0.42)} ref={lensRef}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={lensM} maskUnits="userSpaceOnUse" x="0" y="0" width={Math.max(1, w)} height={Math.max(1, h)}>
          <rect x="0" y="0" width={Math.max(1, w)} height={Math.max(1, h)} fill={"url(#" + lensG + ")"} />
        </mask>
      </defs>
      <text ref={measureRef} className="sdf-measure" x="0" y="0">{word}</text>
      {ready ? <g filter={"url(#" + grit1 + ")"}><g transform={"translate(" + tx + " " + ty + ") scale(" + sx + " " + sy + ")"}>{glyphs("sdf-let")}</g></g> : null}
      {ready ? <g className="sdf-word-lens" mask={"url(#" + lensM + ")"}><g transform={"translate(" + tx + " " + ty + ") scale(" + sx + " " + sy + ")"}>{glyphs("sdf-let sdf-let-solid")}</g></g> : null}
    </svg>
  )
}

function Column(props: { col: StrobeColumn }) {
  const { col } = props
  return (
    <div className="sdf-col">
      <h3>{col.title}</h3>
      <ul>{col.links.map((l, i) => (
        <li key={i}><a href={l.href || "#"} target={l.external ? "_blank" : undefined} rel={l.external ? "noreferrer" : undefined}>{l.label}</a></li>
      ))}</ul>
    </div>
  )
}

type Sim = {
  l: { x: number; v: number }[]
  r: { x: number; v: number }[]
  swing: number
  spread: number
  openAt: number
  scanAt: number
  raf: number
  last: number
  visible: boolean
  reduced: boolean
  step: number
  n: number
}

const DRAWN = { aspect: 400 / 820, head: 0.26 }

export default function StrobeDivaFooter({
  wordmark = "SHADJEWEL",
  mark,
  sealText = "Shad Jewel · اکسسوری شاد ·",
  established = "2024",
  barcode = "1403012345",
  columns = DEFAULT_COLUMNS,
  copyright = "© شاد جول",
  legalLinks = DEFAULT_LEGAL_LINKS,
  backToTop = true,
  onBackToTop,
  figure = null,
  arms = 7,
  fanStep = 19,
  preset = "shadjewel",
  palette,
  grit = 0.6,
  grain: grainAmount = 0.16,
  interactive = true,
  labels,
  fontFamily = DISPLAY_FONT,
  monoFamily = MONO_FONT,
  height = "100svh",
  className = "",
}: StrobeDivaFooterProps) {
  const pal = { ...(PRESETS[preset] || PRESETS.shadjewel), ...(palette || {}) }
  const text = { established: "Est.", backToTop: "بالا", replay: "پخش دوباره", ...(labels || {}) }
  const initial = mark ?? (wordmark.trim().charAt(0) || "S").toUpperCase()
  const reduced = useReducedMotion()
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = "sdf" + uid
  const echoes = Math.max(0, Math.min(10, Math.round(arms)))
  const rootRef = React.useRef(null as HTMLElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const bandRef = React.useRef(null as HTMLDivElement | null)
  const discRef = React.useRef(null as HTMLButtonElement | null)
  const lensRef = React.useRef(null as SVGRadialGradientElement | null)
  const armRefs = React.useRef({ l: [], r: [] } as ArmRefs)
  const [layout, setLayout] = React.useState("wide")
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [seen, setSeen] = React.useState(false)
  const [run, setRun] = React.useState(0)
  const [pulse, setPulse] = React.useState(0)

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const measure = () => {
      const w = root.clientWidth
      setLayout(w < 720 ? "narrow" : w < 1040 ? "mid" : "wide")
      setSize({ w: stage.clientWidth, h: stage.clientHeight })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return }
    const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) setSeen(true) }, { threshold: 0.2 })
    io.observe(root)
    return () => io.disconnect()
  }, [])

  const narrow = layout === "narrow"
  const m = figureBox(size.w, size.h, DRAWN.aspect, DRAWN.head, narrow)
  const discLeft = m.left + m.W * 0.5

  const sim = React.useRef({ l: [], r: [], swing: 0, spread: 1, openAt: -1, scanAt: -1, raf: 0, last: 0, visible: true, reduced: false, step: fanStep, n: echoes } as Sim)
  sim.current.reduced = reduced
  sim.current.step = fanStep
  sim.current.n = echoes

  const wake = React.useCallback(() => {
    const s = sim.current
    if (s.raf || typeof requestAnimationFrame === "undefined") return
    s.last = 0
    const frame = (now: number) => {
      s.raf = 0
      const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60
      s.last = now
      const refs = armRefs.current
      let moving = false
      for (let i = 0; i <= s.n; i++) {
        const open = s.openAt >= 0 && now >= s.openAt + i * STORY.armStep
        const tl = armAngle(i, -1, s.step, s.spread, s.swing, open)
        const tr = armAngle(i, 1, s.step, s.spread, s.swing, open)
        if (!s.l[i]) s.l[i] = { x: 0, v: 0 }
        if (!s.r[i]) s.r[i] = { x: 0, v: 0 }
        if (s.reduced) { s.l[i] = { x: tl, v: 0 }; s.r[i] = { x: tr, v: 0 } }
        else {
          const k = stiffness(i)
          let a = s.l[i], b = s.r[i]
          for (let q = 0; q < 3; q++) {
            const la = springStep(a.x, a.v, tl, k, 0.72, dt / 3)
            const lb = springStep(b.x, b.v, tr, k, 0.72, dt / 3)
            a = { x: la[0], v: la[1] }; b = { x: lb[0], v: lb[1] }
          }
          s.l[i] = a; s.r[i] = b
        }
        if (!settled(s.l[i].x, s.l[i].v, tl) || !settled(s.r[i].x, s.r[i].v, tr)) moving = true
        if (s.openAt >= 0 && now < s.openAt + i * STORY.armStep) moving = true
        const gl = refs.l[i], gr = refs.r[i]
        if (gl) gl.setAttribute("transform", "rotate(" + s.l[i].x.toFixed(3) + " 158 268)")
        if (gr) gr.setAttribute("transform", "rotate(" + (-s.r[i].x).toFixed(3) + " 158 268)")
      }
      if (moving && s.visible) s.raf = requestAnimationFrame(frame)
    }
    s.raf = requestAnimationFrame(frame)
  }, [])

  React.useEffect(() => {
    if (!seen) return
    const s = sim.current
    const now = typeof performance !== "undefined" ? performance.now() : 0
    s.scanAt = -1
    s.openAt = reduced ? now : now + STORY.figure + 440
    wake()
    const t2 = setTimeout(wake, Math.max(0, s.openAt - now))
    return () => clearTimeout(t2)
  }, [seen, run, reduced, wake])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) { sim.current.visible = e.isIntersecting; if (e.isIntersecting) wake() }
    })
    io.observe(root)
    return () => io.disconnect()
  }, [wake])

  React.useEffect(() => {
    const s = sim.current
    return () => { if (s.raf) cancelAnimationFrame(s.raf); s.raf = 0 }
  }, [])

  React.useEffect(() => {
    const stage = stageRef.current
    const band = bandRef.current
    if (!stage || !band || !interactive) return
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      const d = pointerDrive(nx, ny)
      sim.current.swing = d.swing
      sim.current.spread = d.spread
      wake()
      const disc = discRef.current
      if (disc && !sim.current.reduced) {
        disc.style.setProperty("--sdf-dx", ((0.5 - nx) * r.width * 0.03).toFixed(1) + "px")
        disc.style.setProperty("--sdf-dy", ((0.5 - ny) * r.height * 0.03).toFixed(1) + "px")
      }
      const b = band.getBoundingClientRect()
      const g = lensRef.current
      const inside = e.clientY >= b.top && e.clientY <= b.bottom
      if (g) { g.setAttribute("cx", (e.clientX - b.left).toFixed(1)); g.setAttribute("cy", (e.clientY - b.top).toFixed(1)) }
      band.setAttribute("data-lens", inside ? "1" : "0")
    }
    const onLeave = () => {
      sim.current.swing = 0; sim.current.spread = 1; wake()
      const disc = discRef.current
      if (disc) { disc.style.setProperty("--sdf-dx", "0px"); disc.style.setProperty("--sdf-dy", "0px") }
      band.setAttribute("data-lens", "0")
    }
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerleave", onLeave)
    return () => { stage.removeEventListener("pointermove", onMove); stage.removeEventListener("pointerleave", onLeave) }
  }, [interactive, wake])

  const replay = () => {
    const s = sim.current
    s.openAt = -1
    for (const a of s.l) { a.x = 0; a.v = 0 }
    for (const a of s.r) { a.x = 0; a.v = 0 }
    setPulse((p) => p + 1)
    setRun((r) => r + 1)
    setSeen(true)
  }

  const toTop = () => {
    if (onBackToTop) onBackToTop()
    else if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }

  const style = {
    "--sdf-paper": pal.paper, "--sdf-ink": pal.ink, "--sdf-accent": pal.accent,
    "--sdf-display": fontFamily, "--sdf-mono": monoFamily,
    "--sdf-grain": String(clamp(grainAmount, 0, 1)), height, minHeight: "640px",
  } as React.CSSProperties

  const stageStyle = {
    "--sdf-fig": m.F.toFixed(1) + "px", "--sdf-disc": m.disc.toFixed(1) + "px",
    "--sdf-disc-top": m.discTop.toFixed(1) + "px", "--sdf-disc-left": discLeft.toFixed(1) + "px",
    "--sdf-band": m.band.toFixed(1) + "px",
  } as React.CSSProperties

  const delay = (ms: number) => ({ ["--d" as string]: ms + "ms" }) as React.CSSProperties
  const left = columns.slice(0, Math.ceil(columns.length / 2))
  const right = columns.slice(Math.ceil(columns.length / 2))
  const floorLines: number[] = []
  for (let x = -60; x <= 160; x += 11) floorLines.push(x)

  // figure prop reserved for future photo path; currently drawn SVG only
  void figure

  return (
    <footer ref={rootRef} className={"sdf " + className} style={style} data-layout={layout} data-seen={seen ? "1" : "0"} aria-label={wordmark + " footer"}>
      <style dangerouslySetInnerHTML={{ __html: SDF_CSS }} />
      <div className="sdf-head">
        <div className="sdf-ent" style={delay(STORY.head)}><Seal id={id} text={sealText} mark={initial} /></div>
        <div className="sdf-year sdf-ent" style={delay(STORY.head + 60)}>{text.established}<b>{established}</b></div>
        <Barcode digits={barcode} seen={seen} />
      </div>
      <div ref={stageRef} className="sdf-stage" style={stageStyle}>
        <button key={"disc" + run} ref={discRef} type="button" className="sdf-disc sdf-ent-disc" style={delay(STORY.disc)} data-pulse={pulse > 0 ? "1" : "0"} aria-label={text.replay} onClick={replay}>
          <svg aria-hidden="true" focusable="false">
            <filter id={id + "-sun"} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 -0.2" />
            </filter>
            <rect width="100%" height="100%" fill={pal.ink} filter={"url(#" + id + "-sun)"} opacity="0.28" />
          </svg>
        </button>
        <div ref={bandRef} className="sdf-band" data-lens="0">
          <Wordmark id={id} word={wordmark} font={fontFamily} w={size.w} h={m.band} grit={grit} lensRef={lensRef} run={run} />
        </div>
        <div key={"fig" + run} className="sdf-figure sdf-ent-fig" style={delay(STORY.figure)}>
          <Figure id={id} arms={echoes} color={pal.figure} light={pal.figureLight} mark={initial} refs={armRefs.current} />
        </div>
        {!narrow ? (
          <>
            <nav className="sdf-flank sdf-flank-l sdf-ent" style={delay(STORY.columns)} aria-label="Footer links">{left.map((c, i) => <Column key={i} col={c} />)}</nav>
            <nav className="sdf-flank sdf-flank-r sdf-ent" style={delay(STORY.columns + 80)} aria-label="More footer links">{right.map((c, i) => <Column key={i} col={c} />)}</nav>
          </>
        ) : null}
      </div>
      {narrow ? <nav className="sdf-cols" aria-label="Footer links">{columns.map((c, i) => <Column key={i} col={c} />)}</nav> : null}
      <div className="sdf-legal">
        <svg className="sdf-floor" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {floorLines.map((x) => <line key={x} x1="50" y1="-34" x2={x} y2="10" />)}
        </svg>
        <span className="sdf-ent" style={delay(STORY.legal)}>{copyright}</span>
        {legalLinks.length ? (
          <ul className="sdf-legal-links sdf-ent" style={delay(STORY.legal + 60)}>
            {legalLinks.map((l, i) => <li key={i}><a href={l.href || "#"}>{l.label}</a></li>)}
          </ul>
        ) : null}
        {backToTop ? (
          <button type="button" className="sdf-top sdf-ent" style={delay(STORY.legal + 120)} onClick={toTop}>
            {text.backToTop}
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <p className="sdf-sr">{wordmark}</p>
      <svg className="sdf-grain" aria-hidden="true" focusable="false">
        <filter id={id + "-grain"} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter={"url(#" + id + "-grain)"} />
      </svg>
    </footer>
  )
}

export type StrobeLink = { label: string; href?: string; external?: boolean }
export type StrobeColumn = { title: string; links: StrobeLink[] }
export type StrobePalette = { paper: string; ink: string; accent: string; figure: string; figureLight: string }
export type StrobeLabels = { established: string; backToTop: string; replay: string }
export type StrobeFigure = {
  src: string; alt?: string; ratio?: number; crop?: [number, number, number, number]
  head?: [number, number]; backdrop?: "light" | "dark"; tone?: number
  arms?: { pivot: [number, number]; outline: [number, number][] }[]
}
export type StrobeDivaFooterProps = {
  wordmark?: string; mark?: string; sealText?: string; established?: string; barcode?: string
  columns?: StrobeColumn[]; copyright?: string; legalLinks?: StrobeLink[]; backToTop?: boolean
  onBackToTop?: () => void; figure?: StrobeFigure | null; arms?: number; fanStep?: number
  preset?: "crimson" | "midnight" | "cobalt" | "gilt" | "shadjewel"
  palette?: Partial<StrobePalette>; grit?: number; grain?: number; interactive?: boolean
  labels?: Partial<StrobeLabels>; fontFamily?: string; monoFamily?: string; height?: string; className?: string
}
