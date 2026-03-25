import BooleanBone from '../../../src/forms/bones/booleanBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(BooleanBone, { type: 'bool', value: false }),
  title: 'Bones/BooleanBone',
}

export const Default  = {}
export const True     = { args: { value: true } }
export const Readonly = { args: { readonly: true, value: true } }
