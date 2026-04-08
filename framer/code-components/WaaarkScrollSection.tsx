import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

type Props = {
  title: string
  height: number
}

export default function WaaarkScrollSection(props: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  React.useLayoutEffect(() => {
    if (!rootRef.current || !titleRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
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
        height: props.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        width: "100%"
      }}
    >
      <h1 ref={titleRef} style={{ margin: 0 }}>{props.title}</h1>
    </section>
  )
}

addPropertyControls(WaaarkScrollSection, {
  title: { type: ControlType.String, title: "Title", defaultValue: "Studio" },
  height: { type: ControlType.Number, title: "Height", defaultValue: 1200, min: 400, max: 2400, unit: "px" }
})
