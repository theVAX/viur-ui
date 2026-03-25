import WrapperMultiple from '../../../src/forms/bones/wrapper_multiple.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(WrapperMultiple, { type: 'str', value: [] }),
  title: 'Bones/Wrapper/Multiple',
}

export const Default  = { args: { multiple: true } }
export const Readonly = { args: { multiple: true, readonly: true } }
