import RecordBone from '../../../src/forms/bones/recordBone.vue'
import { createBoneStory } from './storyHelpers.js'

const RECORD_BONE = {
  type: 'record',
  using: { title: { type: 'str', descr: 'Titel', required: false } },
  params: {},
}

export default {
  ...createBoneStory(RecordBone, { type: 'record', value: null, bone: RECORD_BONE }),
  title: 'Bones/RecordBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true, value: { title: 'Beispiel' } } }
