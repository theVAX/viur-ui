import { describe, it, expect, vi } from "vitest"
import { createApp } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { useMessageStore } from "../../../src/request/messageStore.js"

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key) => key }) }))
const uploadFile = vi.fn()
vi.mock("../../../src/request/index.js", () => ({ uploadFile: (...args) => uploadFile(...args) }))
vi.mock("../../../src/forms/bones/relationalSource.js", () => ({ useRelationalSource: () => async () => [] }))

const { default: RelationalBar } = await import("../../../src/forms/bones/actionbar/relationalBar.vue")
const { default: FileBar } = await import("../../../src/forms/bones/actionbar/fileBar.vue")

/**
 * Mounts an actionbar of a multiple bone with spies for the injected list operations.
 * @returns {{ el: HTMLElement, addMultipleEntry: Function, removeMultipleEntries: Function }}
 */
function mountBar(component) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const addMultipleEntry = vi.fn()
  const removeMultipleEntries = vi.fn()
  const app = createApp(component, { name: "files", value: [{ dest: {} }], lang: null })
  app.use(pinia)
  app.config.globalProperties.$t = (key) => key
  app.provide("boneState", { multiple: true, readonly: false, bonestructure: { using: null } })
  app.provide("addMultipleEntry", addMultipleEntry)
  app.provide("removeMultipleEntries", removeMultipleEntries)
  app.provide("formatString", () => "")
  const el = document.createElement("div")
  app.mount(el)
  return { el, addMultipleEntry, removeMultipleEntries }
}

describe("actionbars", () => {
  it.each([
    ["relationalBar", RelationalBar],
    ["fileBar", FileBar],
  ])("%s removes all entries with its delete button", (_, component) => {
    const { el, removeMultipleEntries } = mountBar(component)
    el.querySelector(".delete-btn").dispatchEvent(new Event("click"))
    expect(removeMultipleEntries).toHaveBeenCalledWith(null)
  })

  it("fileBar reports a failed upload and stops loading", async () => {
    uploadFile.mockRejectedValueOnce(new Error("file/add failed: 401"))
    const { el, addMultipleEntry } = mountBar(FileBar)
    const input = el.querySelector("input[type=file]")
    Object.defineProperty(input, "files", { value: [new File(["x"], "a.png")] })

    input.dispatchEvent(new Event("change"))

    await vi.waitFor(() => expect(useMessageStore().errors).toHaveLength(1))
    expect(el.querySelector("wa-spinner")).toBeNull()
    expect(addMultipleEntry).not.toHaveBeenCalled()
  })
})
