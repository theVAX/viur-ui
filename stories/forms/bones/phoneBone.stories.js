import PhoneBone from '../../../src/forms/bones/phoneBone.vue'
import { createBoneStory } from './storyHelpers.js'

const PHONE_BONE = { type: 'str', default_country_code: '+49' }

export default {
  ...createBoneStory(PhoneBone, { type: 'str', value: '', bone: PHONE_BONE }),
  title: 'Bones/PhoneBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true } }
