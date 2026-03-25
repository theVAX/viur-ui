import SelectBoneChoose from '../../../src/forms/bones/selectBoneChoose.vue'
import { createBoneStory } from './storyHelpers.js'

const SELECT_BONE = { type: 'select', values: { opt_a: 'Option A', opt_b: 'Option B', opt_c: 'Option C' } }

export default {
  ...createBoneStory(SelectBoneChoose, { type: 'select', value: null, bone: SELECT_BONE }),
  title: 'Bones/SelectBoneChoose',
}

export const Default  = {}
export const Selected = { args: { value: 'opt_a' } }
export const Readonly = { args: { readonly: true, value: 'opt_b' } }
