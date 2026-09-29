<script>
/**
 * Direct-fire Action: setzt den Bone-Wert auf einen leeren String zurück.
 * Wird von `BoneActions` bei `type: "callback"` direkt aufgerufen — kein Dialog.
 *
 * @param {{ value: object, name: string, lang: string, index: number, bone: object, boneState: object, update: Function }} ctx
 */
export function handler(ctx) {
  ctx.update("")
}

export default {}
</script>
