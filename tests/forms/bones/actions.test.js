import { describe, it, expect, afterEach, vi } from "vitest"
import { resolveActions, isActionDisabled, setRequiredActionsForType } from "../../../src/forms/bones/actions/index.js"

// The dialog/handler components don't matter for resolution (and are SFCs that
// this test setup doesn't compile).
vi.mock("../../../src/forms/bones/actions/Translation.vue", () => ({ default: {} }))
vi.mock("../../../src/forms/bones/actions/Debug.vue", () => ({ default: {} }))
vi.mock("../../../src/forms/bones/actions/DescribeImage.vue", () => ({ default: {} }))
vi.mock("../../../src/forms/bones/actions/Download.vue", () => ({ default: {}, handler: () => {} }))
vi.mock("../../../src/forms/bones/actions/Placeholder.vue", () => ({ default: {}, handler: () => {} }))
vi.mock("../../../src/forms/bones/actions/Delete.vue", () => ({ default: {}, handler: () => {} }))

// Delete and download are required actions — even without `boneactions`
// and, for download, also when readonly.

const relational = { type: "relational.tree.leaf.file", multiple: false, params: {} }
const names = (actions) => actions.map((action) => action.arg)

afterEach(() => {
  setRequiredActionsForType("relational", [])
})

describe("Pflicht-Actions Löschen und Download", () => {
  it("sind Pflicht (auch ohne boneactions sichtbar)", () => {
    const actions = resolveActions(relational, [], {})
    const byArg = Object.fromEntries(actions.map((action) => [action.arg, action]))

    expect(byArg.delete?.required).toBe(true)
    expect(byArg.download?.required).toBe(true)
  })

  it("überleben Host-Pflicht-Actions für relationale Bones (Admin: select)", () => {
    setRequiredActionsForType("relational", [])
    expect(names(resolveActions(relational, [], {}))).toEqual(expect.arrayContaining(["delete", "download"]))
  })

  it("bleiben abwählbar", () => {
    expect(names(resolveActions(relational, ["-delete", "-download"], {}))).not.toContain("delete")
  })

  it("Löschen nur an Single-Bones (multiple hat das Zeilen-X)", () => {
    expect(names(resolveActions({ ...relational, multiple: true }, [], {}))).not.toContain("delete")
  })
})

describe("isActionDisabled", () => {
  const file = { dest: { key: "k1", downloadUrl: "/file/download/abc?sig=x" } }
  const byArg = (arg) => resolveActions(relational, [], {}).find((action) => action.arg === arg)

  it("Download geht auch bei readonly, Löschen nicht", () => {
    const boneState = { readonly: true }
    expect(isActionDisabled(byArg("download"), { value: file, boneState })).toBe(false)
    expect(isActionDisabled(byArg("delete"), { value: file, boneState })).toBe(true)
  })

  it("Löschen richtet sich nach dem EIGENEN Wert (je Sprache), nicht nach dem Bone", () => {
    // the bone as a whole isn't empty — but this language is
    const boneState = { readonly: false, isEmpty: false }
    expect(isActionDisabled(byArg("delete"), { value: "", boneState })).toBe(true)
    expect(isActionDisabled(byArg("delete"), { value: null, boneState })).toBe(true)
    // cleared relation select
    expect(isActionDisabled(byArg("delete"), { value: { dest: undefined }, boneState })).toBe(true)
    expect(isActionDisabled(byArg("delete"), { value: file, boneState })).toBe(false)
  })

  it("Download ohne Datei gesperrt", () => {
    expect(isActionDisabled(byArg("download"), { value: "", boneState: {} })).toBe(true)
  })
})
