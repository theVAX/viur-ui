import { downloadUrlFor, uploadFile } from "../../request/index.js"

class ViURUploadAdapter {
  constructor(loader, api_url) {
    this.loader = loader
    this.api_url = api_url
  }

  async upload() {
    this.loader.uploadTotal = 100
    this.loader.uploaded = 0
    this.controller = new AbortController()
    try {
      const file = await this.loader.file
      this.loader.uploaded = 10
      const uploadedData = await uploadFile(file, { renderer: "vi", signal: this.controller.signal })
      this.loader.uploaded = 100
      return {
        // The URL ends up in the text bone's HTML: as /file/download/…
        // (only made absolute) — viur-core recognizes those again
        // (blob reference, srcset) and it doesn't sit behind /vi.
        default: downloadUrlFor(uploadedData["downloadUrl"]),
      }
    } catch (error) {
      throw error // CKEditor shows the failed upload
    }
  }

  // Aborts the upload process (called by CKEditor, e.g. when the image is removed while uploading).
  abort() {
    this.controller?.abort()
  }
}

export function ViURUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new ViURUploadAdapter(loader, editor.config.get("viur_api_url"))
  }
}
