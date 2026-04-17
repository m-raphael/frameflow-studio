import { framer } from "framer-plugin"

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

export type PlacementReadiness =
  | "ready"
  | "missing-module-url"
  | "generated-not-imported"
  | "missing-generated-file"

export type PlacementItem = {
  id: string
  name: string
  moduleUrl: string
  width?: number
  height?: number
  generatedFile?: string | null
  readiness?: PlacementReadiness
  readinessLabel?: string
}

export type ReceiverArtifacts = {
  ok?: boolean
  status: string
  artifacts: {
    sections: string[]
    motion: { id: string; implementation: string }[]
    reports: string[]
    placements?: PlacementItem[]
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  })

  if (!response.ok && response.status !== 202) {
    throw new Error(`Receiver error: ${response.status}`)
  }

  return response.json()
}

export async function fetchReceiverStatus(): Promise<ReceiverStatus> {
  const response = await fetch("http://127.0.0.1:4317/status")
  if (!response.ok) throw new Error(`Status error: ${response.status}`)
  return response.json()
}

export async function fetchReceiverArtifacts(): Promise<ReceiverArtifacts> {
  const response = await fetch("http://127.0.0.1:4317/artifacts")
  if (!response.ok) throw new Error(`Artifacts error: ${response.status}`)
  return response.json()
}

export async function fetchPlacements(): Promise<{ ok?: boolean; placements: PlacementItem[] }> {
  const response = await fetch("http://127.0.0.1:4317/placements")
  if (!response.ok) throw new Error(`Placements error: ${response.status}`)
  return response.json()
}

export async function readGeneratedFile(file: string): Promise<ReadResponse> {
  const url = new URL("http://127.0.0.1:4317/read")
  url.searchParams.set("file", file)
  const response = await fetch(url.toString())
  if (!response.ok) throw new Error(`Read error: ${response.status}`)
  return response.json()
}

export async function updatePlacementModuleUrl(
  id: string,
  moduleUrl: string
): Promise<{ ok?: boolean; placement: PlacementItem }> {
  const response = await fetch("http://127.0.0.1:4317/placements/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, moduleUrl })
  })
  if (!response.ok) throw new Error(`Update error: ${response.status}`)
  return response.json()
}

export async function insertPlacement(item: PlacementItem) {
  if (!framer.isAllowedTo("addComponentInstance")) {
    throw new Error("addComponentInstance permission not granted. Check framer.json permissions.")
  }
  return framer.addComponentInstance({
    url: item.moduleUrl,
    attributes: {
      width: item.width ?? 1200,
      height: item.height ?? 800
    }
  })
}
