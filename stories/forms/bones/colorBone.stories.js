import ColorBone from '../../../src/forms/bones/colorBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(ColorBone, { type: 'str', value: '' }),
  title: 'Bones/ColorBone',
}

export const Default   = {}
export const WithColor = { args: { value: '#ff5500' } }
export const Readonly  = { args: { readonly: true, value: '#ff5500' } }
