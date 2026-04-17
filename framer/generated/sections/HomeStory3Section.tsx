import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from site-map.json · story-3 · kind: story
 * Strong rhythm, large display numbers, restrained body copy, purposeful whitespace
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

type Props = {
  sectionLabel: string
  counter: string
  headline: string
  body: string
  background: string
  textColor: string
}

export default function HomeStory3Section({ sectionLabel, counter, headline, body, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const counterEl  = el.querySelector("[data-counter]")
      const headlineEl = el.querySelector("[data-headline]")
      const bodyEl     = el.querySelector("[data-body]")

      if (prefersReducedMotion) {
        gsap.set([counterEl, headlineEl, bodyEl], { opacity: 1, y: 0, x: 0 })
        return
      }

      gsap.set(counterEl,  { opacity: 0, x: -20 })
      gsap.set(headlineEl, { opacity: 0, y: 40 })
      gsap.set(bodyEl,     { opacity: 0, y: 24 })

      ScrollTrigger.create({
        trigger: el,
        start: "top 72%",
        onEnter: () => {
          const tl = gsap.timeline()
          tl.to(counterEl,  { opacity: 1, x: 0, duration: 0.63, ease: "power2.out" })
            .to(headlineEl, { opacity: 1, y: 0, duration: 1.05,                     ease: "power4.out" }, "-=0.2")
            .to(bodyEl,     { opacity: 1, y: 0, duration: 0.79, ease: "power2.out" }, `-=${1.05 * 0.45}`)
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
        padding: `${tokens.spacing.xxl * 1.5}px ${tokens.spacing.xxl}px`,
        boxSizing: "border-box",
        fontFamily: tokens.fonts.body
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: `${tokens.spacing.xxl}px`,
          alignItems: "start",
          maxWidth: 1280,
          
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.38, marginBottom: tokens.spacing.xl }}>
            {sectionLabel}
          </div>
          <div
            data-counter
            style={{
              fontFamily: tokens.fonts.display,
              fontSize: "clamp(80px, 12vw, 160px)",
              fontWeight: 700,
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              opacity: 0.07
            }}
          >
            {counter}
          </div>
        </div>

        <div>
          
          <h2
            data-headline
            style={{
              margin: `0 0 ${tokens.spacing.xl}px`,
              fontFamily: tokens.fonts.display,
              fontSize: "clamp(30px, 3.8vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.030em",
              
            }}
          >
            {headline}
          </h2>
          <p
            data-body
            style={{
              margin: 0,
              maxWidth: "52ch",
              fontSize: tokens.siteStyle.bodyFontSize,
              lineHeight: 1.72,
              opacity: 0.65,
              
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  )
}

HomeStory3Section.defaultProps = {
  sectionLabel: "Studio",
  counter: "01",
  headline: "We believe that design shapes the way the world thinks.",
  body: "A cross-disciplinary studio merging brand strategy, interaction design and engineering to build experiences that feel inevitable.",
  background: tokens.colors.surface,
  textColor: tokens.colors.text
}

addPropertyControls(HomeStory3Section, {
  sectionLabel: { type: ControlType.String, title: "Label",    defaultValue: "Studio" },
  counter:      { type: ControlType.String, title: "Counter",  defaultValue: "01" },
  headline:     { type: ControlType.String, title: "Headline", defaultValue: "We believe that design shapes the way the world thinks." },
  body:         { type: ControlType.String, title: "Body",     defaultValue: "A cross-disciplinary studio." },
  background:   { type: ControlType.Color,  title: "Background", defaultValue: tokens.colors.surface },
  textColor:    { type: ControlType.Color,  title: "Text",       defaultValue: tokens.colors.text },
})
