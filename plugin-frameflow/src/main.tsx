import { framer } from "framer-plugin"
import { useState } from "react"
import { createRoot } from "react-dom/client"

framer.showUI({
  position: "top right",
  width: 360,
  height: 540
})

function App() {
  const [referenceUrl, setReferenceUrl] = useState("")
  const [referenceStyle, setReferenceStyle] = useState("agency")
  const [buildMode, setBuildMode] = useState("analysis")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Idle")

  async function saveRequest() {
    setStatus("Preparing request…")

    const payload = {
      createdAt: new Date().toISOString(),
      referenceUrl,
      referenceStyle,
      buildMode,
      notes
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setStatus("Request copied. Paste into orchestrator/input/reference-request.json")
    } catch (error) {
      setStatus("Could not copy request payload")
    }
  }

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

      abel style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Reference URL</span>
        <input
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://example.com"
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        />
      </label>

      abel style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Style target</span>
        <select
          value={referenceStyle}
          onChange={(e) => setReferenceStyle(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="agency">Agency</option>
          <option value="editorial">Editorial</option>
          <option value="product">Product</option>
        </select>
      </label>

      abel style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Build mode</span>
        <select
          value={buildMode}
          onChange={(e) => setBuildMode(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)" }}
        >
          <option value="analysis">Analysis</option>
          <option value="scaffold">Scaffold</option>
          <option value="full">Full pipeline</option>
        </select>
      </label>

      abel style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cursor intent, animation notes, asset replacement instructions..."
          rows={6}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", resize: "vertical" }}
        />
      </label>

      <button
        onClick={saveRequest}
        style={{
          marginTop: 8,
          padding: "12px 14px",
          borderRadius: 12,
          border: "none",
          background: "#111111",
          color: "white",
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
