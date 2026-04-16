import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

if (!fs.existsSync(requestPath)) {
  console.error("Missing orchestrator/input/reference-request.json")
  process.exit(1)
}

const request = JSON.parse(fs.readFileSync(requestPath, "utf8"))

const buildMode = String(request.buildMode || "full").toLowerCase()
const wantsCheap = Boolean(request.useCheapModel)
const needsDeepReasoning = buildMode === "full" || buildMode === "analysis"

request.provider = wantsCheap && !needsDeepReasoning ? "huggingface-free" : "claude-subscription"

fs.writeFileSync(requestPath, JSON.stringify(request, null, 2) + "\n", "utf8")
console.log(`Selected provider: ${request.provider}`)
