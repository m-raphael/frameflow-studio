import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * Generated from site-map.json · footer-4 · kind: footer
 * Simple intentional close, copyright and social links
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
  studioName: string
  tagline: string
  copyright: string
  background: string
  textColor: string
}

export default function HomeFooter4Section({ studioName, tagline, copyright, background, textColor }: Props) {
  const rootRef = React.useRef<HTMLElement | null>(null)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const wordmark = el.querySelector("[data-wordmark]")
      const meta     = el.querySelector("[data-meta]")

      if (prefersReducedMotion) { gsap.set([wordmark, meta], { opacity: 1, y: 0 }); return }

      gsap.set(wordmark, { opacity: 0, y: 30 })
      gsap.set(meta,     { opacity: 0 })

      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        onEnter: () => {
          gsap.to(wordmark, { opacity: 1, y: 0, duration: 1.05,  ease: "power4.out" })
          gsap.to(meta,     { opacity: 1,       duration: 0.73, ease: "power2.out", delay: 0.32 })
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
        padding: `${tokens.spacing.xxl}px`,
        boxSizing: "border-box",
        borderTop: `1px solid ${tokens.colors.border}`,
        fontFamily: tokens.fonts.body,
        textAlign: "left"
      }}
    >
      <div
        data-wordmark
        style={{
          fontFamily: tokens.fonts.display,
          fontSize: "clamp(44px, 7.1vw, 100px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 0.88,
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
          borderTop: `1px solid ${tokens.colors.border}`,
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

HomeFooter4Section.defaultProps = {
  studioName: "Studio",
  tagline: "Design & development for ambitious brands",
  copyright: `© ${new Date().getFullYear()} All rights reserved`,
  background: tokens.colors.background,
  textColor: tokens.colors.text
}

addPropertyControls(HomeFooter4Section, {
  studioName: { type: ControlType.String, title: "Studio Name", defaultValue: "Studio" },
  tagline:    { type: ControlType.String, title: "Tagline",     defaultValue: "Design & development" },
  copyright:  { type: ControlType.String, title: "Copyright",   defaultValue: "© 2024 All rights reserved" },
  background: { type: ControlType.Color,  title: "Background",  defaultValue: tokens.colors.background },
  textColor:  { type: ControlType.Color,  title: "Text",        defaultValue: tokens.colors.text },
})
