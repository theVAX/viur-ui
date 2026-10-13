/**
 * Bones a list layout renders: all of the structure in its order, or only those of the ViForm
 * `bones` prop. The same rule as the categories (`updateCategories` in `../utils.js`).
 * @param {{ structure: Object, bones: string[] }} formState
 * @returns {string[]}
 */
export function shownBones(formState) {
  const names = Object.keys(formState.structure ?? {})
  return formState.bones?.length ? names.filter((name) => formState.bones.includes(name)) : names
}
