import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const args = process.argv.slice(2)

const getArg = (name, fallback = "") => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`))
  return hit ? hit.split("=")[1] : fallback
}

const mapFile = getArg("map", "site-map.json")
const mapPath = path.join(root, "orchestrator", "output", mapFile)
const tokensJsonPath = path.join(root, "framer", "generated", "tokens.generated.json")
const outDir = path.join(root, "framer", "generated", "sections")

if (!fs.existsSync(mapPath)) {
  console.error(`Missing site map: orchestrator/output/${mapFile}`)
  process.exit(1)
}

if (!fs.existsSync(tokensJsonPath)) {
  console.error("Missing generated tokens. Run: npm run build:tokens")
  process.exit(1)
}

const siteMap = JSON.parse(fs.readFileSync(mapPath, "utf8"))
const tokens = JSON.parse(fs.readFileSync(tokensJsonPath, "utf8"))
const inlinedTokens = JSON.stringify(tokens, null, 2).replace(/\n/g, "\n  ").trimStart()

fs.mkdirSync(outDir, { recursive: true })

const toPascalCase = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

// ─── kind-specific section generators ────────────────────────────────────────

function heroSection(name, section, mapFile) {
  const title = toPascalCase(section.id || "hero")
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"

/**
 * Generated from ${mapFile} · ${section.id} · kind: hero
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

function CharSplit({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span
          key={i}
          data-char-wrap
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
        >
          <span data-char style={{ display: "inline-block" }}>
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </>
  )
}

type Props = {
  label: string
  headline: string
  subheadline: string
  background: string
  textColor: string
}

export default function ${name}({ label, headline, subheadline, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const chars = el.querySelectorAll("[data-char]")
      const labelEl = el.querySelector("[data-label]")
      const subEl = el.querySelector("[data-sub]")

      if (prefersReducedMotion) {
        gsap.set([chars, labelEl, subEl], { opacity: 1, y: 0 })
        return
      }

      gsap.set(chars, { y: "110%", opacity: 0 })
      gsap.set(labelEl, { opacity: 0, y: 14 })
      gsap.set(subEl, { opacity: 0, y: 20 })

      const tl = gsap.timeline({ delay: 0.08 })
      tl.to(labelEl, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" })
        .to(chars, { y: "0%", opacity: 1, duration: 1.05, ease: "power4.out", stagger: 0.018 }, "-=0.15")
        .to(subEl, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.55")
    }, el)

    return () => ctx.revert()
  }, [headline])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        height: "100vh",
        minHeight: 640,
        background,
        color: textColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: \`\${tokens.spacing.xxl}px\`,
        paddingBottom: \`\${tokens.spacing.xl}px\`,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: tokens.fonts.body
      }}
    >
      <div
        data-label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0.45,
          marginBottom: tokens.spacing.lg,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: tokens.colors.primary,
            display: "inline-block",
            flexShrink: 0
          }}
        />
        {label}
      </div>

      <h1
        style={{
          margin: 0,
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(52px, 9vw, 130px)",
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          fontWeight: 700,
          overflow: "hidden"
        }}
      >
        <CharSplit text={headline} />
      </h1>

      <p
        data-sub
        style={{
          margin: \`\${tokens.spacing.xl}px 0 0\`,
          maxWidth: "38ch",
          fontFamily: tokens.fonts.body,
          fontSize: 15,
          lineHeight: 1.68,
          opacity: 0.62
        }}
      >
        {subheadline}
      </p>
    </section>
  )
}

${name}.defaultProps = {
  label: "Creative Studio",
  headline: "We craft digital experiences",
  subheadline: "Full-cycle design and development for ambitious brands.",
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(${name}, {
  label:        { type: ControlType.String, title: "Label",        defaultValue: "Creative Studio" },
  headline:     { type: ControlType.String, title: "Headline",     defaultValue: "We craft digital experiences" },
  subheadline:  { type: ControlType.String, title: "Subheadline",  defaultValue: "Full-cycle design and development for ambitious brands." },
  background:   { type: ControlType.Color,  title: "Background",   defaultValue: tokens.colors.background },
  textColor:    { type: ControlType.Color,  title: "Text",         defaultValue: tokens.colors.text },
})
`
}

function gallerySection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: gallery
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

type WorkItem = { number: string; title: string; category: string; year: string }

const defaultProjects: WorkItem[] = [
  { number: "01", title: "Brand Identity", category: "Branding", year: "2024" },
  { number: "02", title: "Digital Experience", category: "Web", year: "2024" },
  { number: "03", title: "Motion System", category: "Motion", year: "2023" },
]

type Props = {
  sectionLabel: string
  background: string
  textColor: string
  accentColor: string
}

export default function ${name}({ sectionLabel, background, textColor, accentColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const items = el.querySelectorAll("[data-work-item]")
      const header = el.querySelector("[data-section-header]")

      if (prefersReducedMotion) {
        gsap.set([header, ...items], { opacity: 1, y: 0 })
        return
      }

      gsap.set(header, { opacity: 0, y: 20 })
      gsap.set(items, { opacity: 0, y: 60 })

      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        onEnter: () => {
          gsap.to(header, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })
          gsap.to(items, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.12, delay: 0.15 })
        }
      })

      // Hover lines
      items.forEach((item) => {
        const line = item.querySelector("[data-line]") as HTMLElement | null
        if (!line) return

        item.addEventListener("mouseenter", () => {
          gsap.to(line, { scaleX: 1, duration: 0.4, ease: "power2.out", transformOrigin: "left" })
          gsap.to(item, { x: 8, duration: 0.4, ease: "power2.out" })
        })
        item.addEventListener("mouseleave", () => {
          gsap.to(line, { scaleX: 0, duration: 0.3, ease: "power2.in", transformOrigin: "left" })
          gsap.to(item, { x: 0, duration: 0.35, ease: "power2.out" })
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        background,
        color: textColor,
        padding: \`\${tokens.spacing.xxl}px\`,
        paddingTop: \`\${tokens.spacing.xxl * 1.25}px\`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <div
        data-section-header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: tokens.spacing.xxl,
          paddingBottom: tokens.spacing.md,
          borderBottom: \`1px solid \${tokens.colors.border}\`
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.4 }}>
          {sectionLabel}
        </span>
        <span style={{ fontSize: 11, opacity: 0.3 }}>({defaultProjects.length})</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {defaultProjects.map((project, idx) => (
          <div
            key={idx}
            data-work-item
            style={{
              position: "relative",
              display: "flex",
              alignItems: "baseline",
              gap: tokens.spacing.xl,
              padding: \`\${tokens.spacing.xl}px 0\`,
              borderBottom: \`1px solid \${tokens.colors.border}\`,
              cursor: "pointer",
              transition: "none"
            }}
          >
            <span
              style={{
                fontFamily: tokens.fonts.display,
                fontSize: 13,
                opacity: 0.3,
                letterSpacing: "0.06em",
                flexShrink: 0,
                minWidth: 28
              }}
            >
              {project.number}
            </span>

            <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: tokens.spacing.lg, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: tokens.fonts.display,
                  fontSize: "clamp(28px, 4.5vw, 60px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1
                }}
              >
                {project.title}
              </span>
              <span style={{ fontSize: 12, opacity: 0.4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {project.category}
              </span>
            </div>

            <span style={{ fontSize: 12, opacity: 0.3, flexShrink: 0 }}>{project.year}</span>

            <div
              data-line
              style={{
                position: "absolute",
                bottom: -1,
                left: 0,
                right: 0,
                height: 1,
                background: accentColor,
                transform: "scaleX(0)",
                transformOrigin: "left"
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

${name}.defaultProps = {
  sectionLabel: "Selected Work",
  background: tokens.colors.background,
  textColor: tokens.colors.text,
  accentColor: tokens.colors.primary
}

addPropertyControls(${name}, {
  sectionLabel: { type: ControlType.String, title: "Label",       defaultValue: "Selected Work" },
  background:   { type: ControlType.Color,  title: "Background",  defaultValue: tokens.colors.background },
  textColor:    { type: ControlType.Color,  title: "Text",        defaultValue: tokens.colors.text },
  accentColor:  { type: ControlType.Color,  title: "Accent",      defaultValue: tokens.colors.primary },
})
`
}

function storySection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: story
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

type Props = {
  sectionLabel: string
  counter: string
  headline: string
  body: string
  background: string
  textColor: string
}

export default function ${name}({ sectionLabel, counter, headline, body, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const counterEl = el.querySelector("[data-counter]")
      const headlineEl = el.querySelector("[data-headline]")
      const bodyEl = el.querySelector("[data-body]")

      if (prefersReducedMotion) {
        gsap.set([counterEl, headlineEl, bodyEl], { opacity: 1, y: 0 })
        return
      }

      gsap.set(counterEl, { opacity: 0, x: -20 })
      gsap.set(headlineEl, { opacity: 0, y: 40 })
      gsap.set(bodyEl, { opacity: 0, y: 24 })

      ScrollTrigger.create({
        trigger: el,
        start: "top 72%",
        onEnter: () => {
          const tl = gsap.timeline()
          tl.to(counterEl, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" })
            .to(headlineEl, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, "-=0.2")
            .to(bodyEl, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.4")
        }
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        background,
        color: textColor,
        padding: \`\${tokens.spacing.xxl}px\`,
        paddingTop: \`\${tokens.spacing.xxl * 1.5}px\`,
        paddingBottom: \`\${tokens.spacing.xxl * 1.5}px\`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: \`\${tokens.spacing.xxl}px\`,
          alignItems: "start",
          maxWidth: 1280
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              opacity: 0.38,
              marginBottom: tokens.spacing.xl
            }}
          >
            {sectionLabel}
          </div>
          <div
            data-counter
            style={{
              fontFamily: tokens.fonts.display,
              fontSize: "clamp(80px, 12vw, 160px)",
              fontWeight: 700,
              lineHeight: 0.85,
              letterSpacing: "-0.05em",
              opacity: 0.08
            }}
          >
            {counter}
          </div>
        </div>

        <div>
          <h2
            data-headline
            style={{
              margin: \`0 0 \${tokens.spacing.xl}px\`,
              fontFamily: tokens.fonts.display,
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em"
            }}
          >
            {headline}
          </h2>
          <p
            data-body
            style={{
              margin: 0,
              maxWidth: "52ch",
              fontSize: 16,
              lineHeight: 1.72,
              opacity: 0.65
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  )
}

${name}.defaultProps = {
  sectionLabel: "Studio",
  counter: "01",
  headline: "We believe that design shapes the way the world thinks.",
  body: "A cross-disciplinary studio merging brand strategy, interaction design and engineering to build experiences that feel inevitable.",
  background: tokens.colors.surface,
  textColor: tokens.colors.text
}

addPropertyControls(${name}, {
  sectionLabel: { type: ControlType.String, title: "Label",    defaultValue: "Studio" },
  counter:      { type: ControlType.String, title: "Counter",  defaultValue: "01" },
  headline:     { type: ControlType.String, title: "Headline", defaultValue: "We believe that design shapes the way the world thinks." },
  body:         { type: ControlType.String, title: "Body",     defaultValue: "A cross-disciplinary studio." },
  background:   { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.surface },
  textColor:    { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
})
`
}

function servicesSection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: services
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

const defaultServices = [
  { id: "01", name: "Brand Strategy", desc: "Positioning, naming, voice" },
  { id: "02", name: "Visual Identity", desc: "Logo, type, color, motion" },
  { id: "03", name: "Digital Design", desc: "Web, app, interaction design" },
  { id: "04", name: "Development", desc: "Framer, React, GSAP" },
]

type Props = {
  sectionLabel: string
  background: string
  textColor: string
}

export default function ${name}({ sectionLabel, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const items = el.querySelectorAll("[data-service]")
      if (prefersReducedMotion) { gsap.set(items, { opacity: 1, y: 0 }); return }
      gsap.set(items, { opacity: 0, y: 30 })
      ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1 })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        background,
        color: textColor,
        padding: \`\${tokens.spacing.xxl}px\`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.38, marginBottom: tokens.spacing.xxl }}>
        {sectionLabel}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: \`\${tokens.spacing.xl}px\` }}>
        {defaultServices.map((s) => (
          <div key={s.id} data-service style={{ paddingTop: tokens.spacing.lg, borderTop: \`1px solid \${tokens.colors.border}\` }}>
            <div style={{ fontSize: 11, opacity: 0.3, marginBottom: tokens.spacing.md, letterSpacing: "0.08em" }}>{s.id}</div>
            <div style={{ fontFamily: tokens.fonts.display, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: tokens.spacing.sm }}>{s.name}</div>
            <div style={{ fontSize: 13, opacity: 0.52, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

${name}.defaultProps = {
  sectionLabel: "What we do",
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(${name}, {
  sectionLabel: { type: ControlType.String, title: "Label",      defaultValue: "What we do" },
  background:   { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.background },
  textColor:    { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
})
`
}

function contactSection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: contact
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

type Props = {
  sectionLabel: string
  headline: string
  email: string
  background: string
  textColor: string
  accentColor: string
}

export default function ${name}({ sectionLabel, headline, email, background, textColor, accentColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const linkRef = React.useRef<HTMLAnchorElement | null>(null)
  const underlineRef = React.useRef<HTMLSpanElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    const link = linkRef.current
    const underline = underlineRef.current
    if (!el || !link || !underline) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const headEl = el.querySelector("[data-headline]")
      const ctaEl = el.querySelector("[data-cta]")

      if (prefersReducedMotion) { gsap.set([headEl, ctaEl], { opacity: 1, y: 0 }); return }

      gsap.set([headEl, ctaEl], { opacity: 0, y: 30 })
      ScrollTrigger.create({
        trigger: el, start: "top 75%",
        onEnter: () => {
          gsap.to(headEl, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
          gsap.to(ctaEl,  { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 })
        }
      })

      gsap.set(underline, { scaleX: 0, transformOrigin: "left" })
      link.addEventListener("mouseenter", () => gsap.to(underline, { scaleX: 1, duration: 0.4, ease: "power2.out" }))
      link.addEventListener("mouseleave", () => gsap.to(underline, { scaleX: 0, duration: 0.3, ease: "power2.in", transformOrigin: "right" }))
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        minHeight: "60vh",
        background,
        color: textColor,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: \`\${tokens.spacing.xxl}px\`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.38, marginBottom: tokens.spacing.xl }}>{sectionLabel}</div>

      <h2
        data-headline
        style={{
          margin: \`0 0 \${tokens.spacing.xxl}px\`,
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(36px, 5.5vw, 80px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          maxWidth: "14ch"
        }}
      >
        {headline}
      </h2>

      <div data-cta>
        <a
          ref={linkRef}
          href={\`mailto:\${email}\`}
          style={{
            position: "relative",
            display: "inline-block",
            color: accentColor,
            textDecoration: "none",
            fontFamily: tokens.fonts.display,
            fontSize: "clamp(22px, 3vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.02em"
          }}
        >
          {email}
          <span
            ref={underlineRef}
            style={{
              position: "absolute",
              bottom: -3,
              left: 0,
              right: 0,
              height: 2,
              background: accentColor,
              display: "block"
            }}
          />
        </a>
      </div>
    </section>
  )
}

${name}.defaultProps = {
  sectionLabel: "Contact",
  headline: "Let's build something together.",
  email: "hello@studio.com",
  background: tokens.colors.background,
  textColor: tokens.colors.text,
  accentColor: tokens.colors.primary
}

addPropertyControls(${name}, {
  sectionLabel: { type: ControlType.String, title: "Label",   defaultValue: "Contact" },
  headline:     { type: ControlType.String, title: "Headline",defaultValue: "Let's build something together." },
  email:        { type: ControlType.String, title: "Email",   defaultValue: "hello@studio.com" },
  background:   { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.background },
  textColor:    { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
  accentColor:  { type: ControlType.Color,  title: "Accent",     defaultValue: tokens.colors.primary },
})
`
}

function footerSection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: footer
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

type Props = {
  studioName: string
  tagline: string
  copyright: string
  background: string
  textColor: string
}

export default function ${name}({ studioName, tagline, copyright, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const wordmark = el.querySelector("[data-wordmark]")
      const meta = el.querySelector("[data-meta]")

      if (prefersReducedMotion) { gsap.set([wordmark, meta], { opacity: 1, y: 0 }); return }

      gsap.set(wordmark, { opacity: 0, y: 24 })
      gsap.set(meta, { opacity: 0 })

      ScrollTrigger.create({
        trigger: el, start: "top 85%",
        onEnter: () => {
          gsap.to(wordmark, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" })
          gsap.to(meta, { opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.3 })
        }
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <footer
      ref={rootRef}
      style={{
        width: "100%",
        background,
        color: textColor,
        padding: \`\${tokens.spacing.xxl}px\`,
        boxSizing: "border-box",
        borderTop: \`1px solid \${tokens.colors.border}\`,
        fontFamily: tokens.fonts.body
      }}
    >
      <div
        data-wordmark
        style={{
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(48px, 9vw, 120px)",
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 0.9,
          marginBottom: tokens.spacing.xxl,
          opacity: 0.06
        }}
      >
        {studioName}
      </div>

      <div
        data-meta
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: tokens.spacing.lg,
          paddingTop: tokens.spacing.xl,
          borderTop: \`1px solid \${tokens.colors.border}\`,
          fontSize: 12,
          opacity: 0.4
        }}
      >
        <span>{tagline}</span>
        <span>{copyright}</span>
      </div>
    </footer>
  )
}

${name}.defaultProps = {
  studioName: "Studio",
  tagline: "Design & development for ambitious brands",
  copyright: \`© \${new Date().getFullYear()} All rights reserved\`,
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(${name}, {
  studioName:  { type: ControlType.String, title: "Studio Name", defaultValue: "Studio" },
  tagline:     { type: ControlType.String, title: "Tagline",     defaultValue: "Design & development" },
  copyright:   { type: ControlType.String, title: "Copyright",   defaultValue: "© 2024 All rights reserved" },
  background:  { type: ControlType.Color,  title: "Background",  defaultValue: tokens.colors.background },
  textColor:   { type: ControlType.Color,  title: "Text",        defaultValue: tokens.colors.text },
})
`
}

function genericSection(name, section, mapFile) {
  return `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from ${mapFile} · ${section.id} · kind: ${section.kind}
 * ${section.notes || ""}
 */

const tokens = ${inlinedTokens}

type Props = {
  headline: string
  body: string
  background: string
  textColor: string
}

export default function ${name}({ headline, body, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const headEl = el.querySelector("[data-head]")
      const bodyEl = el.querySelector("[data-body]")
      if (prefersReducedMotion) { gsap.set([headEl, bodyEl], { opacity: 1, y: 0 }); return }
      gsap.set([headEl, bodyEl], { opacity: 0, y: 32 })
      ScrollTrigger.create({
        trigger: el, start: "top 78%",
        onEnter: () => {
          gsap.to(headEl, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
          gsap.to(bodyEl, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.2 })
        }
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        background,
        color: textColor,
        padding: \`\${tokens.spacing.xxl}px\`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <h2
        data-head
        style={{
          margin: \`0 0 \${tokens.spacing.xl}px\`,
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(32px, 5vw, 72px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.0
        }}
      >
        {headline}
      </h2>
      <p data-body style={{ margin: 0, maxWidth: "52ch", fontSize: 16, lineHeight: 1.7, opacity: 0.65 }}>
        {body}
      </p>
    </section>
  )
}

${name}.defaultProps = {
  headline: "${section.id}",
  body: "${section.notes || ""}",
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(${name}, {
  headline:   { type: ControlType.String, title: "Headline", defaultValue: "${section.id}" },
  body:       { type: ControlType.String, title: "Body",     defaultValue: "${section.notes || ""}" },
  background: { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.background },
  textColor:  { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
})
`
}

// ─── dispatch ─────────────────────────────────────────────────────────────────

function generateSection(componentName, section, mapFile) {
  switch (section.kind) {
    case "hero":     return heroSection(componentName, section, mapFile)
    case "gallery":  return gallerySection(componentName, section, mapFile)
    case "story":    return storySection(componentName, section, mapFile)
    case "services": return servicesSection(componentName, section, mapFile)
    case "contact":  return contactSection(componentName, section, mapFile)
    case "footer":   return footerSection(componentName, section, mapFile)
    default:         return genericSection(componentName, section, mapFile)
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

const files = []

for (const page of siteMap.pages || []) {
  for (const section of page.sections || []) {
    const componentName = toPascalCase(`${page.id}-${section.id}-section`)
    const fileName = `${componentName}.tsx`
    const filePath = path.join(outDir, fileName)

    const content = generateSection(componentName, section, mapFile)
    fs.writeFileSync(filePath, content, "utf8")
    files.push(path.relative(root, filePath))
  }
}

const manifestPath = path.join(outDir, "_manifest.json")
fs.writeFileSync(
  manifestPath,
  JSON.stringify({ source: `orchestrator/output/${mapFile}`, generatedAt: new Date().toISOString(), files }, null, 2) + "\n",
  "utf8"
)

console.log("Generated section files:")
for (const file of files) console.log(`- ${file}`)
console.log(`- ${path.relative(root, manifestPath)}`)
