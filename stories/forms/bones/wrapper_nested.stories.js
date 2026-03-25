import WrapperNested from '../../../src/forms/bones/wrapper_nested.vue'
import { createBoneStory } from './storyHelpers.js'

const RECORD_BONE = {
  type: 'record',
  using: { title: { type: 'str', descr: 'Titel', required: false } },
  params: {},
}

export default {
  ...createBoneStory(WrapperNested, { type: 'record', value: null, bone: RECORD_BONE }),
  title: 'Bones/Wrapper/Nested',
}

export const Default  = {}
export const Readonly = { args: { readonly: true } }
