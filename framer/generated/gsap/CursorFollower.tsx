import * as React from "react"
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

export default function CursorFollower(props: Props) {
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
          border: `1.5px solid ${props.color}`,
          pointerEvents: "none",
          zIndex: 9999,
          transform: `translate(${-half}px, ${-half}px)`,
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
          transform: `translate(${-props.dotSize / 2}px, ${-props.dotSize / 2}px)`,
          willChange: "transform"
        }}
      />
    </>
  )
}

CursorFollower.defaultProps = {
  ringSize: 40,
  dotSize: 6,
  color: "#F5F5F0",
  mixBlendMode: "difference",
  lag: 0.12,
  scaleFactor: 2.4,
  magneticStrength: 0.3
}

addPropertyControls(CursorFollower, {
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
