import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const args = process.argv.slice(2)

const getArg = (name, fallback = "") => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`))
  return hit ? hit.split("=")[1] : fallback
}

const mapFile = getArg("map", "site-map.json")
const mapPath = path.join(root, "orchestrator", "output", mapFile)
const tokensPath = path.join(root, "framer", "generated", "tokens.generated.ts")
const outDir = path.join(root, "framer", "generated", "sections")

if (!fs.existsSync(mapPath)) {
  console.error(`Missing site map: orchestrator/output/${mapFile}`)
  process.exit(1)
}

if (!fs.existsSync(tokensPath)) {
  console.error("Missing generated tokens. Run: npm run build:tokens")
  process.exit(1)
}

const siteMap = JSON.parse(fs.readFileSync(mapPath, "utf8"))
fs.mkdirSync(outDir, { recursive: true })

const toPascalCase = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

const files = []

for (const page of siteMap.pages || []) {
  for (const section of page.sections || []) {
    const componentName = toPascalCase(`${page.id}-${section.id}-section`)
    const fileName = `${componentName}.tsx`
    const filePath = path.join(outDir, fileName)

    const title = section.id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    const content = `import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { designTokens } from "../tokens.generated"

/**
 * Generated from ${mapFile}
 * Page: ${page.id}
 * Section: ${section.id}
 * Kind: ${section.kind}
 */
type Props = {
  title: string
  notes: string
  background: string
  textColor: string
}

export default function ${componentName}(props: Props) {
  return (
    <section
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: designTokens.spacing.md,
        padding: designTokens.spacing.xl,
        borderRadius: designTokens.radius.lg,
        background: props.background,
        color: props.textColor,
        border: \`1px solid \${designTokens.colors.border}\`
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.7
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: designTokens.colors.primary
          }}
        />
        ${section.kind}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: designTokens.spacing.sm }}>
        <h2
          style={{
            margin: 0,
            fontFamily: designTokens.fonts.display,
            fontSize: "clamp(32px, 6vw, 72px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em"
          }}
        >
          {props.title}
        </h2>

        <p
          style={{
            margin: 0,
            maxWidth: "42ch",
            fontFamily: designTokens.fonts.body,
            fontSize: 16,
            lineHeight: 1.6,
            opacity: 0.82
          }}
        >
          {props.notes}
        </p>
      </div>
    </section>
  )
}

${componentName}.defaultProps = {
  title: "${title}",
  notes: ${JSON.stringify(section.notes || "")},
  background: designTokens.colors.surface,
  textColor: designTokens.colors.text
}

addPropertyControls(${componentName}, {
  title: {
    type: ControlType.String,
    title: "Title",
    defaultValue: "${title}"
  },
  notes: {
    type: ControlType.String,
    title: "Notes",
    defaultValue: ${JSON.stringify(section.notes || "")}
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: designTokens.colors.surface
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: designTokens.colors.text
  }
})
`
    fs.writeFileSync(filePath, content, "utf8")
    files.push(path.relative(root, filePath))
  }
}

const manifestPath = path.join(outDir, "_manifest.json")
fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      source: `orchestrator/output/${mapFile}`,
      generatedAt: new Date().toISOString(),
      files
    },
    null,
    2
  ) + "\n",
  "utf8"
)

console.log("Generated section files:")
for (const file of files) console.log(`- ${file}`)
console.log(`- ${path.relative(root, manifestPath)}`)
