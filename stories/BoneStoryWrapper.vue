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
import booleanBoneChoose from '../src/forms/bones/booleanBoneChoose.vue'
import booleanBoneSelect from '../src/forms/bones/booleanBoneSelect.vue'
import dateBone from '../src/forms/bones/dateBone.vue'
import selectBone from '../src/forms/bones/selectBone.vue'
import selectBoneChoose from '../src/forms/bones/selectBoneChoose.vue'
import colorBone from '../src/forms/bones/colorBone.vue'
import emailBone from '../src/forms/bones/emailBone.vue'
import fileBone from '../src/forms/bones/fileBone.vue'
import jsonBone from '../src/forms/bones/jsonBone.vue'
import keyBone from '../src/forms/bones/keyBone.vue'
import passwordBone from '../src/forms/bones/passwordBone.vue'
import phoneBone from '../src/forms/bones/phoneBone.vue'
import rawBone from '../src/forms/bones/rawBone.vue'
import codeBone from '../src/forms/bones/codeBone.vue'
import recordBone from '../src/forms/bones/recordBone.vue'
import relationalBone from '../src/forms/bones/relationalBone.vue'
import relationalBoneSelect from '../src/forms/bones/relationalBoneSelect.vue'
import spatialBone from '../src/forms/bones/spatialBone.vue'
import textBone from '../src/forms/bones/textBone.vue'

// Mirrors the resolution logic from src/forms/bones/index.js
function resolveBoneComponent(boneType) {
  if (boneType === 'date' || boneType.startsWith('date.')) return markRaw(dateBone)
  if (boneType === 'key') return markRaw(keyBone)
  if (boneType === 'str.email') return markRaw(emailBone)
  if (boneType === 'str.phone') return markRaw(phoneBone)
  if (boneType === 'str' || boneType.startsWith('str.')) return markRaw(stringBone)
  if (boneType === 'select.choose') return markRaw(selectBoneChoose)
  if (boneType === 'select' || boneType.startsWith('select.')) return markRaw(selectBone)
  if (boneType === 'bool.choose') return markRaw(booleanBoneChoose)
  if (boneType === 'bool.select') return markRaw(booleanBoneSelect)
  if (boneType === 'bool' || boneType.startsWith('bool.')) return markRaw(booleanBone)
  if (boneType === 'password' || boneType.startsWith('password.')) return markRaw(passwordBone)
  if (boneType === 'record' || boneType.startsWith('record.')) return markRaw(recordBone)
  if (boneType === 'numeric' || boneType.startsWith('numeric.')) return markRaw(numericBone)
  if (boneType === 'relational.tree.leaf.file.file' || boneType.startsWith('relational.tree.leaf.file.')) return markRaw(fileBone)
  if (boneType === 'relational.select' || boneType.startsWith('relational.select.')) return markRaw(relationalBoneSelect)
  if (boneType === 'relational' || boneType.startsWith('relational.')) return markRaw(relationalBone)
  if (boneType === 'raw.json') return markRaw(jsonBone)
  if (boneType.startsWith('raw.code.')) return markRaw(codeBone)
  if (boneType === 'color' || boneType.startsWith('color.')) return markRaw(colorBone)
  if (boneType === 'text' || boneType.startsWith('text.')) return markRaw(textBone)
  if (boneType === 'spatial' || boneType.startsWith('spatial.')) return markRaw(spatialBone)
  return markRaw(rawBone)
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

const boneComponent = resolveBoneComponent(props.boneType)
</script>
