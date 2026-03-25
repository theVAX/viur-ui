import SpatialBone from '../../../src/forms/bones/spatialBone.vue'
import { createBoneStory } from './storyHelpers.js'

const SPATIAL_BONE = { type: 'spatial', boundslat: [-90, 90], boundslng: [-180, 180] }

export default {
  ...createBoneStory(SpatialBone, { type: 'spatial', value: null, bone: SPATIAL_BONE }),
  title: 'Bones/SpatialBone',
}

export const Default  = {}
export const Readonly = { args: { readonly: true } }
