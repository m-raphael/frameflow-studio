import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const root = process.cwd()
const port = 4317
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

let running = false

const sendJson = (res, status, payload, origin = "*") => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  })
  res.end(JSON.stringify(payload))
}

const launchPipeline = () => {
  if (running) return
  running = true

  const child = spawn("npm", ["run", "launch:frameflow"], {
    cwd: root,
    stdio: "inherit",
    shell: true
  })

  child.on("exit", () => {
    running = false
  })
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*"

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    })
    res.end()
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

        launchPipeline()

        sendJson(res, 200, {
          ok: true,
          message: "Request received and pipeline launched"
        }, origin)
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          message: "Invalid JSON payload"
        }, origin)
      }
    })

    return
  }

  sendJson(res, 404, {
    ok: false,
    message: "Not found"
  }, origin)
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Frameflow local receiver running at http://127.0.0.1:${port}`)
})
