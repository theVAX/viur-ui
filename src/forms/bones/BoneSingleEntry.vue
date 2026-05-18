<template>
  <div class="wa-flank:end bone-row wa-gap-xs wa-align-items-start">
    <div class="bone-block">
      <component
        :is="is"
        :value="bonevalue"
        :name="name"
        :index="null"
        :lang="lang"
        :bone="bonestructure"
        :autofocus="autofocus"
        @change="updateValue"
        @keypress.enter="updateValue"
      ></component>
    </div>
    <div
      v-if="boneactions && boneState?.hasActions"
      class="wa-cluster wa-gap-xs"
    >
      <bone-actions
        :value="bonevalue"
        :name="name"
        :index="null"
        :bone="bonestructure"
        @change="updateValue"
      ></bone-actions>
    </div>
  </div>
</template>

<script setup>
import { inject } from "vue"
import BoneActions from "./BoneActions.vue"

const props = defineProps({
  is: { type: Object, required: true },
  name: { type: String, required: true },
  lang: { type: String, default: null },
  bonevalue: { default: null },
  bonestructure: { type: Object, required: true },
  boneactions: { type: Boolean, default: true },
  autofocus: { type: Boolean, default: false },
})

const updateValue = inject("updateValue")
const boneState = inject("boneState")
</script>
