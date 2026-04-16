import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const inputPath = path.join(root, "orchestrator", "input", "reference-request.json")
const outputPath = path.join(root, "orchestrator", "output", "active-site-map.json")

if (!fs.existsSync(inputPath)) {
  console.error("Missing orchestrator/input/reference-request.json")
  process.exit(1)
}

const request = JSON.parse(fs.readFileSync(inputPath, "utf8"))
const style = String(request.referenceStyle || "agency").toLowerCase()

const mapByStyle = {
  agency: "site-map-agency.json",
  editorial: "site-map-editorial.json",
  product: "site-map-product.json"
}

const chosen = mapByStyle[style] || mapByStyle.agency
const payload = {
  ...request,
  chosenSiteMap: chosen,
  pipelineCommand: `npm run pipeline:${style in mapByStyle ? style : "agency"}`
}

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8")
console.log(`Selected ${chosen}`)
console.log(`Wrote ${path.relative(root, outputPath)}`)
