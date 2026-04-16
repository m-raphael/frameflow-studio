import { spawnSync } from "node:child_process"

const run = (label, command, args = []) => {
  console.log(`\n==> ${label}`)
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true
  })

  if (result.status !== 0) {
    console.error(`\nStep failed: ${label}`)
    process.exit(result.status || 1)
  }
}

run("Selecting provider", "npm", ["run", "provider:select"])
run("Checking provider safety", "npm", ["run", "provider:check"])
run("Routing provider tasks", "npm", ["run", "provider:route"])
run("Selecting site map", "npm", ["run", "pick:map"])
run("Running full Frameflow pipeline", "npm", ["run", "run:frameflow"])

console.log("\nFrameflow launch complete.")
