import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

if (!fs.existsSync(requestPath)) {
  console.error("Missing orchestrator/input/reference-request.json")
  process.exit(1)
}

const request = JSON.parse(fs.readFileSync(requestPath, "utf8"))

const provider = request.provider || "claude-subscription"

const routing = {
  provider,
  tasks: {
    analyzeReference: provider === "claude-subscription" ? "claude-code" : "huggingface",
    classifySections: provider === "claude-subscription" ? "claude-code" : "huggingface",
    decideMotion: "claude-code",
    generatePrompts: "claude-code",
    lowCostTagging: provider === "huggingface-free" ? "huggingface" : "optional"
  }
}

const outPath = path.join(root, "orchestrator", "output", "provider-routing.json")
fs.writeFileSync(outPath, JSON.stringify(routing, null, 2) + "\n", "utf8")
console.log(`Wrote ${path.relative(root, outPath)}`)
