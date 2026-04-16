import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const activePath = path.join(root, "orchestrator", "output", "active-site-map.json")

if (!fs.existsSync(activePath)) {
  console.error("Missing active-site-map.json. Run pick-map first.")
  process.exit(1)
}

const active = JSON.parse(fs.readFileSync(activePath, "utf8"))
const style = String(active.referenceStyle || "agency").toLowerCase()
const script = `pipeline:${["agency", "editorial", "product"].includes(style) ? style : "agency"}`

const result = spawnSync("npm", ["run", script], { cwd: root, stdio: "inherit", shell: true })
if (result.status !== 0) process.exit(result.status || 1)
