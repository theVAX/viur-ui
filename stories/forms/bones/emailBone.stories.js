import EmailBone from '../../../src/forms/bones/emailBone.vue'
import { createBoneStory } from './storyHelpers.js'

export default {
  ...createBoneStory(EmailBone, { type: 'str', value: '' }),
  title: 'Bones/EmailBone',
}

export const Default   = {}
export const WithValue = { args: { value: 'user@example.com' } }
export const Readonly  = { args: { readonly: true, value: 'user@example.com' } }
