import JsonBone from '../../../src/forms/bones/jsonBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(JsonBone, { type: 'raw.json', value: null }),
  title: 'Bones/JsonBone',
}

export const Default   = {}
export const WithValue = { args: { value: { key: 'value', number: 42 } } }
export const Readonly  = { args: { readonly: true, value: { key: 'value' } } }
