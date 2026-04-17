import fs from "node:fs"
import path from "node:path"
import { URL as NodeURL } from "node:url"

const root = process.cwd()
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

if (!fs.existsSync(requestPath)) {
  console.error("Missing orchestrator/input/reference-request.json")
  process.exit(1)
}

const request = JSON.parse(fs.readFileSync(requestPath, "utf8"))
const referenceUrl = request.referenceUrl

if (!referenceUrl || !referenceUrl.startsWith("http")) {
  console.error(`Invalid referenceUrl: "${referenceUrl}"`)
  process.exit(1)
}

console.log(`Analyzing reference: ${referenceUrl}`)

// ─── fetch ────────────────────────────────────────────────────────────────────

async function fetchText(url, timeoutMs = 10000) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,text/css,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "follow"
    })
    clearTimeout(timer)
    if (!res.ok) return ""
    return await res.text()
  } catch {
    return ""
  }
}

// ─── font extraction ──────────────────────────────────────────────────────────

function extractGoogleFonts(html) {
  const families = []
  for (const match of html.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s>\\]+)/g)) {
    const query = match[1]
    for (const fm of query.matchAll(/family=([^&|:+]+)/g)) {
      const name = decodeURIComponent(fm[1]).replace(/\+/g, " ").split(":")[0].trim()
      if (name && !families.includes(name)) families.push(name)
    }
  }
  return families
}

function extractFontFaces(css) {
  const families = []
  for (const match of css.matchAll(/@font-face\s*\{[^}]*font-family:\s*['"]?([^;'"]+)['"]?/g)) {
    const name = match[1].trim()
    if (name && !families.includes(name)) families.push(name)
  }
  return families
}

function extractFontFamilyUsages(css) {
  const families = []
  for (const match of css.matchAll(/font-family:\s*['"]?([^;,'"]+)/g)) {
    const first = match[1].trim().split(",")[0].replace(/['"]/g, "").trim()
    const skip = ["sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "unset", "-apple-system", "BlinkMacSystemFont"]
    if (first && !skip.includes(first) && !families.includes(first)) families.push(first)
  }
  return families
}

// ─── color extraction ─────────────────────────────────────────────────────────

function extractCssVars(css) {
  const vars = {}
  for (const match of css.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;}{]+)/g)) {
    vars[`--${match[1].trim()}`] = match[2].trim()
  }
  return vars
}

function luminance(hex) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return r * 0.299 + g * 0.587 + b * 0.114
  } catch {
    return 128
  }
}

function saturation(hex) {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return max - min
  } catch {
    return 0
  }
}

function normalizeHex(raw) {
  if (raw.length === 3) raw = raw.split("").map(c => c + c).join("")
  return "#" + raw.toLowerCase()
}

function classifyColors(css, cssVars) {
  const freq = new Map()

  for (const match of css.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const hex = normalizeHex(match[1])
    freq.set(hex, (freq.get(hex) || 0) + 1)
  }
  for (const match of css.matchAll(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)) {
    const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    freq.set(hex, (freq.get(hex) || 0) + 1)
  }

  // Also consider css var values that look like hex colors
  for (const [, val] of Object.entries(cssVars)) {
    const match = val.trim().match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/)
    if (match) {
      const hex = normalizeHex(match[1])
      freq.set(hex, (freq.get(hex) || 0) + 3) // boost weight
    }
  }

  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1])

  // Ignore near-black and near-white for surface variants — use them first as bg/text
  const verydark = sorted.filter(([h]) => luminance(h) < 30)
  const dark = sorted.filter(([h]) => luminance(h) >= 30 && luminance(h) < 80)
  const light = sorted.filter(([h]) => luminance(h) > 180)
  const accents = sorted.filter(([h]) => saturation(h) > 0.3 && luminance(h) > 40 && luminance(h) < 220)

  const bg = verydark[0]?.[0] || dark[0]?.[0] || "#0a0a0a"
  const surface = dark[0]?.[0] !== bg ? dark[0]?.[0] : dark[1]?.[0] || "#111111"
  const surface2 = dark[1]?.[0] || dark[2]?.[0] || "#171717"
  const textColor = light[0]?.[0] || "#f5f5f0"
  const muted = light[1]?.[0] || "#b8b8b0"
  const primary = accents[0]?.[0] || "#d6ff3f"

  return { background: bg, surface, surface2, text: textColor, muted, primary, border: "rgba(255,255,255,0.08)" }
}

// ─── css link extraction ──────────────────────────────────────────────────────

function extractCssLinks(html, baseUrl) {
  const links = []
  const base = new NodeURL(baseUrl)
  const patterns = [
    /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi,
  ]
  for (const pat of patterns) {
    for (const match of html.matchAll(pat)) {
      try {
        const url = new NodeURL(match[1], base)
        links.push(url.href)
      } catch {}
    }
  }
  return [...new Set(links)]
}

function extractInlineStyles(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n")
}

// ─── motion library detection ─────────────────────────────────────────────────

function detectMotionLibraries(html) {
  const libs = []
  if (/gsap|TweenLite|TweenMax|ScrollTrigger|fromTo\s*\(/i.test(html)) libs.push("gsap")
  if (/three\.js|THREE\.|WebGLRenderer/i.test(html)) libs.push("three")
  if (/lottie/i.test(html)) libs.push("lottie")
  if (/anime\.js|anime\s*\(/i.test(html)) libs.push("anime")
  if (/data-aos\b|aos\.init/i.test(html)) libs.push("aos")
  if (/locomotive|LocomotiveScroll/i.test(html)) libs.push("locomotive-scroll")
  if (/barba\s*\.|barba\.init/i.test(html)) libs.push("barba")
  if (/split.*text|SplitType|SplitText/i.test(html)) libs.push("split-text")
  if (/cursor|magnetic|follow.*mouse/i.test(html)) libs.push("custom-cursor")
  return libs
}

// ─── site style extraction ───────────────────────────────────────────────────

function extractTypographyScale(css) {
  const sizes = new Set()
  for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)(px|rem)/g)) {
    const px = m[2] === "rem" ? parseFloat(m[1]) * 16 : parseFloat(m[1])
    if (px >= 10 && px <= 320) sizes.add(Math.round(px))
  }
  return [...sizes].sort((a, b) => b - a)
}

function extractAnimationTempo(css) {
  const durations = []
  for (const m of css.matchAll(/(?:transition|animation)[^;:{]*?(\d+(?:\.\d+)?)(ms|s)/g)) {
    const ms = m[2] === "ms" ? parseFloat(m[1]) : parseFloat(m[1]) * 1000
    if (ms >= 80 && ms <= 4000) durations.push(ms)
  }
  if (!durations.length) return "cinematic"
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  return avg < 350 ? "fast" : avg < 750 ? "base" : "cinematic"
}

function extractDisplayLetterSpacing(css) {
  const candidates = []
  for (const m of css.matchAll(/letter-spacing:\s*(-?\d+(?:\.\d+)?)(em|px)/g)) {
    const val = parseFloat(m[1])
    if (val < 0) candidates.push(`${m[1]}${m[2]}`)
  }
  if (!candidates.length) return "-0.04em"
  const freq = new Map()
  for (const c of candidates) freq.set(c, (freq.get(c) || 0) + 1)
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

function extractTextAlign(css) {
  const center = (css.match(/text-align:\s*center/g) || []).length
  const left = (css.match(/text-align:\s*left/g) || []).length
  return center > left * 1.5 ? "center" : "left"
}

function extractGalleryStyle(css) {
  if (/grid-template-columns[^;]*repeat\s*\(\s*[234]/.test(css)) return "grid"
  if (/columns:\s*\d/.test(css)) return "masonry"
  return "list"
}

function extractBorderRadius(css) {
  const radii = []
  for (const m of css.matchAll(/border-radius:\s*(\d+)px/g)) {
    const v = parseInt(m[1])
    if (v > 0 && v < 200) radii.push(v)
  }
  if (!radii.length) return "0px"
  const avg = radii.reduce((a, b) => a + b, 0) / radii.length
  return avg < 4 ? "0px" : avg < 10 ? "4px" : avg < 20 ? "12px" : "24px"
}

function detectHeroStyle(html) {
  if (/<video[^>]*(?:autoplay|muted)[^>]*>/i.test(html)) return "video-bg"
  if (/background-image[^;]*url\s*\(/i.test(html)) return "text-image"
  return "text-only"
}

function detectHasMarquee(html, css) {
  return /marquee|ticker|running-text|data-scroll.*speed|js-marquee/i.test(html + css)
}

// ─── section detection ────────────────────────────────────────────────────────

function detectSections(html, referenceStyle) {
  const kindPatterns = [
    { regex: /(?:id|class)="[^"]*(?:hero|header|intro|banner|splash|opening)[^"]*"/gi, kind: "hero" },
    { regex: /(?:id|class)="[^"]*(?:work|projects?|portfolio|gallery|selected|case)[^"]*"/gi, kind: "gallery" },
    { regex: /(?:id|class)="[^"]*(?:about|story|studio|team|agency|who-we-are|manifesto)[^"]*"/gi, kind: "story" },
    { regex: /(?:id|class)="[^"]*(?:services?|what-we-do|offer|capabilities|expertise)[^"]*"/gi, kind: "services" },
    { regex: /(?:id|class)="[^"]*(?:contact|get-in-touch|reach|connect)[^"]*"/gi, kind: "contact" },
    { regex: /(?:id|class)="[^"]*(?:footer|outro|end|bottom)[^"]*"/gi, kind: "footer" },
  ]

  const found = []
  const seen = new Set()

  for (const { regex, kind } of kindPatterns) {
    if (regex.test(html) && !seen.has(kind)) {
      seen.add(kind)
      found.push(kind)
    }
  }

  // Style-specific defaults when detection fails
  const defaults = {
    agency: ["hero", "gallery", "story", "footer"],
    editorial: ["hero", "story", "gallery", "footer"],
    product: ["hero", "services", "story", "footer"]
  }

  const fallback = defaults[referenceStyle] || defaults.agency

  // Merge detected with fallback — always start with hero, end with footer
  const merged = []
  if (!seen.has("hero")) merged.push("hero")
  for (const kind of found) {
    if (kind !== "hero" && kind !== "footer") merged.push(kind)
  }
  for (const kind of fallback) {
    if (!seen.has(kind) && !merged.includes(kind) && kind !== "footer") merged.push(kind)
  }
  merged.push("footer")

  return [...new Set(merged)]
}

function sectionMeta(kind, idx) {
  const map = {
    hero:     { layout: "full-height dark stage with staggered character reveal", notes: "Large kinetic display type, bottom-anchored layout, immediate cinematic impact" },
    gallery:  { layout: "stacked project cards with scroll-linked reveals", notes: "Premium cinematic card entries, hover reveals secondary info, numbered list" },
    story:    { layout: "editorial split blocks with scroll-linked opacity", notes: "Strong rhythm, large display numbers, restrained body copy, purposeful whitespace" },
    services: { layout: "grid of capability items with staggered scroll entry", notes: "Clean structured list, secondary text fades in on scroll" },
    contact:  { layout: "minimal CTA section with animated link", notes: "Strong typographic CTA, email link with hover underline draw" },
    footer:   { layout: "minimal outro with strong typography and scroll reveal", notes: "Simple intentional close, copyright and social links" },
  }
  return map[kind] || { layout: "full-width section", notes: "Content section" }
}

// ─── main analysis ────────────────────────────────────────────────────────────

async function analyze() {
  const html = await fetchText(referenceUrl)

  if (!html) {
    console.warn("Could not fetch reference URL — using enhanced defaults")
  }

  const cssLinks = html ? extractCssLinks(html, referenceUrl) : []
  const inlineCss = html ? extractInlineStyles(html) : ""

  // Fetch up to 6 CSS files (skip CDN externals)
  const base = new NodeURL(referenceUrl)
  const ownCssLinks = cssLinks.filter(u => {
    try { return new NodeURL(u).hostname === base.hostname } catch { return false }
  }).slice(0, 6)

  const cssTexts = await Promise.all(ownCssLinks.map(u => fetchText(u, 6000)))
  const allCss = [inlineCss, ...cssTexts].join("\n")

  const gFonts = html ? extractGoogleFonts(html) : []
  const fontFaces = extractFontFaces(allCss)
  const fontUsages = extractFontFamilyUsages(allCss)
  const allFonts = [...new Set([...gFonts, ...fontFaces, ...fontUsages])]
  const displayFont = allFonts[0] || "Inter"
  const bodyFont = allFonts[1] || allFonts[0] || "Inter"

  const cssVars = extractCssVars(allCss)
  const colors = classifyColors(allCss, cssVars)

  const motionLibs = html ? detectMotionLibraries(html) : ["gsap"]
  const hasGsap = motionLibs.includes("gsap") || motionLibs.includes("locomotive-scroll") || true
  const hasCursor = motionLibs.includes("custom-cursor") || motionLibs.includes("gsap")

  // ─── site style (layout, typography scale, animation character) ──────────────
  const fontSizeScale = extractTypographyScale(allCss)
  const topDisplayPx = fontSizeScale[0] || 100
  const displayFontSize = `clamp(${Math.max(38, Math.round(topDisplayPx * 0.44))}px, ${(topDisplayPx / 14).toFixed(1)}vw, ${topDisplayPx}px)`
  const bodyFontPx = fontSizeScale.filter(s => s >= 14 && s <= 20)[0] || 16

  const siteStyle = {
    textAlign: extractTextAlign(allCss),
    heroStyle: detectHeroStyle(html || ""),
    galleryStyle: extractGalleryStyle(allCss),
    animationTempo: extractAnimationTempo(allCss),
    displayFontSize,
    bodyFontSize: `${bodyFontPx}px`,
    letterSpacing: extractDisplayLetterSpacing(allCss),
    borderRadius: extractBorderRadius(allCss),
    hasMarquee: detectHasMarquee(html || "", allCss),
    hasMagneticCursor: hasCursor
  }

  console.log(`  Layout — align:${siteStyle.textAlign} hero:${siteStyle.heroStyle} gallery:${siteStyle.galleryStyle}`)
  console.log(`  Type — display:${displayFontSize} body:${siteStyle.bodyFontSize} spacing:${siteStyle.letterSpacing}`)
  console.log(`  Animation tempo: ${siteStyle.animationTempo} | radius: ${siteStyle.borderRadius} | marquee: ${siteStyle.hasMarquee}`)

  const referenceStyle = request.referenceStyle || "agency"
  const detectedSections = detectSections(html || "", referenceStyle)

  console.log(`  Fonts detected: ${allFonts.join(", ") || "none (using Inter)"}`)
  console.log(`  Colors — bg:${colors.background} text:${colors.text} primary:${colors.primary}`)
  console.log(`  Motion libs: ${motionLibs.join(", ") || "none detected"}`)
  console.log(`  Sections: ${detectedSections.join(", ")}`)

  // ─── write design-tokens.json ───────────────────────────────────────────────

  const tokens = {
    themeName: new NodeURL(referenceUrl).hostname.replace(/^www\./, "").replace(/\./g, "-"),
    fonts: { display: displayFont, body: bodyFont },
    colors,
    siteStyle,
    radius: { sm: 4, md: 10, lg: 20 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48, xxl: 96 },
    motion: {
      easePrimary: hasGsap ? "power4.out" : "cubic-bezier(0.22, 1, 0.36, 1)",
      durationFast: siteStyle.animationTempo === "fast" ? 0.3 : 0.4,
      durationBase: siteStyle.animationTempo === "fast" ? 0.55 : siteStyle.animationTempo === "base" ? 0.75 : 0.95,
      durationSlow: siteStyle.animationTempo === "fast" ? 0.8 : siteStyle.animationTempo === "base" ? 1.1 : 1.5
    }
  }

  fs.writeFileSync(
    path.join(root, "orchestrator", "output", "design-tokens.json"),
    JSON.stringify(tokens, null, 2) + "\n",
    "utf8"
  )

  // ─── write site-map.json ────────────────────────────────────────────────────

  const siteName = new NodeURL(referenceUrl).hostname.replace(/^www\./, "")
  const siteMap = {
    siteName,
    referenceUrl,
    referenceType: "url",
    analyzedAt: new Date().toISOString(),
    motionLibraries: motionLibs,
    pages: [
      {
        id: "home",
        path: "/",
        title: "Home",
        sections: detectedSections.map((kind, idx) => ({
          id: idx === 0 ? kind : `${kind}-${idx + 1}`.replace(/-(\d+)$/, (_, n) => n === "1" ? "" : `-${n}`).replace(/-$/, ""),
          kind,
          ...sectionMeta(kind, idx)
        }))
      }
    ]
  }

  // Deduplicate section IDs
  const seenIds = new Set()
  for (const section of siteMap.pages[0].sections) {
    let id = section.id || section.kind
    let counter = 1
    while (seenIds.has(id)) { id = `${section.kind}-${++counter}` }
    section.id = id
    seenIds.add(id)
  }

  fs.writeFileSync(
    path.join(root, "orchestrator", "output", "site-map.json"),
    JSON.stringify(siteMap, null, 2) + "\n",
    "utf8"
  )

  // ─── write motion-map.json ──────────────────────────────────────────────────

  const interactions = []

  interactions.push({
    id: "hero-title-reveal",
    kind: "load",
    target: "heroTitle",
    trigger: "mount",
    duration: 1.0,
    ease: "power4.out",
    stagger: 0.018,
    mobileFallback: "fade"
  })

  if (detectedSections.includes("gallery")) {
    interactions.push({
      id: "work-cards-reveal",
      kind: "scroll",
      target: "workCards",
      trigger: "workSection",
      start: "top 80%",
      end: "top 20%",
      scrub: false,
      pin: false,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      mobileFallback: "fade"
    })
    interactions.push({
      id: "work-card-hover",
      kind: "hover",
      target: "workCard",
      trigger: "mouseenter",
      mobileFallback: "no hover effect"
    })
  }

  if (hasCursor) {
    interactions.push({
      id: "cursor-follower",
      kind: "cursor",
      target: "customCursor",
      trigger: "document",
      ease: "power2.out",
      duration: 0.55,
      mobileFallback: "disabled"
    })
  }

  if (detectedSections.includes("story")) {
    interactions.push({
      id: "story-reveal",
      kind: "scroll",
      target: "storyText",
      trigger: "storySection",
      start: "top 75%",
      end: "top 30%",
      scrub: true,
      pin: false,
      mobileFallback: "fade"
    })
  }

  const motionMap = {
    page: "home",
    referenceUrl,
    analyzedAt: new Date().toISOString(),
    detectedLibraries: motionLibs,
    interactions
  }

  fs.writeFileSync(
    path.join(root, "orchestrator", "output", "motion-map.json"),
    JSON.stringify(motionMap, null, 2) + "\n",
    "utf8"
  )

  console.log("Wrote:")
  console.log("  orchestrator/output/design-tokens.json")
  console.log("  orchestrator/output/site-map.json")
  console.log("  orchestrator/output/motion-map.json")
}

analyze().catch((err) => {
  console.error("Analysis failed:", err.message)
  process.exit(1)
})
