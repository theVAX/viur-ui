<template>
  <div
    v-if="Object.keys(formState.structure).length > 0"
    class="wrapper"
  >
    <div
      v-for="column in columns"
      :key="column.side"
      class="column"
      :class="column.side"
    >
      <template
        v-for="boneName in column.bones"
        :key="boneName"
      >
        <slot
          :bone-name="boneName"
          :widget="getBoneWidget(formState.structure[boneName]['type'])"
        ></slot>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from "vue"
import { getBoneWidget } from "../bones/index.js"
import { shownBones } from "./shownBones.js"
const formState = inject("formState")

// Alternating over the shown bones, so a `bones` filter still gives even columns
const columns = computed(() => {
  const bones = shownBones(formState)
  return [
    { side: "left", bones: bones.filter((_, i) => i % 2 === 0) },
    { side: "right", bones: bones.filter((_, i) => i % 2 === 1) },
  ]
})
</script>

<style scoped>
.wrapper {
  padding: 20px;
  display: flex;
  gap: 20px;
  width: 100%;

  .column {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}
</style>
