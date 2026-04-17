import { forwardRef, type ComponentType, useRef } from "react"

export function WorkCardHoverOverride<T>(Component: ComponentType<T>): ComponentType<T> {
  return forwardRef<any, T>((props, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null)

    const handleMouseEnter = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transform = "translateY(-2px) scale(1.01)"
      el.style.opacity = "0.96"
    }

    const handleMouseLeave = () => {
      const el = innerRef.current
      if (!el) return
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms cubic-bezier(0.22, 1, 0.36, 1)"
      el.style.transform = "translateY(0px) scale(1)"
      el.style.opacity = "1"
    }

    return (
      <div
        ref={(node) => {
          innerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) (ref as any).current = node
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "block", width: "100%", height: "100%", willChange: "transform, opacity" }}
      >
        <Component {...props} />
      </div>
    )
  })
}
