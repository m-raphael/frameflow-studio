import { framer } from "framer-plugin"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { copyRequestToClipboard, type ReferenceRequest } from "./bridge"

framer.showUI({
  position: "top right",
  width: 380,
  height: 580
})

function App() {
  const [referenceUrl, setReferenceUrl] = useState("")
  const [referenceStyle, setReferenceStyle] = useState<ReferenceRequest["referenceStyle"]>("agency")
  const [buildMode, setBuildMode] = useState<ReferenceRequest["buildMode"]>("full")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Idle")

  async function exportRequest() {
    setStatus("Exporting request…")
    const request: ReferenceRequest = {
      createdAt: new Date().toISOString(),
      referenceUrl,
      referenceStyle,
      buildMode,
      notes
    }

    try {
      await copyRequestToClipboard(request)
      setStatus("Copied. Save as orchestrator/input/reference-request.json and run the pipeline.")
    } catch {
      setStatus("Could not copy request.")
    }
  }

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>Frameflow</h1>
      <p style={{ margin: 0, fontSize: 13, opacity: 0.72 }}>
        Capture a reference in Framer, then hand it to the local pipeline.
      </p>

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
          <option value="full">Full</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={7}
          placeholder="Micro-interactions, hover intent, image swaps, asset replacement rules..."
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", resize: "vertical" }}
        />
      </label>

      <button
        onClick={exportRequest}
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "none",
          background: "#111",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Copy request payload
      </button>

      <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>
    </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<App />)
