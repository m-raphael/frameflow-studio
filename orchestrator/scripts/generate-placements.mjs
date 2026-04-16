import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sectionsDir = path.join(root, "framer", "generated", "sections")
const manifestPath = path.join(sectionsDir, "_manifest.json")
const placementsPath = path.join(root, "framer", "generated", "placements.json")

const toTitleCase = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()

const stripExtension = (file) => file.replace(/\.[^.]+$/, "")

const loadJson = (filePath, fallback = null) => {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return fallback
  }
}

const existingPlacements = loadJson(placementsPath, { sections: [] })
const existingMap = new Map(
  (existingPlacements.sections || []).map((item) => [item.id, item])
)

let sectionFiles = []

const manifest = loadJson(manifestPath, null)

if (manifest?.files && Array.isArray(manifest.files)) {
  sectionFiles = manifest.files
} else if (fs.existsSync(sectionsDir)) {
  sectionFiles = fs
    .readdirSync(sectionsDir)
    .filter((file) => /\.(tsx|ts|jsx|js)$/i.test(file))
    .filter((file) => !file.startsWith("_"))
    .map((file) => `framer/generated/sections/${file}`)
}

const inferredSections = sectionFiles.map((file) => {
  const baseName = stripExtension(path.basename(file))
  const id = baseName
  const previous = existingMap.get(id)

  return {
    id,
    name: previous?.name || toTitleCase(baseName),
    moduleUrl: previous?.moduleUrl || "",
    width: previous?.width || 1440,
    height: previous?.height || 900
  }
})

const output = {
  sections: inferredSections
}

fs.mkdirSync(path.dirname(placementsPath), { recursive: true })
fs.writeFileSync(placementsPath, JSON.stringify(output, null, 2) + "\n", "utf8")

console.log(`Wrote ${path.relative(root, placementsPath)} with ${inferredSections.length} sections`)
