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

  if (!response.ok) {
    throw new Error(`Receiver error: ${response.status}`)
  }

  return response.json()
}
