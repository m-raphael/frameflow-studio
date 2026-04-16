import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const root = process.cwd()
const inputDir = path.join(root, "orchestrator", "input")
const requestFile = path.join(inputDir, "reference-request.json")

let running = false
let debounceTimer = null
let lastMtime = 0

const runPipeline = () => {
  if (running) {
    console.log("[watch] Pipeline already running, skipping")
    return
  }

  running = true
  console.log("[watch] Launching Frameflow pipeline...")

  const child = spawn("npm", ["run", "launch:frameflow"], {
    cwd: root,
    stdio: "inherit",
    shell: true
  })

  child.on("exit", (code) => {
    running = false
    if (code === 0) {
      console.log("[watch] Pipeline completed")
    } else {
      console.log(`[watch] Pipeline failed with code ${code}`)
    }
  })
}

const scheduleRun = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (!fs.existsSync(requestFile)) {
      console.log("[watch] reference-request.json not found yet")
      return
    }

    const stat = fs.statSync(requestFile)
    if (stat.mtimeMs === lastMtime) return
    lastMtime = stat.mtimeMs

    runPipeline()
  }, 500)
}

fs.mkdirSync(inputDir, { recursive: true })

if (fs.existsSync(requestFile)) {
  try {
    const stat = fs.statSync(requestFile)
    lastMtime = stat.mtimeMs
  } catch {}
}

console.log(`[watch] Watching ${requestFile}`)

fs.watch(inputDir, (eventType, filename) => {
  if (!filename) return
  if (filename !== "reference-request.json") return
  console.log(`[watch] Detected ${eventType} on ${filename}`)
  scheduleRun()
})
