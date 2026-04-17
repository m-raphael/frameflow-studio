import { framer } from "framer-plugin"
import { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  copyRequestToClipboard,
  fetchPlacements,
  fetchReceiverArtifacts,
  fetchReceiverStatus,
  insertPlacement,
  readGeneratedFile,
  sendRequestToLocalReceiver,
  updatePlacementModuleUrl,
  type PlacementItem,
  type ReceiverArtifacts,
  type ReceiverStatus,
  type ReferenceRequest,
  type Provider
} from "./bridge"

framer.showUI({
  position: "top right",
  width: 480,
  height: 980,
  resizable: true,
  minWidth: 420,
  minHeight: 720
})

function App() {
  const [referenceUrl, setReferenceUrl] = useState("")
  const [referenceStyle, setReferenceStyle] = useState<ReferenceRequest["referenceStyle"]>("agency")
  const [buildMode, setBuildMode] = useState<ReferenceRequest["buildMode"]>("full")
  const [provider, setProvider] = useState<Provider>("claude-subscription")
  const [useCheapModel, setUseCheapModel] = useState(false)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Idle")
  const [receiverStatus, setReceiverStatus] = useState<ReceiverStatus | null>(null)
  const [receiverArtifacts, setReceiverArtifacts] = useState<ReceiverArtifacts | null>(null)
  const [placements, setPlacements] = useState<PlacementItem[]>([])
  const [previewTitle, setPreviewTitle] = useState("")
  const [previewContent, setPreviewContent] = useState("")
  const [readinessFilter, setReadinessFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [urlDraft, setUrlDraft] = useState<Record<string, string>>({})

  const providerHint = useMemo(() => {
    if (provider === "claude-subscription") {
      return "Use Claude Code with your Pro/Max login. Keep ANTHROPIC_API_KEY unset in the shell."
    }
    return "Use Hugging Face for cheaper fallback and lightweight preprocessing."
  }, [provider])

  const readinessTone = (value?: string) => {
    if (value === "ready") return { bg: "#e8f7ea", text: "#1f7a1f" }
    if (value === "generated-not-imported") return { bg: "#fff4db", text: "#8a6500" }
    if (value === "missing-generated-file") return { bg: "#fdeaea", text: "#a12c2c" }
    return { bg: "#f1f1f1", text: "#666666" }
  }

  const formatBytes = (value?: number | null) => {
    if (!value && value !== 0) return "Unknown size"
    if (value < 1024) return `${value} B`
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
    return `${(value / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (value?: string | null) => {
    if (!value) return "Unknown update time"
    try {
      return new Date(value).toLocaleString()
    } catch {
      return value
    }
  }

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const nextStatus = await fetchReceiverStatus()
        if (!cancelled) setReceiverStatus(nextStatus)

        if (nextStatus.status === "success") {
          const nextArtifacts = await fetchReceiverArtifacts()
          if (!cancelled) setReceiverArtifacts(nextArtifacts)

          const nextPlacements = await fetchPlacements()
          if (!cancelled) setPlacements(nextPlacements.placements || [])
        }
      } catch {
        if (!cancelled) {
          setReceiverStatus({
            status: "failed",
            message: "Local receiver unreachable",
            lastRequestAt: null,
            lastCompletedAt: null,
            lastErrorAt: null
          })
        }
      }
    }

    poll()
    const timer = setInterval(poll, 3000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const requestPayload: ReferenceRequest = {
    createdAt: new Date().toISOString(),
    referenceUrl,
    referenceStyle,
    buildMode,
    provider,
    useCheapModel,
    notes
  }

  async function handleCopy() {
    setStatus("Copying request…")
    try {
      await copyRequestToClipboard(requestPayload)
      setStatus("Copied. Manual fallback available.")
    } catch {
      setStatus("Could not copy request.")
    }
  }

  async function handleSend() {
    setStatus("Sending to local receiver…")
    try {
      const result = await sendRequestToLocalReceiver(requestPayload)
      setReceiverStatus(result)
      setStatus("Request sent.")
    } catch {
      setStatus("Could not reach local receiver at 127.0.0.1:4317")
    }
  }

  async function handleRead(file: string) {
    setStatus(`Reading ${file}…`)
    try {
      const result = await readGeneratedFile(file)
      setPreviewTitle(result.file)
      setPreviewContent(result.content)
      setStatus("Preview loaded.")
    } catch {
      setStatus(`Could not read ${file}`)
    }
  }

  async function handleInsert(item: PlacementItem) {
    setStatus(`Inserting ${item.name}…`)
    try {
      await insertPlacement(item)
      setStatus(`${item.name} inserted on canvas.`)
    } catch {
      setStatus(`Could not insert ${item.name}. Check module URL in Framer.`)
    }
  }

  async function handleSaveUrl(item: PlacementItem) {
    const moduleUrl = (urlDraft[item.id] ?? item.moduleUrl ?? "").trim()
    setStatus(`Saving URL for ${item.name}…`)
    try {
      const result = await updatePlacementModuleUrl(item.id, moduleUrl)
      setPlacements((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, ...result.placement } : p))
      )
      setUrlDraft((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      setStatus(`Module URL saved for ${item.name}.`)
    } catch {
      setStatus(`Could not save URL for ${item.name}. Is the receiver running?`)
    }
  }

  const statusTone =
    receiverStatus?.status === "success"
      ? "#1f7a1f"
      : receiverStatus?.status === "failed"
        ? "#a12c2c"
        : receiverStatus?.status === "running" || receiverStatus?.status === "queued"
          ? "#8a6500"
          : "#666666"

  const categoryOptions = useMemo(() => {
    const values = Array.from(new Set(placements.map((item) => item.category).filter(Boolean)))
    return values.sort()
  }, [placements])

  const filteredPlacements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return placements.filter((item) => {
      const matchesReadiness =
        readinessFilter === "all" || (item.readiness || "unknown") === readinessFilter

      const matchesCategory =
        categoryFilter === "all" || (item.category || "uncategorized") === categoryFilter

      const haystack = [
        item.id,
        item.name,
        item.category,
        item.sourceFile,
        item.importHint,
        item.readinessLabel
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !query || haystack.includes(query)

      return matchesReadiness && matchesCategory && matchesSearch
    })
  }, [placements, readinessFilter, categoryFilter, searchQuery])

  const groupedPlacements = useMemo(() => {
    const order = [
      "ready",
      "generated-not-imported",
      "missing-module-url",
      "missing-generated-file"
    ]

    return order
      .map((groupKey) => ({
        key: groupKey,
        title: groupKey.replace(/-/g, " "),
        items: filteredPlacements.filter((item) => (item.readiness || "unknown") === groupKey)
      }))
      .filter((group) => group.items.length > 0)
  }, [filteredPlacements])

  return (
    <main
      style={{
        fontFamily: "Inter, sans-serif",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <h1 style={{ margin: 0, fontSize: 20, lineHeight: 1.1 }}>Frameflow</h1>

      <p style={{ margin: 0, fontSize: 13, opacity: 0.72 }}>
        Send provider-aware requests from Framer to the local Frameflow pipeline.
      </p>

      <div
        style={{
          padding: 10,
          borderRadius: 10,
          background: "rgba(0,0,0,0.04)",
          border: `1px solid ${statusTone}33`
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: statusTone }}>
          Receiver: {receiverStatus?.status || "unknown"}
        </div>
        <div style={{ fontSize: 12, opacity: 0.78, marginTop: 4 }}>
          {receiverStatus?.message || "No status available yet"}
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Reference URL</span>
        <input
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://waaark.com/"
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Reference style</span>
        <select
          value={referenceStyle}
          onChange={(e) => setReferenceStyle(e.target.value as ReferenceRequest["referenceStyle"])}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="agency">Agency</option>
          <option value="editorial">Editorial</option>
          <option value="product">Product</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Build mode</span>
        <select
          value={buildMode}
          onChange={(e) => setBuildMode(e.target.value as ReferenceRequest["buildMode"])}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="analysis">Analysis</option>
          <option value="scaffold">Scaffold</option>
          <option value="full">Full pipeline</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Provider</span>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="claude-subscription">Claude subscription</option>
          <option value="huggingface-free">Hugging Face free</option>
        </select>
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 10,
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.08)"
        }}
      >
        <input
          type="checkbox"
          checked={useCheapModel}
          onChange={(e) => setUseCheapModel(e.target.checked)}
        />
        <span style={{ fontSize: 13 }}>Prefer cheap model when possible</span>
      </label>

      <div
        style={{
          fontSize: 12,
          lineHeight: 1.45,
          opacity: 0.75,
          padding: 10,
          borderRadius: 10,
          background: "rgba(0,0,0,0.04)"
        }}
      >
        {providerHint}
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Micro-interactions, scroll behavior, cursor intent, asset replacement rules..."
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.12)",
            resize: "vertical"
          }}
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleSend}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: "#111111",
            color: "#ffffff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Send to local pipeline
        </button>

        <button
          onClick={handleCopy}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#ffffff",
            color: "#111111",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Copy
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>

      {receiverArtifacts?.artifacts && (
        <div
          style={{
            marginTop: 4,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Generated artifacts</div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reports</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {receiverArtifacts.artifacts.reports.length ? (
                receiverArtifacts.artifacts.reports.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleRead(item)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <div style={{ fontSize: 12, opacity: 0.78 }}>No reports found</div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Sections</div>
            <div style={{ fontSize: 12, opacity: 0.78, maxHeight: 100, overflow: "auto" }}>
              {receiverArtifacts.artifacts.sections.length ? (
                receiverArtifacts.artifacts.sections.map((item) => <div key={item}>{item}</div>)
              ) : (
                "No sections found"
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motion</div>
            <div style={{ fontSize: 12, opacity: 0.78, maxHeight: 100, overflow: "auto" }}>
              {receiverArtifacts.artifacts.motion.length ? (
                receiverArtifacts.artifacts.motion.map((item) => (
                  <div key={item.id}>
                    {item.id} — {item.implementation}
                  </div>
                ))
              ) : (
                "No motion artifacts found"
              )}
            </div>
          </div>
        </div>
      )}

      {placements.length > 0 && (
        <div
          style={{
            marginTop: 4,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Canvas insertion</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Readiness</span>
              <select
                value={readinessFilter}
                onChange={(e) => setReadinessFilter(e.target.value)}
                style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <option value="all">All</option>
                <option value="ready">Ready</option>
                <option value="generated-not-imported">Generated not imported</option>
                <option value="missing-module-url">Missing module URL</option>
                <option value="missing-generated-file">Missing generated file</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <option value="all">All</option>
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, id, hint, source file..."
              style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
            />
          </label>

          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Showing {filteredPlacements.length} of {placements.length} placements
          </div>

          {groupedPlacements.length ? (
            groupedPlacements.map((group) => (
              <div
                key={group.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingTop: 4
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>
                  {group.title} ({group.items.length})
                </div>

                {group.items.map((item) => {
                  const tone = readinessTone(item.readiness)
                  const canInsert = item.readiness === "ready"

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 11, opacity: 0.65 }}>{item.id}</div>
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: tone.text,
                            background: tone.bg,
                            padding: "6px 8px",
                            borderRadius: 999
                          }}
                        >
                          {item.readinessLabel || "Unknown"}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, opacity: 0.85 }}>
                        Category: {item.category || "Unknown"}
                      </div>

                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        Source file: {item.sourceFile || item.generatedFile || "not found"}
                      </div>

                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        Import hint: {item.importHint || "No hint available"}
                      </div>

                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        Size: {item.width || 0} × {item.height || 0} · {formatBytes(item.fileSize)}
                      </div>

                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        Updated: {formatDate(item.updatedAt)}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11, opacity: 0.7 }}>Module URL</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              value={urlDraft[item.id] ?? item.moduleUrl ?? ""}
                              onChange={(e) =>
                                setUrlDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="https://framer.com/m/…"
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.12)",
                                fontSize: 11,
                                minWidth: 0
                              }}
                            />
                            <button
                              onClick={() => handleSaveUrl(item)}
                              disabled={
                                (urlDraft[item.id] ?? item.moduleUrl ?? "").trim() ===
                                (item.moduleUrl ?? "").trim()
                              }
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "none",
                                background:
                                  (urlDraft[item.id] ?? item.moduleUrl ?? "").trim() !==
                                  (item.moduleUrl ?? "").trim()
                                    ? "#111"
                                    : "#d8d8d8",
                                color:
                                  (urlDraft[item.id] ?? item.moduleUrl ?? "").trim() !==
                                  (item.moduleUrl ?? "").trim()
                                    ? "#fff"
                                    : "#666",
                                cursor:
                                  (urlDraft[item.id] ?? item.moduleUrl ?? "").trim() !==
                                  (item.moduleUrl ?? "").trim()
                                    ? "pointer"
                                    : "not-allowed",
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: "nowrap"
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </label>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            disabled={!canInsert}
                            onClick={() => handleInsert(item)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "none",
                              background: canInsert ? "#111" : "#d8d8d8",
                              color: canInsert ? "#fff" : "#666",
                              cursor: canInsert ? "pointer" : "not-allowed",
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            Insert
                          </button>

                          {(item.sourceFile || item.generatedFile) && (
                            <button
                              onClick={() => handleRead(item.sourceFile || item.generatedFile || "")}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "#fff",
                                color: "#111",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              Preview source
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                fontSize: 12,
                opacity: 0.75
              }}
            >
              No placements match the current filters.
            </div>
          )}
        </div>
      )}

      {previewContent && (
        <div
          style={{
            marginTop: 4,
            padding: 12,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>{previewTitle}</div>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.45,
              maxHeight: 240,
              overflow: "auto",
              background: "rgba(0,0,0,0.03)",
              padding: 10,
              borderRadius: 10
            }}
          >
            {previewContent}
          </pre>
        </div>
      )}
    </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<App />)
