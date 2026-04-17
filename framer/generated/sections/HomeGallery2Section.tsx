import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from site-map.json · gallery-2 · kind: gallery (list)
 * Premium cinematic card entries, hover reveals secondary info, numbered list
 */

const tokens = {
    "themeName": "waaark-com",
    "fonts": {
      "display": "Inter",
      "body": "Inter"
    },
    "colors": {
      "background": "#0a0a0a",
      "surface": "#111111",
      "surface2": "#171717",
      "text": "#f5f5f0",
      "muted": "#b8b8b0",
      "primary": "#d6ff3f",
      "border": "rgba(255,255,255,0.08)"
    },
    "radius": {
      "sm": 4,
      "md": 10,
      "lg": 20
    },
    "spacing": {
      "xs": 4,
      "sm": 8,
      "md": 16,
      "lg": 24,
      "xl": 48,
      "xxl": 96
    },
    "motion": {
      "easePrimary": "power4.out",
      "durationFast": 0.4,
      "durationBase": 0.95,
      "durationSlow": 1.5
    },
    "siteStyle": {
      "textAlign": "left",
      "heroStyle": "text-only",
      "galleryStyle": "list",
      "animationTempo": "cinematic",
      "displayFontSize": "clamp(44px, 7.1vw, 100px)",
      "bodyFontSize": "16px",
      "letterSpacing": "-0.04em",
      "borderRadius": "0px",
      "hasMarquee": false,
      "hasMagneticCursor": true
    }
  }

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

export default function HomeGallery2Section({ sectionLabel, background, textColor, accentColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const items  = el.querySelectorAll("[data-work-item]")
      const header = el.querySelector("[data-section-header]")

      if (prefersReducedMotion) {
        gsap.set([header, ...items], { opacity: 1, y: 0 })
        return
      }

      gsap.set(header, { opacity: 0, y: 20 })
      gsap.set(items,  { opacity: 0, y: 50 })

      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        onEnter: () => {
          gsap.to(header, { opacity: 1, y: 0, duration: 0.63, ease: "power2.out" })
          gsap.to(items,  { opacity: 1, y: 0, duration: 1.05, ease: "power4.out", stagger: 0.10799999999999998, delay: 0.12 })
        }
      })

      items.forEach((item) => {
        const line = item.querySelector("[data-line]") as HTMLElement | null
        if (!line) return
        item.addEventListener("mouseenter", () => {
          gsap.to(line, { scaleX: 1, duration: 0.85, ease: "power4.out", transformOrigin: "left" })
          gsap.to(item, { x: 8, duration: 0.85, ease: "power2.out" })
        })
        item.addEventListener("mouseleave", () => {
          gsap.to(line, { scaleX: 0, duration: 0.68, ease: "power2.in", transformOrigin: "right" })
          gsap.to(item, { x: 0, duration: 0.85, ease: "power2.out" })
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
        padding: `${tokens.spacing.xxl}px`,
        paddingTop: `${tokens.spacing.xxl * 1.25}px`,
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
          borderBottom: `1px solid ${tokens.colors.border}`
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
              padding: `${tokens.spacing.xl}px 0`,
              borderBottom: `1px solid ${tokens.colors.border}`,
              cursor: "pointer"
            }}
          >
            <span style={{ fontFamily: tokens.fonts.display, fontSize: 13, opacity: 0.3, letterSpacing: "0.06em", flexShrink: 0, minWidth: 28 }}>
              {project.number}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: tokens.spacing.lg, flexWrap: "wrap" }}>
              <span style={{ fontFamily: tokens.fonts.display, fontSize: "clamp(26px, 4vw, 56px)", fontWeight: 700, letterSpacing: "-0.028em", lineHeight: 1 }}>
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

HomeGallery2Section.defaultProps = {
  sectionLabel: "Selected Work",
  background: tokens.colors.background,
  textColor: tokens.colors.text,
  accentColor: tokens.colors.primary
}

addPropertyControls(HomeGallery2Section, {
  sectionLabel: { type: ControlType.String, title: "Label",      defaultValue: "Selected Work" },
  background:   { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.background },
  textColor:    { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
  accentColor:  { type: ControlType.Color,  title: "Accent",     defaultValue: tokens.colors.primary },
})
