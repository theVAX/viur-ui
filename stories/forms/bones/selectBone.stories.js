import SelectBone from '../../../src/forms/bones/selectBone.vue'
import { createBoneStory } from './storyHelpers.js'

const SELECT_BONE = { type: 'select', values: { opt_a: 'Option A', opt_b: 'Option B', opt_c: 'Option C' } }

export default {
  ...createBoneStory(SelectBone, { type: 'select', value: null, bone: SELECT_BONE }),
  title: 'Bones/SelectBone',
}

export const Default  = {}
export const Selected = { args: { value: 'opt_a' } }
export const Readonly = { args: { readonly: true, value: 'opt_b' } }
