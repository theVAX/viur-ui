import BooleanBoneChoose from '../../../src/forms/bones/booleanBoneChoose.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(BooleanBoneChoose, { type: 'bool', value: false }),
  title: 'Bones/BooleanBoneChoose',
}

export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
