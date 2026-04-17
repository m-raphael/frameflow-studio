import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

// ─── helpers ────────────────────────────────────────────────────────────────

const safeReadJson = (relativePath) => {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return null
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"))
  } catch {
    return null
  }
}

const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const check = (label, passing, note = "") => ({
  label,
  passing,
  note
})

// ─── collect data ────────────────────────────────────────────────────────────

const request        = safeReadJson("orchestrator/input/reference-request.json")
const activeMap      = safeReadJson("orchestrator/output/active-site-map.json")
const tokens         = safeReadJson("framer/generated/tokens.generated.json")
const sectionManifest = safeReadJson("framer/generated/sections/_manifest.json")
const motionDecisions = safeReadJson("framer/generated/motion/motion-decisions.generated.json")
const overrideManifest = safeReadJson("framer/generated/motion/override-manifest.generated.json")
const gsapManifest   = safeReadJson("framer/generated/motion/gsap-manifest.generated.json")
const placements     = safeReadJson("framer/generated/placements.json")

const referenceUrl  = request?.referenceUrl  || activeMap?.referenceUrl  || "Unknown"
const buildTarget   = request?.referenceStyle || activeMap?.referenceStyle || "Unknown"
const buildMode     = request?.buildMode     || activeMap?.buildMode     || "Unknown"
const date          = new Date().toISOString()

// ─── required file checks ────────────────────────────────────────────────────

const requiredFiles = [
  ["orchestrator/output/site-map.json",       "Site map"],
  ["orchestrator/output/design-tokens.json",  "Design tokens"],
  ["orchestrator/output/motion-map.json",     "Motion map"],
  ["framer/generated/tokens.generated.json",  "Generated tokens (JSON)"],
  ["framer/generated/tokens.generated.ts",    "Generated tokens (TS)"],
  ["framer/generated/sections/_manifest.json","Section manifest"],
  ["framer/generated/motion/motion-decisions.generated.json", "Motion decisions"],
  ["framer/generated/motion/override-manifest.generated.json","Override manifest"],
  ["framer/generated/motion/gsap-manifest.generated.json",    "GSAP manifest"],
  ["framer/generated/placements.json",         "Placements manifest"],
]

const fileChecks = requiredFiles.map(([file, label]) =>
  check(label, exists(file), file)
)

// ─── token checks ────────────────────────────────────────────────────────────

const tokenChecks = tokens ? [
  check("Theme name present",    Boolean(tokens.themeName)),
  check("Display font set",      Boolean(tokens.fonts?.display)),
  check("Body font set",         Boolean(tokens.fonts?.body)),
  check("Background color set",  Boolean(tokens.colors?.background)),
  check("Primary color set",     Boolean(tokens.colors?.primary)),
  check("Spacing scale complete",
    ["xs","sm","md","lg","xl","xxl"].every((k) => tokens.spacing?.[k] !== undefined)),
  check("Radius scale complete",
    ["sm","md","lg"].every((k) => tokens.radius?.[k] !== undefined)),
  check("Motion timing complete",
    ["durationFast","durationBase","durationSlow"].every((k) => tokens.motion?.[k] !== undefined)),
] : [check("Tokens file readable", false, "framer/generated/tokens.generated.json missing or invalid")]

// ─── section checks ──────────────────────────────────────────────────────────

const sectionFiles = sectionManifest?.files || []
const sectionCount = sectionFiles.length

const sectionChecks = [
  check("At least one section generated", sectionCount > 0),
  check("All section TSX files exist on disk",
    sectionFiles.every((f) => exists(f)),
    sectionFiles.filter((f) => !exists(f)).join(", ") || ""),
]

// ─── motion checks ───────────────────────────────────────────────────────────

const interactions     = motionDecisions?.interactions || []
const interactionCount = interactions.length
const gsapComponents   = interactions.filter((i) => i.implementation === "gsap-code-component")
const overrides        = interactions.filter((i) => i.implementation === "override")
const native           = interactions.filter((i) => i.implementation === "native-framer")

const gsapFiles        = gsapManifest?.components?.map((c) =>
  `framer/generated/gsap/${c.id.replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}Motion.tsx`
) || []

const overrideFiles    = overrideManifest?.overrides?.map((o) =>
  `framer/generated/overrides/${o.id.replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ").filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")}Override.tsx`
) || []

const motionChecks = [
  check("At least one motion interaction defined",  interactionCount > 0),
  check("All GSAP component files exist on disk",
    gsapFiles.every((f) => exists(f)),
    gsapFiles.filter((f) => !exists(f)).join(", ") || ""),
  check("All override files exist on disk",
    overrideFiles.every((f) => exists(f)),
    overrideFiles.filter((f) => !exists(f)).join(", ") || ""),
  check("Reduced-motion fallbacks defined for all GSAP components",
    gsapComponents.every((i) => Boolean(i.reducedMotionFallback)),
    gsapComponents.filter((i) => !i.reducedMotionFallback).map((i) => i.id).join(", ") || ""),
  check("Mobile fallbacks defined for all GSAP components",
    gsapComponents.every((i) => Boolean(i.mobileFallback)),
    gsapComponents.filter((i) => !i.mobileFallback).map((i) => i.id).join(", ") || ""),
]

// ─── placement checks ────────────────────────────────────────────────────────

const placementItems = placements?.sections || []
const readyCnt   = placementItems.filter((p) => p.readiness === "ready").length
const totalCnt   = placementItems.length

const placementChecks = [
  check("Placements manifest has entries", totalCnt > 0),
  check("At least one placement is ready to insert", readyCnt > 0,
    `${readyCnt} of ${totalCnt} ready`),
  check("All placements have a source file",
    placementItems.every((p) => Boolean(p.sourceFile)),
    placementItems.filter((p) => !p.sourceFile).map((p) => p.id).join(", ") || ""),
]

// ─── score and verdict ───────────────────────────────────────────────────────

const allChecks = [
  ...fileChecks,
  ...tokenChecks,
  ...sectionChecks,
  ...motionChecks,
  ...placementChecks,
]

const failing = allChecks.filter((c) => !c.passing)
const critical = failing.filter((c) =>
  fileChecks.includes(c) || tokenChecks.includes(c)
)
const medium = failing.filter((c) =>
  motionChecks.includes(c) && !critical.includes(c)
)
const minor = failing.filter((c) =>
  !critical.includes(c) && !medium.includes(c)
)

const verdict =
  critical.length > 0 ? "Rework needed"
  : medium.length > 0  ? "Pass with fixes"
  : "Pass"

// ─── render report ───────────────────────────────────────────────────────────

const fmtCheck = (c) =>
  `- [${c.passing ? "x" : " "}] ${c.label}${c.note ? ` — \`${c.note}\`` : ""}`

const fmtSection = (title, checks) =>
  [`### ${title}`, ...checks.map(fmtCheck)].join("\n")

const report = `# QA Report

## Project
- Reference: ${referenceUrl}
- Build target: ${buildTarget}
- Build mode: ${buildMode}
- Date: ${date}
- Generator: orchestrator/scripts/build-qa.mjs

## Summary
- Total checks: ${allChecks.length}
- Passing: ${allChecks.length - failing.length}
- Failing: ${failing.length} (${critical.length} critical · ${medium.length} medium · ${minor.length} minor)
- Verdict: **${verdict}**

## Breakpoints to verify manually
- [ ] Desktop 1440px — layout, spacing, typography scale
- [ ] Tablet 768px — layout reflow, motion still appropriate
- [ ] Mobile 390px — touch targets, reduced-motion fallback active, no overflow

## Parity checklist (manual)
- [ ] Layout parity with reference
- [ ] Typography parity — fonts, weights, sizes, letter-spacing
- [ ] Color parity — background, text, accent, border
- [ ] Motion parity — entry, hover, scroll, cursor, transition
- [ ] Hover / cursor behavior parity
- [ ] Scroll behavior parity
- [ ] Asset replacement complete
- [ ] Reduced-motion fallback verified in OS accessibility mode
- [ ] Accessibility quick check — focus order, contrast, alt text

## Automated checks

${fmtSection("Required files", fileChecks)}

${fmtSection("Design tokens", tokenChecks)}

${fmtSection(`Generated sections (${sectionCount} total)`, sectionChecks)}

${fmtSection(`Motion (${interactionCount} interactions · ${gsapComponents.length} GSAP · ${overrides.length} override · ${native.length} native)`, motionChecks)}

${fmtSection(`Placements (${readyCnt} of ${totalCnt} ready)`, placementChecks)}

## Findings

### Critical
${critical.length ? critical.map((c) => `- ${c.label}${c.note ? `: \`${c.note}\`` : ""}`).join("\n") : "- None"}

### Medium
${medium.length ? medium.map((c) => `- ${c.label}${c.note ? `: \`${c.note}\`` : ""}`).join("\n") : "- None"}

### Minor
${minor.length ? minor.map((c) => `- ${c.label}${c.note ? `: \`${c.note}\`` : ""}`).join("\n") : "- None"}

## Fix list
${failing.length
  ? failing.map((c, i) => `${i + 1}. ${c.label}${c.note ? ` (\`${c.note}\`)` : ""}`).join("\n")
  : "1. No automated fixes required — proceed to manual parity checks"}

## Final decision
- [${verdict === "Pass" ? "x" : " "}] Pass
- [${verdict === "Pass with fixes" ? "x" : " "}] Pass with fixes
- [${verdict === "Rework needed" ? "x" : " "}] Rework needed
`

const outPath = path.join(root, "orchestrator", "output", "qa-report.md")
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, report, "utf8")

console.log(`Verdict: ${verdict}`)
console.log(`Checks: ${allChecks.length - failing.length}/${allChecks.length} passing`)
if (failing.length) {
  console.log(`Failing:`)
  failing.forEach((c) => console.log(`  - ${c.label}${c.note ? ` (${c.note})` : ""}`))
}
console.log(`Wrote ${path.relative(root, outPath)}`)
