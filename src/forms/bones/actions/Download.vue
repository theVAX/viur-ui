<script>
import { downloadUrlFor } from "../../../request/index.js"

/**
 * Direct-fire Action: lädt die im Bone-Value referenzierte Datei herunter.
 * Wird von `BoneActions` bei `type: "callback"` direkt aufgerufen — kein Dialog.
 *
 * @param {{ value: object, name: string, lang: string, index: number, bone: object, boneState: object }} ctx
 */
export function handler(ctx) {
  const url = downloadUrlFor(ctx.value)
  if (!url) return

  // Anchor-Click statt window.open: funktioniert auch mit Data-URLs
  // (Browser blockt Top-Level-Navigation zu data:-URLs aus Phishing-Gründen).
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
