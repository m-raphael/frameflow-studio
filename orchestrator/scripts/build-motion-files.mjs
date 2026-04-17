import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const decisionsPath = path.join(root, "framer", "generated", "motion", "motion-decisions.generated.json")
const outOverridesDir = path.join(root, "framer", "generated", "overrides")
const outGsapDir = path.join(root, "framer", "generated", "gsap")
const reportPath = path.join(root, "docs", "motion-build-report.md")

if (!fs.existsSync(decisionsPath)) {
  console.error("Missing motion decisions file. Run: npm run build:motion")
  process.exit(1)
}

fs.mkdirSync(outOverridesDir, { recursive: true })
fs.mkdirSync(outGsapDir, { recursive: true })

const decisions = JSON.parse(fs.readFileSync(decisionsPath, "utf8"))

const toPascalCase = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

const generatedOverrides = []
const generatedGsap = []

// ─── Template: magnetic cursor follower (waaark-style) ───────────────────────
function cursorFollowerTemplate(name) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"

// Self-contained magnetic cursor follower — no external imports needed

type Props = {
  ringSize: number
  dotSize: number
  color: string
  mixBlendMode: string
  lag: number
  scaleFactor: number
  magneticStrength: number
}

export default function ${name}(props: Props) {
  const ringRef = React.useRef<HTMLDivElement>(null)
  const dotRef = React.useRef<HTMLDivElement>(null)
  const posRef = React.useRef({ x: -200, y: -200 })

  React.useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot) return

    // quickTo keeps the cursor butter-smooth at any frame rate
    const xRing = gsap.quickTo(ring, "x", { duration: props.lag, ease: "power3.out" })
    const yRing = gsap.quickTo(ring, "y", { duration: props.lag, ease: "power3.out" })
    const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "none" })
    const yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "none" })

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      xRing(e.clientX)
      yRing(e.clientY)
      xDot(e.clientX)
      yDot(e.clientY)
    }

    // Magnetic pull toward interactive elements
    const onEnterMagnetic = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const magnetic = target.closest("a, button, [data-magnetic], [data-cursor-grow]")
      if (!magnetic) return

      const rect = (magnetic as HTMLElement).getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) * props.magneticStrength
      const dy = (e.clientY - cy) * props.magneticStrength

      gsap.to(magnetic, {
        x: dx,
        y: dy,
        duration: 0.4,
        ease: "power3.out"
      })

      gsap.to(ring, {
        scale: props.scaleFactor,
        opacity: 0.5,
        duration: 0.3,
        ease: "power2.out"
      })
    }

    const onLeaveMagnetic = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const magnetic = target.closest("a, button, [data-magnetic], [data-cursor-grow]")
      if (magnetic) {
        gsap.to(magnetic, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" })
      }
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" })
    }

    const onMouseDown = () => {
      gsap.to(ring, { scale: 0.7, duration: 0.15, ease: "power2.out" })
      gsap.to(dot, { scale: 0.7, duration: 0.1, ease: "power2.out" })
    }
    const onMouseUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" })
      gsap.to(dot, { scale: 1, duration: 0.2, ease: "elastic.out(1, 0.5)" })
    }

    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseover", onEnterMagnetic)
    document.addEventListener("mouseout", onLeaveMagnetic)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onEnterMagnetic)
      document.removeEventListener("mouseout", onLeaveMagnetic)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [props.lag, props.scaleFactor, props.magneticStrength])

  const half = props.ringSize / 2

  return (
    <>
      {/* Outer ring — lags behind cursor */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: props.ringSize,
          height: props.ringSize,
          borderRadius: "50%",
          border: \`1.5px solid \${props.color}\`,
          pointerEvents: "none",
          zIndex: 9999,
          transform: \`translate(\${-half}px, \${-half}px)\`,
          willChange: "transform",
          mixBlendMode: props.mixBlendMode as any
        }}
      />
      {/* Inner dot — snaps immediately */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: props.dotSize,
          height: props.dotSize,
          borderRadius: "50%",
          background: props.color,
          pointerEvents: "none",
          zIndex: 9999,
          transform: \`translate(\${-props.dotSize / 2}px, \${-props.dotSize / 2}px)\`,
          willChange: "transform"
        }}
      />
    </>
  )
}

${name}.defaultProps = {
  ringSize: 40,
  dotSize: 6,
  color: "#F5F5F0",
  mixBlendMode: "difference",
  lag: 0.12,
  scaleFactor: 2.4,
  magneticStrength: 0.3
}

addPropertyControls(${name}, {
  ringSize: { type: ControlType.Number, title: "Ring size", defaultValue: 40, min: 16, max: 120, step: 2 },
  dotSize: { type: ControlType.Number, title: "Dot size", defaultValue: 6, min: 2, max: 20, step: 1 },
  color: { type: ControlType.Color, title: "Color", defaultValue: "#F5F5F0" },
  mixBlendMode: {
    type: ControlType.Enum,
    title: "Blend mode",
    options: ["normal", "difference", "exclusion", "screen"],
    defaultValue: "difference"
  },
  lag: { type: ControlType.Number, title: "Lag", defaultValue: 0.12, min: 0.05, max: 0.6, step: 0.01 },
  scaleFactor: { type: ControlType.Number, title: "Hover scale", defaultValue: 2.4, min: 1, max: 5, step: 0.1 },
  magneticStrength: { type: ControlType.Number, title: "Magnetic pull", defaultValue: 0.3, min: 0, max: 1, step: 0.05 }
})
`
}

// ─── Template: rich scroll reveal (stagger + parallax layers) ────────────────
function scrollRevealTemplate(name, item) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Self-contained scroll reveal component

type Props = {
  title: string
  subtitle: string
  background: string
  textColor: string
  accentColor: string
  triggerStart: string
  scrub: number
  stagger: number
}

export default function ${name}(props: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const headlineRef = React.useRef<HTMLHeadingElement>(null)
  const subRef = React.useRef<HTMLParagraphElement>(null)
  const lineRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const root = rootRef.current
    const headline = headlineRef.current
    const sub = subRef.current
    const line = lineRef.current
    if (!root || !headline || !sub || !line) return

    if (prefersReducedMotion) {
      gsap.set([headline, sub, line], { opacity: 1, y: 0, scaleX: 1 })
      return
    }

    const ctx = gsap.context(() => {
      // Initial hidden state
      gsap.set(headline, { opacity: 0, y: 60 })
      gsap.set(sub, { opacity: 0, y: 40 })
      gsap.set(line, { scaleX: 0, transformOrigin: "left center" })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: props.triggerStart,
          toggleActions: "play none none reverse"
        }
      })

      tl.to(line, { scaleX: 1, duration: 0.6, ease: "power3.out" })
        .to(headline, { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" }, "-=0.3")
        .to(sub, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, \`-=\${props.stagger}\`)
    }, root)

    return () => ctx.revert()
  }, [props.triggerStart, props.stagger])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        minHeight: 600,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px clamp(24px, 6vw, 120px)",
        background: props.background,
        color: props.textColor,
        overflow: "hidden",
        boxSizing: "border-box"
      }}
    >
      <div
        ref={lineRef}
        style={{
          width: "100%",
          height: 1,
          background: props.accentColor,
          opacity: 0.25,
          marginBottom: 48
        }}
      />
      <h2
        ref={headlineRef}
        style={{
          margin: 0,
          fontSize: "clamp(36px, 6vw, 96px)",
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          fontWeight: 700,
          maxWidth: "14ch"
        }}
      >
        {props.title}
      </h2>
      <p
        ref={subRef}
        style={{
          margin: "32px 0 0",
          fontSize: "clamp(14px, 1.5vw, 18px)",
          lineHeight: 1.6,
          opacity: 0.65,
          maxWidth: "48ch"
        }}
      >
        {props.subtitle}
      </p>
    </section>
  )
}

${name}.defaultProps = {
  title: "${item.id}",
  subtitle: "A scroll-triggered section with staggered reveal.",
  background: "#0B0B0B",
  textColor: "#F5F5F0",
  accentColor: "#F5F5F0",
  triggerStart: "top 75%",
  scrub: 0,
  stagger: 0.4
}

addPropertyControls(${name}, {
  title: { type: ControlType.String, title: "Title", defaultValue: "${item.id}" },
  subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "A scroll-triggered section." },
  background: { type: ControlType.Color, title: "Background", defaultValue: "#0B0B0B" },
  textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F0" },
  accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#F5F5F0" },
  triggerStart: { type: ControlType.String, title: "Trigger", defaultValue: "top 75%" },
  scrub: { type: ControlType.Number, title: "Scrub", defaultValue: 0, min: 0, max: 5, step: 0.1 },
  stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.4, min: 0, max: 1.5, step: 0.05 }
})
`
}

// ─── Generate files ────────────────────────────────────────────────────────

for (const item of decisions.interactions || []) {
  // Override files (unchanged template — lightweight hover wrappers)
  if (item.implementation === "override") {
    const name = toPascalCase(item.id)
    const fileName = `${name}Override.tsx`
    const filePath = path.join(outOverridesDir, fileName)

    const source = `import { forwardRef, type ComponentType, useRef } from "react"

export function ${name}Override<T>(Component: ComponentType<T>): ComponentType<T> {
  return forwardRef<any, T>((props, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null)

    const handleMouseEnter = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transform = "translateY(-2px) scale(1.01)"
      el.style.opacity = "0.96"
    }

    const handleMouseLeave = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transform = "translateY(0px) scale(1)"
      el.style.opacity = "1"
    }

    return (
      <div
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as any).current = node
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "block", width: "100%", height: "100%", willChange: "transform, opacity" }}
      >
        <Component {...props} />
      </div>
    )
  })
}
`
    fs.writeFileSync(filePath, source, "utf8")
    generatedOverrides.push(path.relative(root, filePath))
  }

  // GSAP component files — cursor vs scroll
  if (item.implementation === "gsap-code-component") {
    const name = toPascalCase(item.id)
    const fileName = `${name}Motion.tsx`
    const filePath = path.join(outGsapDir, fileName)

    const source =
      item.kind === "cursor"
        ? cursorFollowerTemplate(`${name}Motion`)
        : scrollRevealTemplate(`${name}Motion`, item)

    fs.writeFileSync(filePath, source, "utf8")
    generatedGsap.push(path.relative(root, filePath))
  }
}

// Always emit a standalone CursorFollower component regardless of decisions
const standaloneFollowerPath = path.join(outGsapDir, "CursorFollower.tsx")
fs.writeFileSync(standaloneFollowerPath, cursorFollowerTemplate("CursorFollower"), "utf8")
generatedGsap.push(path.relative(root, standaloneFollowerPath))

const report = `# Motion Build Report

## Source
- framer/generated/motion/motion-decisions.generated.json

## Generated override files
${generatedOverrides.length ? generatedOverrides.map((f) => `- ${f}`).join("\n") : "- None"}

## Generated GSAP component files
${generatedGsap.map((f) => `- ${f}`).join("\n")}

## Notes
- Overrides are intended for lightweight interaction wrappers.
- GSAP components are intended for advanced scroll, cursor, or timeline behavior.
- CursorFollower.tsx is always generated — add it to the root canvas layer.
- Review each generated file before attaching in Framer.
`

fs.mkdirSync(path.join(root, "docs"), { recursive: true })
fs.writeFileSync(reportPath, report, "utf8")

console.log("Generated override files:")
generatedOverrides.forEach((f) => console.log("-", f))
console.log("Generated GSAP files:")
generatedGsap.forEach((f) => console.log("-", f))
console.log("Report:")
console.log("-", path.relative(root, reportPath))
