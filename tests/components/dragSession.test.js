import { describe, it, expect, vi } from "vitest"
import { createDragSession, dropModeFor } from "../../src/components/Browser/dragSession.ts"

function fakeContainer(id, targets = {}) {
  const root = { contains: (el) => el?.container === id }
  return {
    id,
    el: () => root,
    targetFor: (hit) => targets[hit.key] ?? null,
  }
}
const hit = (container, key) => ({ container, key })

describe("createDragSession", () => {
  it("start/update/drop hands payload and target to the owner", () => {
    const onDrop = vi.fn()
    const session = createDragSession(onDrop)
    session.register(fakeContainer("tree", { n1: { container: "tree", key: "n1", mode: "inside" } }))

    expect(session.update(0, 0, hit("tree", "n1"))).toBeNull() // not active yet
    session.start({ keys: ["a"], rows: [{ key: "a" }], source: "list" })
    expect(session.state.active).toBe(true)

    const target = session.update(0, 0, hit("tree", "n1"))
    expect(target).toEqual({ container: "tree", key: "n1", mode: "inside" })
    expect(session.state.over).toEqual(target)

    const result = session.drop()
    expect(result.payload.keys).toEqual(["a"])
    expect(result.target.key).toBe("n1")
    expect(onDrop).toHaveBeenCalledWith(result.payload, result.target)
    expect(session.state.active).toBe(false)
    expect(session.state.over).toBeNull()
  })

  it("misses: unknown element, foreign container, no target from container", () => {
    const session = createDragSession()
    session.register(fakeContainer("tree", {}))
    session.start({ keys: ["a"], rows: [], source: "list" })
    expect(session.update(0, 0, null)).toBeNull()
    expect(session.update(0, 0, hit("other", "x"))).toBeNull()
    expect(session.update(0, 0, hit("tree", "unknown"))).toBeNull()
    expect(session.drop()).toBeNull() // no target → no drop
  })

  it("cancel clears everything without dropping", () => {
    const onDrop = vi.fn()
    const session = createDragSession(onDrop)
    session.register(fakeContainer("tree", { n1: { container: "tree", key: "n1", mode: "inside" } }))
    session.start({ keys: ["a"], rows: [], source: "tree" })
    session.update(0, 0, hit("tree", "n1"))
    session.cancel()
    expect(session.state.active).toBe(false)
    expect(session.drop()).toBeNull()
    expect(onDrop).not.toHaveBeenCalled()
  })

  it("unregister removes a container", () => {
    const session = createDragSession()
    const off = session.register(fakeContainer("tree", { n1: { container: "tree", key: "n1", mode: "inside" } }))
    session.start({ keys: ["a"], rows: [], source: "list" })
    expect(session.update(0, 0, hit("tree", "n1"))).not.toBeNull()
    off()
    expect(session.update(0, 0, hit("tree", "n1"))).toBeNull()
  })
})

describe("dropModeFor", () => {
  const rect = { top: 100, height: 40 }
  it("splits before / inside / after by zones", () => {
    expect(dropModeFor(rect, 105)).toBe("before") // top quarter
    expect(dropModeFor(rect, 120)).toBe("inside") // middle
    expect(dropModeFor(rect, 135)).toBe("after") // bottom quarter
    expect(dropModeFor(rect, 120, true)).toBe("inside")
    expect(dropModeFor(rect, 105, true)).toBe("inside")
  })
})
