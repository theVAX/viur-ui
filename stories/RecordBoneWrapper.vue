<template>
  <div style="padding: 1rem; max-width: 800px">
    <Bone
      :is="recordBone"
      :name="boneName"
      :structure="structure"
      :skel="skel"
      :errors="errors"
      :languages="languages"
      @change="logEvent('change', $event)"
      @change-internal="logEvent('change-internal', $event)"
      @handle-click="logEvent('handleClick', $event)"
    />
  </div>
</template>

<script setup>
import { provide, markRaw } from "vue"
import { logEvent } from "histoire/client"
import { createMainformState } from "./mocks/mainformState.js"
import Bone from "../src/forms/bones/bone.vue"
import recordBone from "../src/forms/bones/widgets/recordBone.vue"

const props = defineProps({
  boneName: {
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
  languages: {
    type: Array,
    default: null,
  },
})

provide("mainformState", createMainformState(props.skel))
</script>
