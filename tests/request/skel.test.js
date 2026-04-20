import { describe, it, expect } from "vitest"
import { skelDataToFormData } from "../../src/request/skel.js"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flatEntries(result) {
  return Object.assign({}, ...result)
}

// ─── Simple bone types ────────────────────────────────────────────────────────

describe("skelDataToFormData – simple bones", () => {
  it("string bone: single value", () => {
    const result = skelDataToFormData({ name: "Alice" }, { name: { type: "str" } })
    expect(flatEntries(result)).toEqual({ name: "Alice" })
  })

  it("number bone: single value", () => {
    const result = skelDataToFormData({ age: 30 }, { age: { type: "numeric" } })
    expect(flatEntries(result)).toEqual({ age: 30 })
  })

  it("boolean bone: false value", () => {
    const result = skelDataToFormData({ active: false }, { active: { type: "bool" } })
    expect(flatEntries(result)).toEqual({ active: false })
  })

  it("null/undefined value becomes null", () => {
    const result = skelDataToFormData({ title: null }, { title: { type: "str" } })
    expect(flatEntries(result)).toEqual({ title: null })
  })
})

// ─── Multiple bones ───────────────────────────────────────────────────────────

describe("skelDataToFormData – multiple bones", () => {
  it("multiple string: one entry per value, same key", () => {
    const result = skelDataToFormData({ tags: ["foo", "bar"] }, { tags: { type: "str", multiple: true } })
    expect(result).toEqual([{ tags: "foo" }, { tags: "bar" }])
  })

  it("multiple string: empty array produces null entry", () => {
    const result = skelDataToFormData({ tags: [] }, { tags: { type: "str", multiple: true } })
    expect(result).toEqual([{ tags: null }])
  })

  it("multiple string: undefined value produces null entry", () => {
    const result = skelDataToFormData({}, { tags: { type: "str", multiple: true } })
    expect(result).toEqual([{ tags: null }])
  })
})

// ─── Multilingual bones ───────────────────────────────────────────────────────

describe("skelDataToFormData – multilingual bones", () => {
  it("multilingual: one entry per language", () => {
    const result = skelDataToFormData(
      { title: { de: "Hallo", en: "Hello" } },
      { title: { type: "str", languages: ["de", "en"] } }
    )
    expect(result).toEqual([{ "title.de": "Hallo" }, { "title.en": "Hello" }])
  })

  it("multilingual + multiple: indexed per language", () => {
    const result = skelDataToFormData(
      { labels: { de: ["Eins", "Zwei"] } },
      { labels: { type: "str", languages: ["de"], multiple: true } }
    )
    expect(result).toEqual([{ "labels.de": "Eins" }, { "labels.de": "Zwei" }])
  })
})

// ─── Relational bones ─────────────────────────────────────────────────────────

describe("skelDataToFormData – relational bones", () => {
  it("plain relational: uses dest.key", () => {
    const result = skelDataToFormData(
      { category: { dest: { key: "cat-key-1" } } },
      { category: { type: "relational" } }
    )
    expect(flatEntries(result)).toEqual({ category: "cat-key-1" })
  })

  it("plain relational: empty object produces null", () => {
    const result = skelDataToFormData({ category: {} }, { category: { type: "relational" } })
    expect(flatEntries(result)).toEqual({ category: null })
  })

  it("null relational: null value", () => {
    const result = skelDataToFormData({ category: null }, { category: { type: "relational" } })
    expect(flatEntries(result)).toEqual({ category: null })
  })

  it("relational with using: dest.key + rel sub-fields indexed", () => {
    const result = skelDataToFormData(
      { ref: { dest: { key: "dest-1" }, rel: { note: "hello" } } },
      { ref: { type: "relational", using: { note: { type: "str" } } } }
    )
    const flat = flatEntries(result)
    expect(flat["ref.key"]).toBe("dest-1")
    expect(flat["ref.note"]).toBe("hello")
  })

  it("relational with using but no dest.key: produces null", () => {
    const result = skelDataToFormData(
      { ref: { dest: {} } },
      { ref: { type: "relational", using: { note: { type: "str" } } } }
    )
    expect(flatEntries(result)).toEqual({ ref: null })
  })

  it("multiple relational: each entry indexed", () => {
    const result = skelDataToFormData(
      { refs: [{ dest: { key: "k1" } }, { dest: { key: "k2" } }] },
      { refs: { type: "relational", multiple: true } }
    )
    expect(result).toEqual([{ refs: "k1" }, { refs: "k2" }])
  })
})

// ─── Record bones ─────────────────────────────────────────────────────────────

describe("skelDataToFormData – record bones", () => {
  it("record: sub-fields dot-prefixed", () => {
    const result = skelDataToFormData(
      { address: { street: "Main St", city: "Berlin" } },
      { address: { type: "record", using: { street: { type: "str" }, city: { type: "str" } } } }
    )
    const flat = flatEntries(result)
    expect(flat["address.street"]).toBe("Main St")
    expect(flat["address.city"]).toBe("Berlin")
  })

  it("record: using as array format", () => {
    const result = skelDataToFormData(
      { point: { x: 1, y: 2 } },
      {
        point: {
          type: "record",
          using: [
            ["x", { type: "numeric" }],
            ["y", { type: "numeric" }],
          ],
        },
      }
    )
    const flat = flatEntries(result)
    expect(flat["point.x"]).toBe(1)
    expect(flat["point.y"]).toBe(2)
  })
})

// ─── Spatial bones ────────────────────────────────────────────────────────────

describe("skelDataToFormData – spatial bones", () => {
  it("spatial: splits into .lat and .lng", () => {
    const result = skelDataToFormData({ location: [52.5, 13.4] }, { location: { type: "spatial" } })
    expect(result).toContainEqual({ "location.lat": 52.5 })
    expect(result).toContainEqual({ "location.lng": 13.4 })
  })

  it("spatial: null value produces null", () => {
    const result = skelDataToFormData({ location: null }, { location: { type: "spatial" } })
    expect(flatEntries(result)).toEqual({ location: null })
  })
})

// ─── raw.json bones ───────────────────────────────────────────────────────────

describe("skelDataToFormData – raw.json bones", () => {
  it("raw.json: JSON-serializes the value", () => {
    const obj = { config: { timeout: 30 } }
    const result = skelDataToFormData({ meta: obj }, { meta: { type: "raw.json" } })
    expect(flatEntries(result)).toEqual({ meta: JSON.stringify(obj) })
  })

  it("raw.json: null value produces null", () => {
    const result = skelDataToFormData({ meta: null }, { meta: { type: "raw.json" } })
    expect(flatEntries(result)).toEqual({ meta: null })
  })
})

// ─── normalizeStructure ───────────────────────────────────────────────────────

describe("skelDataToFormData – structure formats", () => {
  it("handles structure as object (normal format)", () => {
    const result = skelDataToFormData({ x: "hello" }, { x: { type: "str" } })
    expect(flatEntries(result)).toEqual({ x: "hello" })
  })
})
