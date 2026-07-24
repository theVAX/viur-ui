import { describe, it, expect } from "vitest"
import { normalizeEnvelope, isEnvelopeV2 } from "../../src/request/envelope.js"

describe("isEnvelopeV2", () => {
  it("detects the JSON number version 2", () => {
    expect(isEnvelopeV2({ version: 2, datatype: "entity" })).toBe(true)
  })

  it("tolerates the string '2' defensively", () => {
    expect(isEnvelopeV2({ version: "2" })).toBe(true)
  })

  it("is false for v1 bodies, arrays, and primitives", () => {
    expect(isEnvelopeV2({ values: { key: "k" } })).toBe(false)
    expect(isEnvelopeV2({ version: 1 })).toBe(false)
    expect(isEnvelopeV2([1, 2, 3])).toBe(false)
    expect(isEnvelopeV2(null)).toBe(false)
    expect(isEnvelopeV2("str")).toBe(false)
  })
})

describe("normalizeEnvelope — passthrough", () => {
  it("returns arrays unchanged (e.g. skey batch)", () => {
    const arr = ["sk1", "sk2"]
    expect(normalizeEnvelope(arr)).toBe(arr)
  })

  it("returns primitives / null unchanged", () => {
    expect(normalizeEnvelope(null)).toBeNull()
    expect(normalizeEnvelope("okay")).toBe("okay")
  })

  it("leaves a non-ViUR object (e.g. getStructure map) untouched", () => {
    const struct = { viewSkel: { name: { type: "str" } } }
    expect(normalizeEnvelope(struct)).toEqual(struct)
    expect(normalizeEnvelope(struct).version).toBeUndefined()
  })

  it("passes a v2 entity envelope through, ensuring errors is an array", () => {
    const v2 = { version: 2, datatype: "entity", action: "view", status: "success", data: { key: "k" } }
    const out = normalizeEnvelope(v2)
    expect(out.version).toBe(2)
    expect(out.data).toEqual({ key: "k" })
    expect(out.errors).toEqual([])
  })

  it("rebuilds meta for a v2 list envelope that lacks it", () => {
    const v2 = { version: 2, datatype: "list", data: [{ key: "a" }], cursor: "c1", orders: ["name asc"] }
    const out = normalizeEnvelope(v2)
    expect(out.meta).toEqual({ cursor: "c1", orders: ["name asc"] })
  })
})

describe("normalizeEnvelope — v1 → v2 entity", () => {
  it("lifts values → data and keeps v1 fields alongside", () => {
    const v1 = { action: "view", values: { key: "k", name: "Test" }, structure: { name: { type: "str" } }, errors: [] }
    const out = normalizeEnvelope(v1)
    expect(out.version).toBe(2)
    expect(out.datatype).toBe("entity")
    expect(out.data).toEqual({ key: "k", name: "Test" })
    expect(out.structure).toEqual({ name: { type: "str" } })
    expect(out.values).toEqual({ key: "k", name: "Test" }) // original kept
  })

  it("maps editSuccess → action edit / status success", () => {
    const out = normalizeEnvelope({ action: "editSuccess", values: { key: "k" } })
    expect(out.action).toBe("edit")
    expect(out.status).toBe("success")
  })

  it("maps addSuccess → action add / status success", () => {
    const out = normalizeEnvelope({ action: "addSuccess", values: { key: "k" } })
    expect(out.action).toBe("add")
    expect(out.status).toBe("success")
  })

  it("treats a non-success add/edit form as init when there are no errors", () => {
    const out = normalizeEnvelope({ action: "edit", values: {}, errors: [] })
    expect(out.action).toBe("edit")
    expect(out.status).toBe("init")
  })

  it("treats a form carrying errors as rejected", () => {
    const out = normalizeEnvelope({ action: "add", values: {}, errors: [{ fieldPath: "name" }] })
    expect(out.status).toBe("rejected")
    expect(out.errors).toHaveLength(1)
  })

  it("aliases next_url → follow when follow is absent", () => {
    const out = normalizeEnvelope({ action: "view", values: {}, next_url: "/next" })
    expect(out.follow).toBe("/next")
  })
})

describe("normalizeEnvelope — v1 → v2 list", () => {
  it("lifts skellist → data and cursor/orders → meta", () => {
    const v1 = { skellist: [{ key: "a" }, { key: "b" }], cursor: "cur", orders: ["date desc"] }
    const out = normalizeEnvelope(v1)
    expect(out.version).toBe(2)
    expect(out.datatype).toBe("list")
    expect(out.data).toEqual([{ key: "a" }, { key: "b" }])
    expect(out.meta).toEqual({ cursor: "cur", orders: ["date desc"] })
  })

  it("defaults cursor to null and orders to [] when missing", () => {
    const out = normalizeEnvelope({ skellist: [] })
    expect(out.meta).toEqual({ cursor: null, orders: [] })
  })
})

describe("normalizeEnvelope — idempotency", () => {
  it("is stable when applied twice to a v1 body", () => {
    const v1 = { action: "editSuccess", values: { key: "k" }, structure: {}, errors: [] }
    const once = normalizeEnvelope(v1)
    const twice = normalizeEnvelope(once)
    expect(twice).toEqual(once)
  })
})
