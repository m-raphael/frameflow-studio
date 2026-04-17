import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

const root = process.cwd()
const port = 4317

const HTML_UI = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Frameflow</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  :root {
    --bg: #0B0B0B; --surface: #111; --surface2: #171717;
    --border: rgba(255,255,255,0.08); --text: #F5F5F0; --muted: #888;
    --accent: #D6FF3F; --red: #FF4D4D; --radius: 10px;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 48px 24px 80px }
  h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.03em; margin-bottom: 8px }
  .sub { font-size: 13px; color: var(--muted); margin-bottom: 40px }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; width: 100%; max-width: 640px; margin-bottom: 20px }
  .row { display: flex; gap: 10px }
  input[type=url] {
    flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 11px 14px; font-size: 14px; color: var(--text); outline: none;
    transition: border-color 0.2s
  }
  input[type=url]:focus { border-color: rgba(255,255,255,0.25) }
  input[type=url]::placeholder { color: var(--muted) }
  button {
    background: var(--accent); color: #0B0B0B; border: none; border-radius: 8px;
    padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
    white-space: nowrap; transition: opacity 0.15s
  }
  button:hover { opacity: 0.88 }
  button:disabled { opacity: 0.4; cursor: not-allowed }
  .status-row { display: flex; align-items: center; gap: 10px; margin-top: 18px; min-height: 24px }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0 }
  .dot.idle    { background: var(--muted) }
  .dot.running { background: var(--accent); animation: pulse 1s infinite }
  .dot.success { background: #4ADE80 }
  .dot.failed  { background: var(--red) }
  .dot.queued  { background: #FACC15; animation: pulse 1s infinite }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
  .status-msg { font-size: 13px; color: var(--muted) }
  .section-title { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px }
  .file-list { display: flex; flex-direction: column; gap: 6px }
  .file-item { display: flex; align-items: center; justify-content: space-between; background: var(--surface2); border-radius: 6px; padding: 9px 12px; font-size: 12px; font-family: monospace }
  .file-item .name { color: var(--text) }
  .badge { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 4px; text-transform: uppercase }
  .badge.ready   { background: rgba(74,222,128,0.15); color: #4ADE80 }
  .badge.gen     { background: rgba(214,255,63,0.12); color: var(--accent) }
  .badge.missing { background: rgba(255,77,77,0.12); color: var(--red) }
  .empty { font-size: 13px; color: var(--muted); padding: 8px 0 }
  #artifacts { display: none }
</style>
</head>
<body>
<h1>Frameflow</h1>
<p class="sub">Paste a reference URL and hit Analyze to generate Framer components</p>

<div class="card">
  <div class="row">
    <input id="urlInput" type="url" placeholder="https://example.com" autocomplete="off" spellcheck="false">
    <button id="analyzeBtn" onclick="submitUrl()">Analyze</button>
  </div>
  <div class="status-row">
    <div id="dot" class="dot idle"></div>
    <span id="statusMsg" class="status-msg">Ready</span>
  </div>
</div>

<div id="artifacts" class="card">
  <div id="sectionsBlock"></div>
  <div id="motionBlock" style="margin-top:20px"></div>
  <div id="placementsBlock" style="margin-top:20px"></div>
</div>

<script>
let pollTimer = null

async function submitUrl() {
  const url = document.getElementById('urlInput').value.trim()
  if (!url) { flash('Paste a URL first'); return }
  try { new URL(url) } catch { flash('Not a valid URL'); return }

  document.getElementById('analyzeBtn').disabled = true
  setStatus('running', 'Sending request…')

  try {
    const res = await fetch('/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceUrl: url })
    })
    const data = await res.json()
    setStatus(data.status || 'running', data.message || 'Pipeline started')
    startPolling()
  } catch (e) {
    setStatus('failed', 'Could not reach receiver')
    document.getElementById('analyzeBtn').disabled = false
  }
}

function startPolling() {
  clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/status')
      const data = await res.json()
      setStatus(data.status, data.message)
      if (data.status === 'success' || data.status === 'failed') {
        clearInterval(pollTimer)
        document.getElementById('analyzeBtn').disabled = false
        if (data.status === 'success') loadArtifacts()
      }
    } catch {}
  }, 1200)
}

async function loadArtifacts() {
  try {
    const res = await fetch('/artifacts')
    const data = await res.json()
    renderArtifacts(data.artifacts)
    document.getElementById('artifacts').style.display = 'block'
  } catch {}
}

function renderArtifacts(a) {
  // Sections
  const sec = a.sections || []
  document.getElementById('sectionsBlock').innerHTML = \`
    <div class="section-title">Generated sections (\${sec.length})</div>
    <div class="file-list">\${sec.length
      ? sec.map(f => \`<div class="file-item"><span class="name">\${f}</span><span class="badge gen">TSX</span></div>\`).join('')
      : '<p class="empty">None</p>'}
    </div>\`

  // Motion
  const mot = a.motion || []
  document.getElementById('motionBlock').innerHTML = \`
    <div class="section-title">Motion interactions (\${mot.length})</div>
    <div class="file-list">\${mot.length
      ? mot.map(m => \`<div class="file-item"><span class="name">\${m.id}</span><span class="badge gen">\${m.implementation}</span></div>\`).join('')
      : '<p class="empty">None</p>'}
    </div>\`

  // Placements
  const pl = a.placements || []
  const badgeClass = r => r === 'ready' ? 'ready' : r === 'generated-not-imported' ? 'gen' : 'missing'
  const badgeLabel = r => r === 'ready' ? 'Ready' : r === 'generated-not-imported' ? 'Not imported' : 'Missing'
  document.getElementById('placementsBlock').innerHTML = \`
    <div class="section-title">Placements (\${pl.length})</div>
    <div class="file-list">\${pl.length
      ? pl.map(p => \`<div class="file-item"><span class="name">\${p.id}</span><span class="badge \${badgeClass(p.readiness)}">\${badgeLabel(p.readiness)}</span></div>\`).join('')
      : '<p class="empty">None</p>'}
    </div>\`
}

function setStatus(status, msg) {
  const dot = document.getElementById('dot')
  dot.className = 'dot ' + (status || 'idle')
  document.getElementById('statusMsg').textContent = msg || status
}

function flash(msg) {
  setStatus('failed', msg)
  setTimeout(() => setStatus('idle', 'Ready'), 2500)
}

document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitUrl()
})

// Check current status on load
fetch('/status').then(r => r.json()).then(d => {
  setStatus(d.status, d.message)
  if (d.status === 'running' || d.status === 'queued') startPolling()
  if (d.status === 'success') loadArtifacts()
}).catch(() => {})
</script>
</body>
</html>
`
const requestPath = path.join(root, "orchestrator", "input", "reference-request.json")

let childProcess = null
let artifacts = {
  sections: [],
  motion: [],
  reports: [],
  placements: []
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

const normalizeNameToFileStem = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const findGeneratedSource = (placement) => {
  const candidates = [
    `framer/code-components/${placement.name}.tsx`,
    `framer/code-components/${placement.id}.tsx`,
    `framer/code-components/${normalizeNameToFileStem(placement.name)}.tsx`,
    `framer/generated/sections/${placement.id}.tsx`,
    `framer/generated/sections/${normalizeNameToFileStem(placement.name)}.tsx`
  ]

  const found = candidates.find((file) => fs.existsSync(path.join(root, file)))
  return found || null
}

const getPlacementReadiness = (placement) => {
  const generatedFile = findGeneratedSource(placement)
  const moduleUrl = String(placement.moduleUrl || "").trim()
  const hasPlaceholderUrl =
    !moduleUrl ||
    moduleUrl.includes("XXXXX") ||
    moduleUrl.includes("YYYYY") ||
    moduleUrl.includes("REPLACE") ||
    !moduleUrl.startsWith("https://framer.com/m/")

  if (generatedFile && !hasPlaceholderUrl) {
    return {
      ...placement,
      generatedFile,
      readiness: "ready",
      readinessLabel: "Ready to insert"
    }
  }

  if (generatedFile && hasPlaceholderUrl) {
    return {
      ...placement,
      generatedFile,
      readiness: "generated-not-imported",
      readinessLabel: "Generated but not imported"
    }
  }

  if (!generatedFile && !hasPlaceholderUrl) {
    return {
      ...placement,
      generatedFile: null,
      readiness: "missing-generated-file",
      readinessLabel: "Missing generated file"
    }
  }

  return {
    ...placement,
    generatedFile: null,
    readiness: "missing-module-url",
    readinessLabel: "Missing module URL"
  }
}

const collectArtifacts = () => {
  const sectionManifest = safeReadJson("framer/generated/sections/_manifest.json")
  const motionDecisions = safeReadJson("framer/generated/motion/motion-decisions.generated.json")
  const placementsFile = safeReadJson("framer/generated/placements.json")
  const placements = Array.isArray(placementsFile?.sections) ? placementsFile.sections : []

  artifacts = {
    sections: sectionManifest?.files || [],
    motion: motionDecisions?.interactions?.map((item) => ({
      id: item.id,
      implementation: item.implementation
    })) || [],
    reports: [
      "docs/build-summary.md",
      "docs/motion-build-report.md"
    ].filter((file) => fs.existsSync(path.join(root, file))),
    placements: placements.map(getPlacementReadiness)
  }
}

const isAllowedReadPath = (requestedFile) => {
  const normalized = path.normalize(requestedFile).replace(/^(\.\.(\/|\\|$))+/, "")
  const allowedPrefixes = ["docs/", "framer/generated/", "framer/code-components/", "orchestrator/output/"]
  return {
    normalized,
    allowed: allowedPrefixes.some((prefix) => normalized.startsWith(prefix))
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

collectArtifacts()

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "*"
  const url = new URL(req.url, `http://127.0.0.1:${port}`)

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    })
    res.end()
    return
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(HTML_UI)
    return
  }

  if (req.method === "GET" && url.pathname === "/status") {
    sendJson(res, 200, { ok: true, ...state }, origin)
    return
  }

  if (req.method === "GET" && url.pathname === "/artifacts") {
    collectArtifacts()
    sendJson(res, 200, { ok: true, status: state.status, artifacts }, origin)
    return
  }

  if (req.method === "GET" && url.pathname === "/placements") {
    collectArtifacts()
    sendJson(res, 200, { ok: true, placements: artifacts.placements || [] }, origin)
    return
  }

  if (req.method === "GET" && url.pathname === "/read") {
    const file = url.searchParams.get("file") || ""
    const { normalized, allowed } = isAllowedReadPath(file)

    if (!allowed) {
      sendJson(res, 403, { ok: false, message: "File path not allowed" }, origin)
      return
    }

    const absolutePath = path.join(root, normalized)
    if (!fs.existsSync(absolutePath)) {
      sendJson(res, 404, { ok: false, message: "File not found" }, origin)
      return
    }

    const content = fs.readFileSync(absolutePath, "utf8")
    sendJson(res, 200, { ok: true, file: normalized, content }, origin)
    return
  }

  if (req.method === "POST" && url.pathname === "/placements/update") {
    let body = ""
    req.on("data", (chunk) => { body += chunk })
    req.on("end", () => {
      try {
        const { id, moduleUrl } = JSON.parse(body)

        if (!id || typeof id !== "string") {
          sendJson(res, 400, { ok: false, message: "Missing or invalid placement id" }, origin)
          return
        }

        if (typeof moduleUrl !== "string") {
          sendJson(res, 400, { ok: false, message: "Missing moduleUrl" }, origin)
          return
        }

        const placementsPath = path.join(root, "framer", "generated", "placements.json")
        const existing = safeReadJson("framer/generated/placements.json") || { sections: [] }
        const sections = Array.isArray(existing.sections) ? existing.sections : []

        const idx = sections.findIndex((s) => s.id === id)
        if (idx === -1) {
          sendJson(res, 404, { ok: false, message: `Placement not found: ${id}` }, origin)
          return
        }

        sections[idx] = { ...sections[idx], moduleUrl: moduleUrl.trim() }
        fs.writeFileSync(placementsPath, JSON.stringify({ sections }, null, 2) + "\n", "utf8")

        collectArtifacts()
        const updated = artifacts.placements.find((p) => p.id === id) || sections[idx]
        sendJson(res, 200, { ok: true, placement: updated }, origin)
      } catch {
        sendJson(res, 400, { ok: false, message: "Invalid JSON payload" }, origin)
      }
    })
    return
  }

  if (req.method === "POST" && url.pathname === "/request") {
    let body = ""
    req.on("data", (chunk) => { body += chunk })
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
