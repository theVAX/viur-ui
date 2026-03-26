import { ref, watch } from 'vue'

/**
 * Erzeugt eine Standard-Storybook-Meta-Konfiguration für einen Bone.
 * Verwaltet value lokal reaktiv, damit @change-Events das Feld korrekt updaten.
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
    render(args) {
      return {
        components: { BoneComponent: component },
        setup() {
          const value = ref(args.value ?? null)
          watch(() => args.value, (v) => { value.value = v })
          return {
            args,
            value,
            onChange: (name, val) => { value.value = val },
          }
        },
        template: '<BoneComponent v-bind="args" :value="value" @change="onChange" />',
      }
    },
  }
}
