import * as React from "react"
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

export default function HeroTitleRevealMotion(props: Props) {
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
        .to(sub, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, `-=${props.stagger}`)
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

HeroTitleRevealMotion.defaultProps = {
  title: "hero-title-reveal",
  subtitle: "A scroll-triggered section with staggered reveal.",
  background: "#0B0B0B",
  textColor: "#F5F5F0",
  accentColor: "#F5F5F0",
  triggerStart: "top 75%",
  scrub: 0,
  stagger: 0.4
}

addPropertyControls(HeroTitleRevealMotion, {
  title: { type: ControlType.String, title: "Title", defaultValue: "hero-title-reveal" },
  subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "A scroll-triggered section." },
  background: { type: ControlType.Color, title: "Background", defaultValue: "#0B0B0B" },
  textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F0" },
  accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#F5F5F0" },
  triggerStart: { type: ControlType.String, title: "Trigger", defaultValue: "top 75%" },
  scrub: { type: ControlType.Number, title: "Scrub", defaultValue: 0, min: 0, max: 5, step: 0.1 },
  stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.4, min: 0, max: 1.5, step: 0.05 }
})
