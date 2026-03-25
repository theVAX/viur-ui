import RelationalBone from '../../../src/forms/bones/relationalBone.vue'
import { createBoneStory } from './storyHelpers.js'

const RELATIONAL_BONE = { type: 'relational', module: 'product', format: '$(name)', params: {} }

export default {
  ...createBoneStory(RelationalBone, { type: 'relational', value: null, bone: RELATIONAL_BONE }),
  title: 'Bones/RelationalBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true, value: { dest: { key: 'abc', name: 'Produkt A' } } } }
