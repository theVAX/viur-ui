import CodeBone from '../../../src/forms/bones/codeBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(CodeBone, { type: 'raw.code.javascript', value: '' }),
  title: 'Bones/CodeBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true, value: 'const x = 1;' } }
