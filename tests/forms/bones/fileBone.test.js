import { describe, it, expect, beforeEach, vi } from "vitest"
import { createApp, nextTick } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { useMessageStore } from "../../../src/request/messageStore.js"

const uploadFile = vi.fn()
vi.mock("../../../src/request/index.js", () => ({
  uploadFile: (...args) => uploadFile(...args),
  downloadUrlFor: () => "",
}))
vi.mock("../../../src/forms/bones/BoneActions.vue", () => ({ default: { render: () => null } }))

const { default: FileBone } = await import("../../../src/forms/bones/widgets/fileBone.vue")

/**
 * Mounts the widget with a minimal boneState and returns its hidden file input.
 * @returns {HTMLInputElement}
 */
function mountFileBone() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const app = createApp(FileBone, { name: "avatar_image", value: null })
  app.use(pinia)
  app.config.globalProperties.$t = (key) => key
  app.provide("boneState", { readonly: false, multiple: false, errorMessages: [], bonestructure: {} })
  const el = document.createElement("div")
  app.mount(el)
  return el.querySelector("input[type=file]")
}

/**
 * Chooses a file in the hidden input and lets the upload settle.
 * @param {HTMLInputElement} input
 */
async function chooseFile(input) {
  Object.defineProperty(input, "files", { value: [new File(["x"], "foto.png", { type: "image/png" })] })
  input.dispatchEvent(new Event("change"))
  await new Promise((resolve) => setTimeout(resolve))
  await nextTick()
}

describe("fileBone upload", () => {
  beforeEach(() => {
    // Block body on purpose: a returned value would run as teardown and call the mock again.
    uploadFile.mockReset()
  })

  it("reports a failed upload in the message store", async () => {
    uploadFile.mockRejectedValue(new Error("file/add failed: 401"))
    const input = mountFileBone()

    await chooseFile(input)

    const errors = useMessageStore().errors
    expect(errors).toHaveLength(1)
    expect(errors[0].module).toBe("file")
  })
})
