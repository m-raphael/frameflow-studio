import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

const safeReadJson = (relativePath) => {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return null
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"))
}

const safeReadText = (relativePath) => {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return null
  return fs.readFileSync(absolutePath, "utf8")
}

const tokens = safeReadJson("framer/generated/tokens.generated.json")
const sectionManifest = safeReadJson("framer/generated/sections/_manifest.json")
const motionDecisions = safeReadJson("framer/generated/motion/motion-decisions.generated.json")
const overrideManifest = safeReadJson("framer/generated/motion/override-manifest.generated.json")
const gsapManifest = safeReadJson("framer/generated/motion/gsap-manifest.generated.json")
const motionReport = safeReadText("docs/motion-build-report.md")

const lines = []

lines.push("# Build Summary")
lines.push("")
lines.push(`- Generated at: ${new Date().toISOString()}`)
lines.push("")

lines.push("## Tokens")
if (tokens) {
  lines.push(`- Theme: ${tokens.themeName}`)
  lines.push(`- Display font: ${tokens.fonts.display}`)
  lines.push(`- Body font: ${tokens.fonts.body}`)
  lines.push(`- Primary color: ${tokens.colors.primary}`)
} else {
  lines.push("- Missing generated tokens")
}
lines.push("")

lines.push("## Sections")
if (sectionManifest?.files?.length) {
  sectionManifest.files.forEach((file) => lines.push(`- ${file}`))
} else {
  lines.push("- No generated section files found")
}
lines.push("")

lines.push("## Motion decisions")
if (motionDecisions?.interactions?.length) {
  motionDecisions.interactions.forEach((item) => {
    lines.push(`- ${item.id}: ${item.implementation} — ${item.reason}`)
  })
} else {
  lines.push("- No motion decisions found")
}
lines.push("")

lines.push("## Override files")
if (overrideManifest?.overrides?.length) {
  overrideManifest.overrides.forEach((item) => {
    lines.push(`- ${item.id}: ${item.suggestedFile}`)
  })
} else {
  lines.push("- No override suggestions found")
}
lines.push("")

lines.push("## GSAP files")
if (gsapManifest?.components?.length) {
  gsapManifest.components.forEach((item) => {
    lines.push(`- ${item.id}: ${item.suggestedPattern}`)
  })
} else {
  lines.push("- No GSAP suggestions found")
}
lines.push("")

lines.push("## Notes")
if (motionReport) {
  lines.push("- Motion build report exists")
} else {
  lines.push("- Motion build report missing")
}
lines.push("- Review generated files before importing into Framer")
lines.push("- Keep native Framer first, overrides second, GSAP third")
lines.push("")

const outPath = path.join(root, "docs", "build-summary.md")
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8")

console.log("Generated:")
console.log("-", path.relative(root, outPath))
