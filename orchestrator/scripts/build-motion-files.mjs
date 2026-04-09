import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const decisionsPath = path.join(root, "framer", "generated", "motion", "motion-decisions.generated.json")
const outOverridesDir = path.join(root, "framer", "generated", "overrides")
const outGsapDir = path.join(root, "framer", "generated", "gsap")
const reportPath = path.join(root, "docs", "motion-build-report.md")

if (!fs.existsSync(decisionsPath)) {
  console.error("Missing motion decisions file. Run: npm run build:motion")
  process.exit(1)
}

fs.mkdirSync(outOverridesDir, { recursive: true })
fs.mkdirSync(outGsapDir, { recursive: true })

const decisions = JSON.parse(fs.readFileSync(decisionsPath, "utf8"))

const toPascalCase = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

const generatedOverrides = []
const generatedGsap = []

for (const item of decisions.interactions || []) {
  if (item.implementation === "override") {
    const name = toPascalCase(item.id)
    const fileName = `${name}Override.tsx`
    const filePath = path.join(outOverridesDir, fileName)

    const source = `import { forwardRef, type ComponentType, useRef } from "react"

export function ${name}Override<T>(Component: ComponentType<T>): ComponentType<T> {
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
`
    fs.writeFileSync(filePath, source, "utf8")
    generatedOverrides.push(path.relative(root, filePath))
  }

  if (item.implementation === "gsap-code-component") {
    const name = toPascalCase(item.id)
    const fileName = `${name}Motion.tsx`
    const filePath = path.join(outGsapDir, fileName)

    const source = `import * as React from "react"
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

export default function ${name}Motion(props: Props) {
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

${name}Motion.defaultProps = {
  title: "${item.id}",
  background: "#0B0B0B",
  textColor: "#F5F5F0",
  start: "top 80%",
  end: "top 20%",
  scrub: 1
}

addPropertyControls(${name}Motion, {
  title: { type: ControlType.String, title: "Title", defaultValue: "${item.id}" },
  background: { type: ControlType.Color, title: "Background", defaultValue: "#0B0B0B" },
  textColor: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F0" },
  start: { type: ControlType.String, title: "Start", defaultValue: "top 80%" },
  end: { type: ControlType.String, title: "End", defaultValue: "top 20%" },
  scrub: { type: ControlType.Number, title: "Scrub", defaultValue: 1, min: 0, max: 5, step: 0.1 }
})
`
    fs.writeFileSync(filePath, source, "utf8")
    generatedGsap.push(path.relative(root, filePath))
  }
}

const report = `# Motion Build Report

## Source
- framer/generated/motion/motion-decisions.generated.json

## Generated override files
${generatedOverrides.length ? generatedOverrides.map((f) => `- ${f}`).join("\n") : "- None"}

## Generated GSAP component files
${generatedGsap.length ? generatedGsap.map((f) => `- ${f}`).join("\n") : "- None"}

## Notes
- Overrides are intended for lightweight interaction wrappers.
- GSAP components are intended for advanced scroll, cursor, or timeline behavior.
- Review each generated file before attaching in Framer.
`

fs.writeFileSync(reportPath, report, "utf8")

console.log("Generated override files:")
generatedOverrides.forEach((f) => console.log("-", f))
console.log("Generated GSAP files:")
generatedGsap.forEach((f) => console.log("-", f))
console.log("Report:")
console.log("-", path.relative(root, reportPath))
