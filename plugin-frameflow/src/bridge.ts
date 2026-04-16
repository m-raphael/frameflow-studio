export type ReferenceRequest = {
  createdAt: string
  referenceUrl: string
  referenceStyle: "agency" | "editorial" | "product"
  buildMode: "analysis" | "scaffold" | "full"
  notes: string
}

export async function copyRequestToClipboard(request: ReferenceRequest) {
  await navigator.clipboard.writeText(JSON.stringify(request, null, 2))
  return request
}
