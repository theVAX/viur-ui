import FileBone from '../../../src/forms/bones/fileBone.vue'
import { createBoneStory } from './storyHelpers.js'

const FILE_VALUE = { dest: { key: 'file123', name: 'bild.jpg', mimetype: 'image/jpeg', downloadUrl: '/static/bild.jpg' } }

export default {
  ...createBoneStory(FileBone, { type: 'file', value: null }),
  title: 'Bones/FileBone',
}

export const Default  = {}
export const WithFile = { args: { value: FILE_VALUE } }
export const Readonly = { args: { readonly: true, value: FILE_VALUE } }
