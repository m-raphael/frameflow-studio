import { forwardRef, type ComponentType, useRef } from "react"

export function withCursorParallax<T>(Component: ComponentType<T>): ComponentType<T> {
  return forwardRef<any, T>((props, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null)

    const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
      const el = innerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width - 0.5
      const py = (event.clientY - rect.top) / rect.height - 0.5

      el.style.transform = `translate3d(${px * 18}px, ${py * 18}px, 0) scale(1.01)`
      el.style.transition = "transform 120ms cubic-bezier(0.22, 1, 0.36, 1)"
    }

    const handleLeave = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transform = "translate3d(0px, 0px, 0) scale(1)"
      el.style.transition = "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)"
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
        style={{ display: "block", width: "100%", height: "100%", willChange: "transform" }}
      >
        <Component {...props} />
      </div>
    )
  })
}
