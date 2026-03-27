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
import { computed, markRaw } from "vue"
import Bone from "../src/forms/bones/bone.vue"
import { getBoneWidget } from "../src/forms/bones/index.js"

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

const boneComponent = computed(() => markRaw(getBoneWidget(props.boneType)))
</script>
