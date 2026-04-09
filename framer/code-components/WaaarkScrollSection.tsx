import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

type Props = {
  title: string
  sectionHeight: number
  background: string
  textColor: string
}

export default function WaaarkScrollSection(props: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  React.useLayoutEffect(() => {
    if (!rootRef.current || !titleRef.current) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      gsap.set(titleRef.current, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 96 },
        {
          opacity: 1,
          y: 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 80%",
            end: "top 20%",
            scrub: 1
          }
        }
      )
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      style={{
        height: props.sectionHeight,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: props.background,
        color: props.textColor
      }}
    >
      <h1
        ref={titleRef}
        style={{
          margin: 0,
          fontSize: "clamp(48px, 10vw, 140px)",
          lineHeight: 0.95,
          letterSpacing: "-0.05em"
        }}
      >
        {props.title}
      </h1>
    </section>
  )
}

addPropertyControls(WaaarkScrollSection, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "Frameflow"
  },
  sectionHeight: {
    type: ControlType.Number,
    title: "Height",
    defaultValue: 1200,
    min: 480,
    max: 2400,
    unit: "px"
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#0B0B0B"
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: "#F5F5F0"
  }
})
