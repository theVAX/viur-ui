import RawBone from '../../../src/forms/bones/rawBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(RawBone, { type: 'raw', value: '' }),
  title: 'Bones/RawBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true, value: '<raw>content</raw>' } }
