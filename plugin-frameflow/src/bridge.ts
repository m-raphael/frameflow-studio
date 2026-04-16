export type Provider = "claude-subscription" | "huggingface-free"
export type ReferenceStyle = "agency" | "editorial" | "product"
export type BuildMode = "analysis" | "scaffold" | "full"

export type ReferenceRequest = {
  createdAt: string
  referenceUrl: string
  referenceStyle: ReferenceStyle
  buildMode: BuildMode
  provider: Provider
  useCheapModel: boolean
  notes: string
}

export type ReceiverStatus = {
  ok?: boolean
  status: "idle" | "queued" | "running" | "success" | "failed"
  message: string
  lastRequestAt: string | null
  lastCompletedAt: string | null
  lastErrorAt: string | null
}

export type ReceiverArtifacts = {
  ok?: boolean
  status: string
  artifacts: {
    sections: string[]
    motion: { id: string; implementation: string }[]
    reports: string[]
  }
}

export type ReadResponse = {
  ok?: boolean
  file: string
  content: string
}

export async function copyRequestToClipboard(request: ReferenceRequest) {
  await navigator.clipboard.writeText(JSON.stringify(request, null, 2))
  return request
}

export async function sendRequestToLocalReceiver(request: ReferenceRequest) {
  const response = await fetch("http://127.0.0.1:4317/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  })

  if (!response.ok && response.status !== 202) {
    throw new Error(`Receiver error: ${response.status}`)
  }

  return response.json()
}

export async function fetchReceiverStatus(): Promise<ReceiverStatus> {
  const response = await fetch("http://127.0.0.1:4317/status")
  if (!response.ok) {
    throw new Error(`Status error: ${response.status}`)
  }
  return response.json()
}

export async function fetchReceiverArtifacts(): Promise<ReceiverArtifacts> {
  const response = await fetch("http://127.0.0.1:4317/artifacts")
  if (!response.ok) {
    throw new Error(`Artifacts error: ${response.status}`)
  }
  return response.json()
}

export async function readGeneratedFile(file: string): Promise<ReadResponse> {
  const url = new URL("http://127.0.0.1:4317/read")
  url.searchParams.set("file", file)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Read error: ${response.status}`)
  }
  return response.json()
}
