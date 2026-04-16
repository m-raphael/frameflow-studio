import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const root = process.cwd()
const port = 4317
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

let childProcess = null
let artifacts = {
  sections: [],
  motion: [],
  reports: []
}

let state = {
  status: "idle",
  message: "Receiver ready",
  lastRequestAt: null,
  lastCompletedAt: null,
  lastErrorAt: null
}

const sendJson = (res, statusCode, payload, origin = "*") => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  })
  res.end(JSON.stringify(payload))
}

const safeReadJson = (relativePath) => {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return null
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"))
  } catch {
    return null
  }
}

const collectArtifacts = () => {
  const sectionManifest = safeReadJson("framer/generated/sections/_manifest.json")
  const motionDecisions = safeReadJson("framer/generated/motion/motion-decisions.generated.json")

  artifacts = {
    sections: sectionManifest?.files || [],
    motion: motionDecisions?.interactions?.map((item) => ({
      id: item.id,
      implementation: item.implementation
    })) || [],
    reports: [
      "docs/build-summary.md",
      "docs/motion-build-report.md"
    ].filter((file) => fs.existsSync(path.join(root, file)))
  }
}

const launchPipeline = () => {
  if (childProcess) {
    state.status = "running"
    state.message = "Pipeline already running"
    return
  }

  state.status = "running"
  state.message = "Pipeline running"
  state.lastRequestAt = new Date().toISOString()

  childProcess = spawn("npm", ["run", "launch:frameflow"], {
    cwd: root,
    stdio: "inherit",
    shell: true
  })

  childProcess.on("exit", (code) => {
    if (code === 0) {
      collectArtifacts()
      state.status = "success"
      state.message = "Pipeline completed successfully"
      state.lastCompletedAt = new Date().toISOString()
    } else {
      state.status = "failed"
      state.message = `Pipeline failed with code ${code}`
      state.lastErrorAt = new Date().toISOString()
    }
    childProcess = null
  })
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*"

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    })
    res.end()
    return
  }

  if (req.method === "GET" && req.url === "/status") {
    sendJson(res, 200, {
      ok: true,
      ...state
    }, origin)
    return
  }

  if (req.method === "GET" && req.url === "/artifacts") {
    sendJson(res, 200, {
      ok: true,
      status: state.status,
      artifacts
    }, origin)
    return
  }

  if (req.method === "POST" && req.url === "/request") {
    let body = ""

    req.on("data", (chunk) => {
      body += chunk
    })

    req.on("end", () => {
      try {
        const payload = JSON.parse(body)
        fs.mkdirSync(path.dirname(requestPath), { recursive: true })
        fs.writeFileSync(requestPath, JSON.stringify(payload, null, 2) + "\n", "utf8")

        if (childProcess) {
          state.status = "queued"
          state.message = "Request received, waiting for current pipeline run to finish"
          state.lastRequestAt = new Date().toISOString()
          sendJson(res, 202, { ok: true, ...state }, origin)
          return
        }

        launchPipeline()
        sendJson(res, 200, { ok: true, ...state }, origin)
      } catch {
        state.status = "failed"
        state.message = "Invalid JSON payload"
        state.lastErrorAt = new Date().toISOString()
        sendJson(res, 400, { ok: false, ...state }, origin)
      }
    })

    return
  }

  sendJson(res, 404, { ok: false, message: "Not found" }, origin)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Frameflow local receiver running at http://127.0.0.1:${port}`)
})
