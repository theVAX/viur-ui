import { downloadUrlFor, uploadFile } from "../../request/index.js"

class ViURUploadAdapter {
  constructor(loader, api_url) {
    this.loader = loader
    this.api_url = api_url
  }

  async upload() {
    this.loader.uploadTotal = 100
    this.loader.uploaded = 0
    return this.loader.file.then(
      async (file) =>
        new Promise((resolve, reject) => {
          this.loader.uploaded = 10
          uploadFile(file, { renderer: "vi" })
            .then((uploadedData) => {
              this.loader.uploaded = 75
              this.loader.uploaded = 100
              resolve({
                // The URL ends up in the text bone's HTML: as /file/download/…
                // (only made absolute) — viur-core recognizes those again
                // (blob reference, srcset) and it doesn't sit behind /vi.
                default: downloadUrlFor(uploadedData["downloadUrl"]),
              })
            })
            .catch((error) => {
              reject(error)
            })
        })
    )
  }

  // Aborts the upload process.
  abort() {
    if (this.xhr) {
      this.xhr.abort()
    }
  }
}

export function ViURUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new ViURUploadAdapter(loader, editor.config.get("viur_api_url"))
  }
}
