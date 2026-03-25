import KeyBone from '../../../src/forms/bones/keyBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(KeyBone, { type: 'key', value: '' }),
  title: 'Bones/KeyBone',
}

export const Default   = {}
export const WithValue = { args: { value: 'abc123def456' } }
export const Readonly  = { args: { readonly: true, value: 'abc123def456' } }
