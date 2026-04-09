import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

type Props = {
  title: string
  background: string
  textColor: string
  start: string
  end: string
  scrub: number
}

export default function HeroTitleRevealMotion(props: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const content = contentRef.current
    if (!root || !content) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      gsap.set(content, { opacity: 1, y: 0, scale: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        { opacity: 0, y: 80, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: props.start,
            end: props.end,
            scrub: props.scrub
          }
        }
      )
    }, root)

    return () => ctx.revert()
  }, [props.start, props.end, props.scrub])

  return (
    <section
      ref={rootRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: props.background,
        color: props.textColor
      }}
    >
      <div
        ref={contentRef}
        style={{
          textAlign: "center",
          padding: 32
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(48px, 10vw, 128px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em"
          }}
        >
          {props.title}
        </h1>
      </div>
    </section>
  )
}

HeroTitleRevealMotion.defaultProps = {
  title: "hero-title-reveal",
  background: "#0B0B0B",
  textColor: "#F5F5F0",
  start: "top 80%",
  end: "top 20%",
  scrub: 1
}

addPropertyControls(HeroTitleRevealMotion, {
  title: { type: ControlType.String, title: "Title", defaultValue: "hero-title-reveal" },
  background: { type: ControlType.Color, title: "Background", defaultValue: "#0B0B0B" },
  textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F0" },
  start: { type: ControlType.String, title: "Start", defaultValue: "top 80%" },
  end: { type: ControlType.String, title: "End", defaultValue: "top 20%" },
  scrub: { type: ControlType.Number, title: "Scrub", defaultValue: 1, min: 0, max: 5, step: 0.1 }
})
