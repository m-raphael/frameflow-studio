import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const motionMapPath = path.join(root, "orchestrator", "output", "motion-map.json")
const outDir = path.join(root, "framer", "generated", "motion")

if (!fs.existsSync(motionMapPath)) {
  console.error("Missing motion map: orchestrator/output/motion-map.json")
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const motionMap = JSON.parse(fs.readFileSync(motionMapPath, "utf8"))

const chooseImplementation = (interaction) => {
  if (interaction.kind === "scroll" && (interaction.scrub || interaction.pin)) {
    return {
      implementation: "gsap-code-component",
      reason: "Scroll-linked interactions with scrub or pin are better handled with GSAP timelines and ScrollTrigger.",
      reducedMotionFallback: "static visible state",
      mobileFallback: "fade"
    }
  }

  if (interaction.kind === "cursor") {
    return {
      implementation: "gsap-code-component",
      reason: "Premium cursor-linked interactions need fine-grained pointer interpolation.",
      reducedMotionFallback: "no cursor motion",
      mobileFallback: "disabled"
    }
  }

  if (interaction.kind === "hover") {
    return {
      implementation: "override",
      reason: "Simple hover behaviors fit lightweight Framer overrides well.",
      reducedMotionFallback: "static hover styling",
      mobileFallback: "no hover effect"
    }
  }

  return {
    implementation: "native-framer",
    reason: "This interaction can likely be represented using Framer-first motion features.",
    reducedMotionFallback: "static visible state",
    mobileFallback: "same behavior with simplified easing"
  }
}

const decisions = {
  source: "orchestrator/output/motion-map.json",
  generatedAt: new Date().toISOString(),
  interactions: (motionMap.interactions || []).map((interaction) => ({
    id: interaction.id,
    kind: interaction.kind,
    target: interaction.target,
    trigger: interaction.trigger,
    ...chooseImplementation(interaction)
  }))
}

const decisionsPath = path.join(outDir, "motion-decisions.generated.json")
fs.writeFileSync(decisionsPath, JSON.stringify(decisions, null, 2) + "\n", "utf8")

const overrideManifest = {
  generatedAt: new Date().toISOString(),
  overrides: decisions.interactions
    .filter((item) => item.implementation === "override")
    .map((item) => ({
      id: item.id,
      suggestedFile:
        item.kind === "hover" ? "framer/overrides/withMagneticHover.tsx" : "framer/overrides/custom.tsx",
      reason: item.reason
    }))
}

const overrideManifestPath = path.join(outDir, "override-manifest.generated.json")
fs.writeFileSync(overrideManifestPath, JSON.stringify(overrideManifest, null, 2) + "\n", "utf8")

const gsapManifest = {
  generatedAt: new Date().toISOString(),
  components: decisions.interactions
    .filter((item) => item.implementation === "gsap-code-component")
    .map((item) => ({
      id: item.id,
      suggestedPattern:
        item.kind === "scroll"
          ? "ScrollTrigger timeline component"
          : item.kind === "cursor"
            ? "pointer-reactive glow/parallax component"
            : "custom gsap component",
      reason: item.reason
    }))
}

const gsapManifestPath = path.join(outDir, "gsap-manifest.generated.json")
fs.writeFileSync(gsapManifestPath, JSON.stringify(gsapManifest, null, 2) + "\n", "utf8")

console.log("Generated motion files:")
console.log("-", path.relative(root, decisionsPath))
console.log("-", path.relative(root, overrideManifestPath))
console.log("-", path.relative(root, gsapManifestPath))
