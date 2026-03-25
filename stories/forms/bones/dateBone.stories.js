import DateBone from '../../../src/forms/bones/dateBone.vue'
import { createBoneStory } from './storyHelpers.js'

const DATE_BONE = { type: 'date', date: true, time: false }

export default {
  ...createBoneStory(DateBone, { type: 'date', value: null, bone: DATE_BONE }),
  title: 'Bones/DateBone',
}

export const Default  = {}
export const WithDate = { args: { value: '2026-03-25' } }
export const Readonly = { args: { readonly: true, value: '2026-03-25' } }
