import { it, expect, vi } from "vitest"

vi.mock("../../../src/request/index.js", async (importOriginal) => ({
  ...(await importOriginal()),
  uploadFile: vi.fn(async () => ({ key: "f1", downloadUrl: "/file/download/abc?sig=x" })),
}))

const { ViURUploadAdapterPlugin } = await import("../../../src/forms/bones/uploadAdapter.js")

it("Bild-Upload im Text-Bone speichert /file/download/…, nicht /vi/…", async () => {
  const fileRepository = {}
  const editor = { plugins: { get: () => fileRepository }, config: { get: () => undefined } }
  ViURUploadAdapterPlugin(editor)
  const loader = { file: Promise.resolve(new File(["x"], "bild.png", { type: "image/png" })) }

  const result = await fileRepository.createUploadAdapter(loader).upload()

  expect(result.default).toBe("http://api.test/file/download/abc?sig=x")
})

it("abort() cancels the running upload", async () => {
  const { uploadFile } = await import("../../../src/request/index.js")
  const fileRepository = {}
  const editor = { plugins: { get: () => fileRepository }, config: { get: () => undefined } }
  ViURUploadAdapterPlugin(editor)
  const adapter = fileRepository.createUploadAdapter({ file: Promise.resolve(new File(["x"], "bild.png")) })

  const upload = adapter.upload()
  await vi.waitFor(() => expect(uploadFile).toHaveBeenCalledTimes(2))
  adapter.abort()

  expect(uploadFile.mock.calls.at(-1)[1].signal.aborted).toBe(true)
  await upload
})
