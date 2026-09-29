<script>
import { downloadUrlFor } from "../../../request/index.js"

/**
 * Direct-fire action: downloads the file referenced in the bone value.
 * Called directly by `BoneActions` for `type: "callback"` — no dialog.
 *
 * @param {{ value: object, name: string, lang: string, index: number, bone: object, boneState: object }} ctx
 */
export function handler(ctx) {
  const url = downloadUrlFor(ctx.value)
  if (!url) return

  // Anchor click instead of window.open: also works with data URLs
  // (browsers block top-level navigation to data: URLs for phishing reasons).
  const a = document.createElement("a")
  a.href = url
  a.download = ctx.value?.dest?.name ?? ""
  a.rel = "noopener"
  a.target = "_blank"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default {}
</script>
