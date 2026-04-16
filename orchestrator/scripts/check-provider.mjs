import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const configPath = path.join(root, "orchestrator", "config", "providers.json")
const activeRequestPath = path.join(root, "orchestrator", "input", "reference-request.json")

if (!fs.existsSync(configPath)) {
  console.error("Missing orchestrator/config/providers.json")
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"))
const request = fs.existsSync(activeRequestPath)
  ? JSON.parse(fs.readFileSync(activeRequestPath, "utf8"))
  : {}

const selected = request.provider || config.defaultProvider
const provider = config.providers[selected]

if (!provider) {
  console.error(`Unknown provider: ${selected}`)
  process.exit(1)
}

console.log(`Provider: ${selected}`)
console.log(`Type: ${provider.type}`)
console.log(`Mode: ${provider.mode}`)

if (selected === "claude-subscription") {
  if (process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is set.")
    console.error("Claude Code will prefer the API key over your subscription and may incur API charges.")
    console.error("Unset it before using claude-subscription.")
    process.exit(1)
  }
  console.log("OK: ANTHROPIC_API_KEY is not set.")
  console.log("Reminder: run /status in Claude Code to confirm subscription auth.")
}

if (provider.requiresApiKey) {
  const envKey = provider.envKey
  if (!process.env[envKey]) {
    console.error(`Missing required environment variable: ${envKey}`)
    process.exit(1)
  }
  console.log(`OK: ${envKey} is set.`)
}
