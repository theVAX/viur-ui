import RelationalBoneSelect from '../../../src/forms/bones/relationalBoneSelect.vue'
import { createBoneStory } from './storyHelpers.js'

const RELATIONAL_BONE = { type: 'relational.select', module: 'product', format: '$(name)', params: {} }

export default {
  ...createBoneStory(RelationalBoneSelect, { type: 'relational.select', value: null, bone: RELATIONAL_BONE }),
  title: 'Bones/RelationalBoneSelect',
}

export const Default  = {}
export const Readonly = { args: { readonly: true, value: { dest: { key: 'abc', name: 'Produkt A' } } } }
