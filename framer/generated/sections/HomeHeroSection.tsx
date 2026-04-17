import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"

/**
 * Generated from site-map.json · hero · kind: hero
 * Large kinetic display type, bottom-anchored layout, immediate cinematic impact
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

export default function HomeHeroSection({ label, headline, subheadline, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const chars  = el.querySelectorAll("[data-char]")
      const labelEl = el.querySelector("[data-label]")
      const subEl   = el.querySelector("[data-sub]")

      if (prefersReducedMotion) {
        gsap.set([chars, labelEl, subEl], { opacity: 1, y: 0 })
        return
      }

      gsap.set(chars,   { y: "110%", opacity: 0 })
      gsap.set(labelEl, { opacity: 0, y: 14 })
      gsap.set(subEl,   { opacity: 0, y: 20 })

      const tl = gsap.timeline({ delay: 0.08 })
      tl.to(labelEl, { opacity: 1, y: 0, duration: 0.58, ease: "power2.out" })
        .to(chars,   { y: "0%", opacity: 1, duration: 1.05, ease: "power4.out", stagger: 0.018 }, "-=0.15")
        .to(subEl,   { opacity: 1, y: 0,    duration: 0.73, ease: "power2.out" }, `-=${1.05 * 0.5}`)
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
        alignItems: "flex-start",
        textAlign: "left",
        padding: `${tokens.spacing.xxl}px`,
        paddingBottom: `${tokens.spacing.xl}px`,
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
          fontSize: "clamp(44px, 7.1vw, 100px)",
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          fontWeight: 700
        }}
      >
        <CharSplit text={headline} />
      </h1>

      <p
        data-sub
        style={{
          margin: `${tokens.spacing.xl}px 0 0`,
          maxWidth: "38ch",
          fontFamily: tokens.fonts.body,
          fontSize: tokens.siteStyle.bodyFontSize,
          lineHeight: 1.68,
          opacity: 0.62,
          
        }}
      >
        {subheadline}
      </p>
    </section>
  )
}

HomeHeroSection.defaultProps = {
  label: "Creative Studio",
  headline: "We craft digital experiences",
  subheadline: "Full-cycle design and development for ambitious brands.",
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(HomeHeroSection, {
  label:       { type: ControlType.String, title: "Label",       defaultValue: "Creative Studio" },
  headline:    { type: ControlType.String, title: "Headline",    defaultValue: "We craft digital experiences" },
  subheadline: { type: ControlType.String, title: "Subheadline", defaultValue: "Full-cycle design and development for ambitious brands." },
  background:  { type: ControlType.Color,  title: "Background",  defaultValue: tokens.colors.background },
  textColor:   { type: ControlType.Color,  title: "Text",        defaultValue: tokens.colors.text },
})
