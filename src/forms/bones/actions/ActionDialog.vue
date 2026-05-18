<template>
  <teleport
    v-if="open"
    to="body"
  >
    <wa-dialog
      open
      :label="action.name + (name ? ' - ' + name : '')"
      class="bone-action-dialog"
      @wa-after-hide="emit('close', null, null, action)"
    >
      <component
        :is="component"
        v-if="component"
        :name="name"
        :module="module"
        :tab-id="tabId"
        :action="action"
        :params="params"
        @close="(val, lang) => emit('close', val ?? null, lang ?? null, action)"
        @next="(val, lang) => emit('next', val ?? null, lang ?? null, action)"
      ></component>
    </wa-dialog>
  </teleport>
</template>

<script setup>
import { computed } from "vue"
import { getActionComponent } from "./index"

const props = defineProps({
  open: Boolean,
  name: String,
  module: String,
  tabId: String,
  params: Object,
  action: Object,
})

const emit = defineEmits(["close", "next"])
const component = computed(() => getActionComponent(props.action?.arg))
</script>

<style scoped>
.bone-action-dialog {
  --width: 85%;

  &::part(body) {
    display: contents;
  }

  &::part(base) {
    position: absolute;
    height: 100%;
  }

  &::part(panel) {
    margin-bottom: 40px;
    max-width: 1400px;
  }

  &::part(footer) {
    padding: var(--sl-spacing-small);
  }

  &::part(overlay) {
    position: absolute;
  }
}
</style>
