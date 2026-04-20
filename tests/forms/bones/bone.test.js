import { describe, it, expect } from "vitest"

// ─── Helpers (exakt aus bone.vue übernommen) ──────────────────────────────────

/**
 * Prüft ob ein Objekt ausschließlich null-Werte oder leere Arrays enthält.
 * Identisch mit isObjectEmpty in bone.vue.
 */
function isObjectEmpty(obj) {
  for (const [, value] of Object.entries(obj)) {
    if (value !== null) {
      if (Array.isArray(value) && value.length > 0) {
        return false
      } else if (!Array.isArray(value)) {
        return false
      }
    }
  }
  return true
}

/**
 * Filtert Fehler nach fieldPath und Severity — Logik aus dem errorMessages-computed in bone.vue.
 */
function filterErrors(errors, name, { multilanguage, multiple, required }) {
  let result = []
  for (let error of errors) {
    const fp = error.fieldPath
    const matchesLength =
      fp[0] === name &&
      (fp.length === 1 ||
        ((multilanguage || multiple) && fp.length === 2) ||
        (multilanguage && multiple && fp.length === 3))
    const matchesSeverity =
      error.severity > 2 || (required && (error.severity === 2 || error.severity === 0))
    if (matchesLength && matchesSeverity) {
      result.push(error.errorMessage)
    }
  }
  return result
}

/**
 * Simuliert updateValue aus bone.vue: mutiert state, gibt emittierte Events zurück.
 */
function simulateUpdateValue(state, name, val, lang = null, index = null, valid = true) {
  const emitted = []

  if (val === undefined) return { state, emitted, result: false }

  if (valid) {
    if (lang) {
      if (!state.bonevalue) state.bonevalue = {}
      if (Object.keys(state.bonevalue).includes(lang) && index !== null) {
        state.bonevalue[lang][index] = val
      } else {
        state.bonevalue[lang] = val
      }
    } else if (index !== null) {
      state.bonevalue[index] = val
    } else {
      state.bonevalue = val
    }
  }

  if (state.readonly) return { state, emitted, result: false }

  emitted.push({ name, value: val, lang, index, valid })
  return { state, emitted }
}

// ─── isObjectEmpty ────────────────────────────────────────────────────────────

describe("bone.vue – isObjectEmpty", () => {
  it("leeres Objekt → true", () => {
    expect(isObjectEmpty({})).toBe(true)
  })

  it("alle Werte null → true", () => {
    expect(isObjectEmpty({ a: null, b: null })).toBe(true)
  })

  it("leere Arrays → true", () => {
    expect(isObjectEmpty({ a: [], b: [] })).toBe(true)
  })

  it("null + leeres Array → true", () => {
    expect(isObjectEmpty({ a: null, b: [] })).toBe(true)
  })

  it("nicht-leeres Array → false", () => {
    expect(isObjectEmpty({ a: ["x"] })).toBe(false)
  })

  it("nicht-null Skalar → false", () => {
    expect(isObjectEmpty({ a: "foo" })).toBe(false)
  })

  it("gemischt null + nicht-null → false", () => {
    expect(isObjectEmpty({ a: null, b: "something" })).toBe(false)
  })
})

// ─── errorMessages filter ─────────────────────────────────────────────────────

describe("bone.vue – errorMessages filter", () => {
  const base = { multilanguage: false, multiple: false, required: false }

  it("passender fieldPath[0] + severity > 2 → enthalten", () => {
    const errors = [{ fieldPath: ["title"], severity: 3, errorMessage: "required" }]
    expect(filterErrors(errors, "title", base)).toEqual(["required"])
  })

  it("anderer Bone-Name → nicht enthalten", () => {
    const errors = [{ fieldPath: ["other"], severity: 3, errorMessage: "required" }]
    expect(filterErrors(errors, "title", base)).toEqual([])
  })

  it("severity ≤ 2 ohne required → nicht enthalten", () => {
    const errors = [{ fieldPath: ["title"], severity: 2, errorMessage: "warn" }]
    expect(filterErrors(errors, "title", base)).toEqual([])
  })

  it("severity 2 mit required=true → enthalten", () => {
    const errors = [{ fieldPath: ["title"], severity: 2, errorMessage: "warn" }]
    expect(filterErrors(errors, "title", { ...base, required: true })).toEqual(["warn"])
  })

  it("severity 0 mit required=true → enthalten", () => {
    const errors = [{ fieldPath: ["title"], severity: 0, errorMessage: "empty" }]
    expect(filterErrors(errors, "title", { ...base, required: true })).toEqual(["empty"])
  })

  it("fieldPath Länge 2 bei multilanguage → enthalten", () => {
    const errors = [{ fieldPath: ["title", "de"], severity: 3, errorMessage: "err" }]
    expect(filterErrors(errors, "title", { ...base, multilanguage: true })).toEqual(["err"])
  })

  it("fieldPath Länge 2 bei multiple → enthalten", () => {
    const errors = [{ fieldPath: ["title", 0], severity: 3, errorMessage: "err" }]
    expect(filterErrors(errors, "title", { ...base, multiple: true })).toEqual(["err"])
  })

  it("fieldPath Länge 2 bei einfachem Bone → nicht enthalten", () => {
    const errors = [{ fieldPath: ["title", "de"], severity: 3, errorMessage: "err" }]
    expect(filterErrors(errors, "title", base)).toEqual([])
  })

  it("fieldPath Länge 3 bei multilanguage+multiple → enthalten", () => {
    const errors = [{ fieldPath: ["title", "de", 0], severity: 3, errorMessage: "err" }]
    expect(filterErrors(errors, "title", { multilanguage: true, multiple: true, required: false })).toEqual(["err"])
  })

  it("fieldPath Länge 3 bei nur multilanguage → nicht enthalten", () => {
    const errors = [{ fieldPath: ["title", "de", 0], severity: 3, errorMessage: "err" }]
    expect(filterErrors(errors, "title", { ...base, multilanguage: true })).toEqual([])
  })

  it("mehrere Fehler: nur passende enthalten", () => {
    const errors = [
      { fieldPath: ["title"], severity: 3, errorMessage: "err1" },
      { fieldPath: ["other"], severity: 3, errorMessage: "err2" },
      { fieldPath: ["title"], severity: 1, errorMessage: "err3" },
    ]
    expect(filterErrors(errors, "title", base)).toEqual(["err1"])
  })
})

// ─── updateValue Zustandslogik ────────────────────────────────────────────────

describe("bone.vue – updateValue", () => {
  it("setzt skalaren bonevalue und feuert Event", () => {
    const state = { bonevalue: null, readonly: false }
    const { state: s, emitted } = simulateUpdateValue(state, "title", "Hello")
    expect(s.bonevalue).toBe("Hello")
    expect(emitted).toHaveLength(1)
    expect(emitted[0]).toMatchObject({ name: "title", value: "Hello", lang: null, index: null, valid: true })
  })

  it("setzt Multilang-Wert", () => {
    const state = { bonevalue: {}, readonly: false }
    const { state: s } = simulateUpdateValue(state, "title", "Hallo", "de")
    expect(s.bonevalue.de).toBe("Hallo")
  })

  it("initialisiert bonevalue-Objekt wenn null bei Multilang", () => {
    const state = { bonevalue: null, readonly: false }
    const { state: s } = simulateUpdateValue(state, "title", "Hallo", "de")
    expect(s.bonevalue).toEqual({ de: "Hallo" })
  })

  it("setzt Multilang + Index", () => {
    const state = { bonevalue: { de: ["a", "b"] }, readonly: false }
    const { state: s } = simulateUpdateValue(state, "title", "X", "de", 1)
    expect(s.bonevalue.de[1]).toBe("X")
  })

  it("setzt Index-Wert im Multiple-Array", () => {
    const state = { bonevalue: ["a", "b"], readonly: false }
    const { state: s } = simulateUpdateValue(state, "title", "Z", null, 0)
    expect(s.bonevalue[0]).toBe("Z")
  })

  it("val=undefined → frühzeitiger Return, kein State-Update", () => {
    const state = { bonevalue: "orig", readonly: false }
    const { result } = simulateUpdateValue(state, "title", undefined)
    expect(result).toBe(false)
    expect(state.bonevalue).toBe("orig")
  })

  it("readonly → kein Event, State bleibt aktualisiert", () => {
    const state = { bonevalue: null, readonly: true }
    const { state: s, emitted } = simulateUpdateValue(state, "title", "X")
    expect(s.bonevalue).toBe("X")
    expect(emitted).toHaveLength(0)
  })

  it("valid=false → bonevalue nicht aktualisiert, Event trotzdem gefeuert", () => {
    const state = { bonevalue: "old", readonly: false }
    const { state: s, emitted } = simulateUpdateValue(state, "title", "new", null, null, false)
    expect(s.bonevalue).toBe("old")
    expect(emitted).toHaveLength(1)
    expect(emitted[0].valid).toBe(false)
  })
})
