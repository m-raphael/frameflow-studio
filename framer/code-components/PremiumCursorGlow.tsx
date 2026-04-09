import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import gsap from "gsap"

type Props = {
  label: string
  background: string
  textColor: string
  glowColor: string
  radius: number
  paddingX: number
  paddingY: number
}

const tokenDefaults = {
  background: "#111111",
  textColor: "#F5F5F0",
  glowColor: "#D6FF3F",
  radius: 24,
  paddingX: 24,
  paddingY: 18
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @intrinsicWidth 260
 * @intrinsicHeight 88
 */
export default function PremiumCursorGlow(props: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const glowRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const glow = glowRef.current
    if (!root || !glow) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const handleMove = (event: MouseEvent) => {
      if (prefersReducedMotion) return
      const rect = root.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      gsap.to(glow, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        opacity: 0.9,
        scale: 1,
        duration: 0.28,
        ease: "power3.out"
      })
    }

    const handleEnter = () => {
      if (prefersReducedMotion) return
      gsap.to(glow, {
        opacity: 0.85,
        scale: 1,
        duration: 0.28,
        ease: "power3.out"
      })
    }

    const handleLeave = () => {
      gsap.to(glow, {
        opacity: prefersReducedMotion ? 0 : 0,
        scale: 0.6,
        duration: 0.42,
        ease: "power3.out"
      })
    }

    root.addEventListener("mousemove", handleMove)
    root.addEventListener("mouseenter", handleEnter)
    root.addEventListener("mouseleave", handleLeave)

    return () => {
      root.removeEventListener("mousemove", handleMove)
      root.removeEventListener("mouseenter", handleEnter)
      root.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 88,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${props.paddingY}px ${props.paddingX}px`,
        borderRadius: props.radius,
        background: props.background,
        color: props.textColor,
        border: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 180,
          height: 180,
          borderRadius: 999,
          pointerEvents: "none",
          opacity: 0,
          transform: "translate(-50%, -50%) scale(0.6)",
          background: `radial-gradient(circle, ${props.glowColor} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(18px)",
          mixBlendMode: "screen"
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.03em"
        }}
      >
        {props.label}
      </div>
    </div>
  )
}

PremiumCursorGlow.defaultProps = {
  label: "Hover me",
  ...tokenDefaults
}

addPropertyControls(PremiumCursorGlow, {
  label: {
    type: ControlType.String,
    title: "Label",
    defaultValue: "Hover me"
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: tokenDefaults.background
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: tokenDefaults.textColor
  },
  glowColor: {
    type: ControlType.Color,
    title: "Glow",
    defaultValue: tokenDefaults.glowColor
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    defaultValue: tokenDefaults.radius,
    min: 0,
    max: 64,
    unit: "px"
  },
  paddingX: {
    type: ControlType.Number,
    title: "Pad X",
    defaultValue: tokenDefaults.paddingX,
    min: 0,
    max: 80,
    unit: "px"
  },
  paddingY: {
    type: ControlType.Number,
    title: "Pad Y",
    defaultValue: tokenDefaults.paddingY,
    min: 0,
    max: 80,
    unit: "px"
  }
})
