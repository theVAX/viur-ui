import BooleanBoneSelect from '../../../src/forms/bones/booleanBoneSelect.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(BooleanBoneSelect, { type: 'bool', value: false }),
  title: 'Bones/BooleanBoneSelect',
}

export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
