import NumericBone from '../../../src/forms/bones/numericBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(NumericBone, { type: 'numeric', value: null }),
  title: 'Bones/NumericBone',
}

export const Default   = {}
export const WithValue = { args: { value: 42 } }
export const Readonly  = { args: { readonly: true, value: 42 } }
