import { forwardRef, type ComponentType, useRef } from "react"

type Point = { x: number; y: number }

export function withMagneticHover<T>(Component: ComponentType<T>): ComponentType<T> {
  return forwardRef<any, T>((props, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null)

    const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
      const el = innerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2

      el.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`
      el.style.transition = "transform 120ms cubic-bezier(0.22, 1, 0.36, 1)"
    }

    const handleLeave = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transform = "translate(0px, 0px)"
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)"
    }

    return (
      <div
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as any).current = node
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ display: "inline-block", willChange: "transform" }}
      >
        <Component {...props} />
      </div>
    )
  })
}
