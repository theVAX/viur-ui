/**
 * Erzeugt eine Standard-Storybook-Meta-Konfiguration für einen Bone.
 * @param {object} component  → Vue-Komponente
 * @param {object} defaults   → { type, value, bone }
 */
export function createBoneStory(component, defaults = {}) {
  return {
    component,
    argTypes: {
      readonly: { control: 'boolean' },
      multiple: { control: 'boolean' },
      isEmpty:  { control: 'boolean' },
      required: { control: 'boolean' },
    },
    args: {
      name:  'testField',
      value: defaults.value ?? null,
      bone:  { type: defaults.type ?? 'string', params: {}, ...(defaults.bone ?? {}) },
    },
  }
}
