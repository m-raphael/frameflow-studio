import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const tokensPath = path.join(root, "orchestrator", "output", "design-tokens.json")
const outJsonPath = path.join(root, "framer", "generated", "tokens.generated.json")
const outTsPath = path.join(root, "framer", "generated", "tokens.generated.ts")

const raw = fs.readFileSync(tokensPath, "utf8")
const tokens = JSON.parse(raw)

const normalized = {
  themeName: tokens.themeName ?? "frameflow-default",
  fonts: {
    display: tokens.fonts?.display ?? "Inter",
    body: tokens.fonts?.body ?? "Inter"
  },
  colors: {
    background: tokens.colors?.background ?? "#0B0B0B",
    surface: tokens.colors?.surface ?? "#111111",
    surface2: tokens.colors?.surface2 ?? "#171717",
    text: tokens.colors?.text ?? "#F5F5F0",
    muted: tokens.colors?.muted ?? "#B8B8B0",
    primary: tokens.colors?.primary ?? "#D6FF3F",
    border: tokens.colors?.border ?? "rgba(255,255,255,0.08)"
  },
  radius: {
    sm: tokens.radius?.sm ?? 8,
    md: tokens.radius?.md ?? 14,
    lg: tokens.radius?.lg ?? 24
  },
  spacing: {
    xs: tokens.spacing?.xs ?? 4,
    sm: tokens.spacing?.sm ?? 8,
    md: tokens.spacing?.md ?? 16,
    lg: tokens.spacing?.lg ?? 24,
    xl: tokens.spacing?.xl ?? 40,
    xxl: tokens.spacing?.xxl ?? 80
  },
  motion: {
    easePrimary: tokens.motion?.easePrimary ?? "power3.out",
    durationFast: tokens.motion?.durationFast ?? 0.35,
    durationBase: tokens.motion?.durationBase ?? 0.7,
    durationSlow: tokens.motion?.durationSlow ?? 1.2
  },
  siteStyle: {
    textAlign: tokens.siteStyle?.textAlign ?? "left",
    heroStyle: tokens.siteStyle?.heroStyle ?? "text-only",
    galleryStyle: tokens.siteStyle?.galleryStyle ?? "list",
    animationTempo: tokens.siteStyle?.animationTempo ?? "cinematic",
    displayFontSize: tokens.siteStyle?.displayFontSize ?? "clamp(52px, 9vw, 130px)",
    bodyFontSize: tokens.siteStyle?.bodyFontSize ?? "16px",
    letterSpacing: tokens.siteStyle?.letterSpacing ?? "-0.04em",
    borderRadius: tokens.siteStyle?.borderRadius ?? "0px",
    hasMarquee: tokens.siteStyle?.hasMarquee ?? false,
    hasMagneticCursor: tokens.siteStyle?.hasMagneticCursor ?? true
  }
}

fs.writeFileSync(outJsonPath, JSON.stringify(normalized, null, 2) + "\n", "utf8")

const tsFile = `export const designTokens = ${JSON.stringify(normalized, null, 2)} as const;\n`
fs.writeFileSync(outTsPath, tsFile, "utf8")

console.log("Generated:")
console.log("-", path.relative(root, outJsonPath))
console.log("-", path.relative(root, outTsPath))
