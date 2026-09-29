import { it, expect, vi } from "vitest"

vi.mock("../../../src/request/index.js", async (importOriginal) => ({
  ...(await importOriginal()),
  uploadFile: vi.fn(async () => ({ key: "f1", downloadUrl: "/file/download/abc?sig=x" })),
}))

const { ViURUploadAdapterPlugin } = await import("../../../src/forms/bones/uploadAdapter.js")

it("Bild-Upload im Text-Bone speichert /file/download/… (wie Legacy), nicht /vi/…", async () => {
  const fileRepository = {}
  const editor = { plugins: { get: () => fileRepository }, config: { get: () => undefined } }
  ViURUploadAdapterPlugin(editor)
  const loader = { file: Promise.resolve(new File(["x"], "bild.png", { type: "image/png" })) }

  const result = await fileRepository.createUploadAdapter(loader).upload()

  expect(result.default).toBe("http://api.test/file/download/abc?sig=x")
})
