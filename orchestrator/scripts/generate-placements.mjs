import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const sectionsDir = path.join(root, "framer", "generated", "sections")
const manifestPath = path.join(sectionsDir, "_manifest.json")
const placementsPath = path.join(root, "framer", "generated", "placements.json")

const loadJson = (filePath, fallback = null) => {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return fallback
  }
}

const toTitleCase = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()

const stripExtension = (file) => file.replace(/\.[^.]+$/, "")

const inferCategory = (name) => {
  const value = name.toLowerCase()
  if (value.includes("hero")) return "hero"
  if (value.includes("showcase") || value.includes("gallery") || value.includes("grid")) return "showcase"
  if (value.includes("feature")) return "feature"
  if (value.includes("testimonial")) return "testimonial"
  if (value.includes("footer")) return "footer"
  if (value.includes("nav") || value.includes("header")) return "header"
  return "section"
}

const inferDimensions = (category) => {
  if (category === "hero") return { width: 1440, height: 900 }
  if (category === "showcase") return { width: 1440, height: 1200 }
  if (category === "feature") return { width: 1440, height: 840 }
  if (category === "testimonial") return { width: 1440, height: 720 }
  if (category === "footer") return { width: 1440, height: 420 }
  if (category === "header") return { width: 1440, height: 120 }
  return { width: 1440, height: 800 }
}

const inferImportHint = (category) => {
  if (category === "hero") return "Import into Framer as top-of-page hero component"
  if (category === "showcase") return "Import into Framer as a visual content section"
  if (category === "feature") return "Import into Framer as a mid-page feature block"
  if (category === "testimonial") return "Import into Framer as social proof/testimonial block"
  if (category === "footer") return "Import into Framer near end of page"
  if (category === "header") return "Import into Framer near top navigation area"
  return "Import into Framer as a standard page section"
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

const sections = sectionFiles.map((file) => {
  const baseName = stripExtension(path.basename(file))
  const id = baseName
  const category = inferCategory(baseName)
  const inferredSize = inferDimensions(category)
  const stat = fs.existsSync(path.join(root, file))
    ? fs.statSync(path.join(root, file))
    : null
  const previous = existingMap.get(id)

  return {
    id,
    name: previous?.name || toTitleCase(baseName),
    moduleUrl: previous?.moduleUrl || "",
    width: previous?.width || inferredSize.width,
    height: previous?.height || inferredSize.height,
    sourceFile: file,
    category,
    importHint: inferImportHint(category),
    fileSize: stat?.size || null,
    updatedAt: stat?.mtime ? new Date(stat.mtime).toISOString() : null
  }
})

const output = { sections }

fs.mkdirSync(path.dirname(placementsPath), { recursive: true })
fs.writeFileSync(placementsPath, JSON.stringify(output, null, 2) + "\n", "utf8")

console.log(`Wrote ${path.relative(root, placementsPath)} with ${sections.length} sections`)
