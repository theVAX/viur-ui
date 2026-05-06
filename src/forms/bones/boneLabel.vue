<template>
  <label class="bone-name label-bone">
    <slot v-if="!debug"></slot>
    <wa-tooltip
      v-else
      :for="tooltipTargetId"
      :content="name"
    ></wa-tooltip>
    <span
      v-if="debug"
      :id="tooltipTargetId"
    >
      <slot></slot>
    </span>
    <template v-if="debug">
      <div
        class="debug"
        @click="state.debug = !state.debug"
      >
        <wa-icon name="bug"></wa-icon>
      </div>
    </template>
  </label>

  <wa-dialog
    v-if="state.debug"
    open
    :label="name"
    @wa-after-hide="state.debug = false"
  >
    <pre>
        {{ boneState }}
      </pre
    >
  </wa-dialog>
</template>

<script setup>
import { reactive, inject, computed, unref } from "vue"
import { buildBoneDomId } from "./utils"
const props = defineProps({
  name: String,
  value: Object,
  index: Number,
  lang: String,
  readonly: Boolean,
  params: Object,
  debug: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["change", "handleClick"])

const boneState = inject("boneState")
const bonePath = inject("bonePath", [])
const tooltipTargetId = computed(() => buildBoneDomId(unref(bonePath) ?? [], "debug-label"))
const state = reactive({
  debug: false,
})
</script>

<style scoped>
@layer foundation.form {
  .bone-name {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: flex-start;
    font-size: var(--wa-input-font-size-medium);
    min-height: var(--wa-input-height-medium);
    padding: 0.4em 0.7em;
    color: var(--sl-color-neutral-900);
    background-color: var(--sl-color-neutral-200);
    border: none;
    border-top-left-radius: var(--wa-input-border-radius-medium);
    border-bottom-left-radius: var(--wa-input-border-radius-medium);
    word-break: break-word;

    @media (max-width: 900px) {
      border-top-right-radius: var(--wa-input-border-radius-medium);
      border-bottom-left-radius: 0;
    }
  }

  .debug {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding-left: 0.4em;

    & wa-icon {
      background-color: var(--sl-color-danger-500);
      color: #fff;
      padding: 0.4em;
      border-radius: 50%;
      font-size: 0.55em;
    }
  }
}
</style>
