import { framer } from "framer-plugin"
import { useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  copyRequestToClipboard,
  sendRequestToLocalReceiver,
  type ReferenceRequest,
  type Provider
} from "./bridge"

framer.showUI({
  position: "top right",
  width: 400,
  height: 740
})

function App() {
  const [referenceUrl, setReferenceUrl] = useState("")
  const [referenceStyle, setReferenceStyle] = useState<ReferenceRequest["referenceStyle"]>("agency")
  const [buildMode, setBuildMode] = useState<ReferenceRequest["buildMode"]>("full")
  const [provider, setProvider] = useState<Provider>("claude-subscription")
  const [useCheapModel, setUseCheapModel] = useState(false)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("Idle")

  const providerHint = useMemo(() => {
    if (provider === "claude-subscription") {
      return "Use Claude Code with your Pro/Max login. Keep ANTHROPIC_API_KEY unset in the shell."
    }
    return "Use Hugging Face for cheaper fallback and lightweight preprocessing."
  }, [provider])

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
      setStatus("Copied. You can still save manually if needed.")
    } catch {
      setStatus("Could not copy request.")
    }
  }

  async function handleSend() {
    setStatus("Sending to local receiver…")
    try {
      await sendRequestToLocalReceiver(requestPayload)
      setStatus("Sent. Local pipeline should be running.")
    } catch {
      setStatus("Could not reach local receiver at 127.0.0.1:4317")
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

      <p style={{ margin: 0, fontSize: 13, opacity: 0.72 }}>
        Send provider-aware requests from Framer to the local Frameflow pipeline.
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
          rows={6}
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
    </main>
  )
}

const root = createRoot(document.getElementById("root")!)
root.render(<App />)
