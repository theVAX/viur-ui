<script>
/**
 * Direct-fire action: resets the bone value to an empty string.
 * Called directly by `BoneActions` for `type: "callback"` — no dialog.
 *
 * @param {{ value: object, name: string, lang: string, index: number, bone: object, boneState: object, update: Function }} ctx
 */
export function handler(ctx) {
  ctx.update("")
}

export default {}
</script>
