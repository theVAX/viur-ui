#!/usr/bin/env node

import { readdirSync, existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")

const BONES_DIR = resolve(repoRoot, "src/forms/bones/widgets")
const STORIES_DIR = resolve(repoRoot, "stories/bones")

// Files matching *Bone.vue that are not standalone testable widgets.
// Extending this list is a deliberate team decision — document the reason in the PR.
const WHITELIST = new Set([
  "bone.vue", // Abstract base wrapper, never rendered directly
  "filterBone.vue", // Filter-specific bone, separate test strategy
  "jsonBone.vue", // TODO: story not yet written (tracked separately)
])

function toPascalCase(fileName) {
  const base = fileName.replace(/\.vue$/, "")
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function main() {
  const boneFiles = readdirSync(BONES_DIR)
    .filter((f) => f.endsWith("Bone.vue"))
    .filter((f) => !WHITELIST.has(f))

  const problems = []

  for (const boneFile of boneFiles) {
    const pascal = toPascalCase(boneFile)
    const storyPath = resolve(STORIES_DIR, `${pascal}.story.vue`)

    if (!existsSync(storyPath)) {
      problems.push(`  - ${boneFile}: missing story (expected: stories/bones/${pascal}.story.vue)`)
    }
  }

  if (problems.length > 0) {
    console.error("Bone coverage check failed:")
    console.error(problems.join("\n"))
    console.error(
      "\nAdd the missing artefacts or extend the whitelist in scripts/check-bone-coverage.js with justification."
    )
    process.exit(1)
  }

  console.log(`Bone coverage check passed (${boneFiles.length} bones verified).`)
}

main()
