<template>
  <div class="bone-row">
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
      />
    </div>
    <bone-actions
      v-if="boneactions"
      :value="bonevalue"
      :name="name"
      :index="null"
      :bone="bonestructure"
      @change="updateValue"
    />
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
  boneactions: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
})

const updateValue = inject("updateValue")
</script>
