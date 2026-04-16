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
  type PlacementItem,
  type ReceiverArtifacts,
  type ReceiverStatus,
  type ReferenceRequest,
  type Provider
} from "./bridge"

framer.showUI({
  position: "top right",
  width: 440,
  height: 920
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

  const statusTone =
    receiverStatus?.status === "success"
      ? "#1f7a1f"
      : receiverStatus?.status === "failed"
        ? "#a12c2c"
        : receiverStatus?.status === "running" || receiverStatus?.status === "queued"
          ? "#8a6500"
          : "#666666"

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
            gap: 8
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Canvas insertion</div>

          {placements.map((item) => {
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

                <div style={{ fontSize: 11, opacity: 0.75 }}>
                  Generated file: {item.generatedFile || "not found"}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
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

                  {item.generatedFile && (
                    <button
                      onClick={() => handleRead(item.generatedFile!)}
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
            )
          })}
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
