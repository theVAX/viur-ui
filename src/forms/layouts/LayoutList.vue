<template>
  <div
    v-if="Object.keys(formState.structure).length > 0"
    class="wrapper"
  >
    <template
      v-for="boneName in shownBones(formState)"
      :key="boneName"
    >
      <slot
        :bone-name="boneName"
        :widget="getBoneWidget(formState.structure[boneName]['type'])"
      ></slot>
    </template>
  </div>
</template>

<script setup>
import { inject } from "vue"
import { getBoneWidget } from "../bones/index.js"
import { shownBones } from "./shownBones.js"
const formState = inject("formState")
</script>

<style scoped>
.wrapper {
  padding: 20px;
}
</style>
