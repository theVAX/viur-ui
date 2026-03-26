<template>
  <div style="padding: 1rem; max-width: 800px">
    <Bone
      :is="boneComponent"
      :name="boneName"
      :structure="structure"
      :skel="skel"
      :errors="errors"
      :label="label"
      :languages="languages"
    />
  </div>
</template>

<script setup>
import { markRaw } from 'vue'
import Bone from '../src/forms/bones/bone.vue'
import stringBone from '../src/forms/bones/stringBone.vue'
import numericBone from '../src/forms/bones/numericBone.vue'
import booleanBone from '../src/forms/bones/booleanBone.vue'
import dateBone from '../src/forms/bones/dateBone.vue'
import selectBone from '../src/forms/bones/selectBone.vue'
import rawBone from '../src/forms/bones/rawBone.vue'

const BONE_COMPONENTS = {
  str: markRaw(stringBone),
  numeric: markRaw(numericBone),
  bool: markRaw(booleanBone),
  date: markRaw(dateBone),
  select: markRaw(selectBone),
}

const props = defineProps({
  boneName: {
    type: String,
    required: true,
  },
  boneType: {
    type: String,
    required: true,
  },
  structure: {
    type: Object,
    required: true,
  },
  skel: {
    type: Object,
    default: () => ({}),
  },
  errors: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'normal',
  },
  languages: {
    type: Array,
    default: null,
  },
})

const boneComponent = BONE_COMPONENTS[props.boneType] ?? markRaw(rawBone)
</script>
