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
                // Die URL landet im HTML des Text-Bones: als /file/download/…
                // (nur absolut gemacht) — die erkennt viur-core wieder
                // (Blob-Referenz, srcset) und sie liegt nicht hinter /vi.
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
