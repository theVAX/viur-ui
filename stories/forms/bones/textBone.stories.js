import TextBone from '../../../src/forms/bones/textBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(TextBone, { type: 'text', value: '' }),
  title: 'Bones/TextBone',
}

export const Default  = {}
export const WithText = { args: { value: '<p>Beispieltext</p>' } }
export const Readonly = { args: { readonly: true, value: '<p>Nur lesen</p>' } }
