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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  :root {
    --bg:      #000000;
    --text:    #ffffff;
    --muted:   #a6a6a6;
    --blue:    #0099ff;
    --blue-ring: rgba(0,153,255,0.15);
    --frosted: rgba(255,255,255,0.1);
    --frosted-hover: rgba(255,255,255,0.14);
    --red:     #ff4444;
    --green:   #34d399;
    --font: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  }
  body {
    background: var(--bg); color: var(--text); font-family: var(--font);
    font-feature-settings: "cv01","cv05","cv09","cv11","ss03","ss07";
    letter-spacing: -0.15px;
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; padding: 64px 24px 96px;
  }
  .wordmark {
    font-size: 13px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 48px;
  }
  .headline { font-size: 28px; font-weight: 600; letter-spacing: -0.6px; line-height: 1.1; margin-bottom: 8px; text-align: center }
  .sub { font-size: 14px; color: var(--muted); margin-bottom: 40px; text-align: center; line-height: 1.5 }

  /* ── Card ── */
  .card {
    background: #000;
    box-shadow: var(--blue-ring) 0 0 0 1px, rgba(255,255,255,0.05) 0 0.5px 0 0.5px;
    border-radius: 12px; padding: 24px;
    width: 100%; max-width: 600px; margin-bottom: 16px;
  }

  /* ── Input row ── */
  .row { display: flex; gap: 8px }
  input[type=url] {
    flex: 1;
    background: var(--frosted);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 40px;
    padding: 11px 18px;
    font-size: 14px; font-family: var(--font);
    font-feature-settings: "cv01","cv11";
    color: var(--text); outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input[type=url]:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 1px var(--blue);
  }
  input[type=url]::placeholder { color: rgba(255,255,255,0.35) }

  /* ── Buttons ── */
  .btn-primary {
    background: #fff; color: #000; border: none; border-radius: 40px;
    padding: 11px 22px; font-size: 14px; font-weight: 600; font-family: var(--font);
    cursor: pointer; white-space: nowrap;
    transition: opacity 0.15s;
  }
  .btn-primary:hover { opacity: 0.88 }
  .btn-primary:disabled { opacity: 0.35; cursor: not-allowed }

  /* ── Status ── */
  .status-row { display: flex; align-items: center; gap: 10px; margin-top: 16px; min-height: 22px }
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0 }
  .dot.idle    { background: rgba(255,255,255,0.2) }
  .dot.running { background: var(--blue); animation: pulse 1.1s infinite }
  .dot.success { background: var(--green) }
  .dot.failed  { background: var(--red) }
  .dot.queued  { background: #facc15; animation: pulse 1.1s infinite }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.25 } }
  .status-msg { font-size: 13px; color: var(--muted) }

  /* ── Section labels ── */
  .label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 12px;
  }

  /* ── File rows ── */
  .file-list { display: flex; flex-direction: column; gap: 5px }
  .file-item {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--frosted); border-radius: 8px;
    padding: 8px 12px; font-size: 12px;
    font-family: "SF Mono", "Fira Mono", ui-monospace, monospace;
    letter-spacing: 0;
  }
  .file-item .name { color: var(--text) }
  .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0 }

  /* ── Badges ── */
  .badge {
    font-size: 10px; font-weight: 600; font-family: var(--font);
    letter-spacing: 0.06em; padding: 2px 8px; border-radius: 40px;
    text-transform: uppercase;
  }
  .badge.ready   { background: rgba(52,211,153,0.15);  color: var(--green) }
  .badge.gen     { background: rgba(0,153,255,0.12);   color: var(--blue) }
  .badge.missing { background: rgba(255,68,68,0.12);   color: var(--red) }
  .empty { font-size: 13px; color: rgba(255,255,255,0.25); padding: 4px 0 }

  #artifacts { display: none }
  #logPanel  { display: none }

  /* ── Log ── */
  .log-box {
    background: #000; border-radius: 8px;
    padding: 12px 14px;
    font-family: "SF Mono", "Fira Mono", ui-monospace, monospace;
    font-size: 11.5px; line-height: 1.65; color: var(--muted);
    max-height: 300px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-all;
  }
  .log-box .ok   { color: var(--green) }
  .log-box .err  { color: var(--red) }
  .log-box .head { color: rgba(255,255,255,0.4) }
</style>
</head>
<body>
<div class="wordmark">Frameflow</div>
<h1 class="headline">Generate Framer components</h1>
<p class="sub">Paste any reference URL — the pipeline will scan, extract, and build.</p>

<div class="card">
  <div class="row">
    <input id="urlInput" type="url" placeholder="https://example.com" autocomplete="off" spellcheck="false">
    <button class="btn-primary" id="analyzeBtn" onclick="submitUrl()">Analyze</button>
  </div>
  <div class="status-row">
    <div id="dot" class="dot idle"></div>
    <span id="statusMsg" class="status-msg">Ready</span>
  </div>
</div>

<div id="logPanel" class="card">
  <div class="label">Pipeline log</div>
  <div id="logBox" class="log-box"></div>
</div>

<div id="artifacts" class="card">
  <div id="sectionsBlock"></div>
  <div class="divider"></div>
  <div id="motionBlock"></div>
  <div class="divider"></div>
  <div id="placementsBlock"></div>
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
  document.getElementById('logPanel').style.display = 'block'
  pollTimer = setInterval(async () => {
    try {
      const [statusRes, logRes] = await Promise.all([fetch('/status'), fetch('/log')])
      const statusData = await statusRes.json()
      const logData = await logRes.json()
      setStatus(statusData.status, statusData.message)
      renderLog(logData.lines || [])
      if (statusData.status === 'success' || statusData.status === 'failed') {
        clearInterval(pollTimer)
        document.getElementById('analyzeBtn').disabled = false
        if (statusData.status === 'success') loadArtifacts()
      }
    } catch {}
  }, 800)
}

function renderLog(lines) {
  const box = document.getElementById('logBox')
  box.innerHTML = lines.map(line => {
    if (line.startsWith('✓')) return \`<span class="ok">\${esc(line)}</span>\`
    if (line.startsWith('✗') || line.includes('⚠')) return \`<span class="err">\${esc(line)}</span>\`
    if (line.startsWith('═')) return \`<span class="head">\${esc(line)}</span>\`
    return esc(line)
  }).join('\n')
  box.scrollTop = box.scrollHeight
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
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

const PIPELINE_STEPS = [
  { label: "Analyzing reference URL",   script: "orchestrator/scripts/build-analyze-reference.mjs" },
  { label: "Normalizing design tokens", script: "orchestrator/scripts/build-tokens.mjs" },
  { label: "Generating sections",       script: "orchestrator/scripts/build-site-map.mjs" },
  { label: "Classifying motion",        script: "orchestrator/scripts/build-motion.mjs" },
  { label: "Building motion files",     script: "orchestrator/scripts/build-motion-files.mjs" },
  { label: "Generating placements",     script: "orchestrator/scripts/generate-placements.mjs" },
  { label: "Running QA",                script: "orchestrator/scripts/build-qa.mjs" },
]

let childProcess = null
let logLines = []
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

const appendLog = (line) => {
  logLines.push(line)
  if (logLines.length > 500) logLines = logLines.slice(-500)
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

const runStep = (step) =>
  new Promise((resolve, reject) => {
    appendLog(`\n▶ ${step.label}`)
    const proc = spawn("node", [path.join(root, step.script)], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"]
    })
    childProcess = proc

    proc.stdout.on("data", (d) => {
      for (const line of d.toString().split("\n")) {
        if (line.trim()) appendLog("  " + line)
      }
    })
    proc.stderr.on("data", (d) => {
      for (const line of d.toString().split("\n")) {
        if (line.trim()) appendLog("  ⚠ " + line)
      }
    })
    proc.on("exit", (code) => {
      childProcess = null
      if (code === 0) {
        appendLog(`✓ ${step.label}`)
        resolve()
      } else {
        appendLog(`✗ ${step.label} (exit ${code})`)
        reject(new Error(`${step.label} failed (exit ${code})`))
      }
    })
  })

const launchPipeline = () => {
  if (childProcess) {
    state.status = "running"
    state.message = "Pipeline already running"
    return
  }

  state.status = "running"
  state.message = "Analyzing reference URL…"
  state.lastRequestAt = new Date().toISOString()
  logLines = []
  appendLog("═══ Frameflow pipeline started ═══")

  const runAll = async () => {
    for (const step of PIPELINE_STEPS) {
      state.message = step.label + "…"
      await runStep(step)
    }
  }

  runAll()
    .then(() => {
      collectArtifacts()
      state.status = "success"
      state.message = "Done — components ready"
      state.lastCompletedAt = new Date().toISOString()
      appendLog("\n═══ Pipeline complete ═══")
    })
    .catch((err) => {
      state.status = "failed"
      state.message = err.message
      state.lastErrorAt = new Date().toISOString()
      appendLog("\n═══ Pipeline failed ═══")
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

  if (req.method === "GET" && url.pathname === "/log") {
    sendJson(res, 200, { ok: true, lines: logLines }, origin)
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
