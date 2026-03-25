import StringBone from '../../../src/forms/bones/stringBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(StringBone, { type: 'str', value: '' }),
  title: 'Bones/StringBone',
}

export const Default   = {}
export const WithValue = { args: { value: 'Beispieltext' } }
export const Readonly  = { args: { readonly: true, value: 'Nur lesen' } }
