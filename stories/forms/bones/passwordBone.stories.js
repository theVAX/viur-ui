import PasswordBone from '../../../src/forms/bones/passwordBone.vue'
import { createBoneStory } from './storyHelpers.js'

const PASSWORD_BONE = { type: 'password', tests: [], test_threshold: 0 }

export default {
  ...createBoneStory(PasswordBone, { type: 'password', value: '', bone: PASSWORD_BONE }),
  title: 'Bones/PasswordBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true } }
