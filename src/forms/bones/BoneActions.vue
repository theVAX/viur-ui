<template>
  <template
    v-for="(action, i) in state.actions"
    :key="action.arg + '_' + name + '_' + lang + '_' + i"
  >
    <wa-button
      :disabled="isActionDisabled(action, ctx)"
      size="medium"
      appearance="outlined"
      :variant="action.variant ?? 'neutral'"
      :title="action.title"
      @click="onClick(action)"
    >
      <wa-icon :name="action.icon"></wa-icon>
    </wa-button>

    <action-dialog
      v-if="action.type === 'assistant'"
      :open="action._opened"
      :name="bone?.descr"
      :module="bone?.module"
      :action="action"
      :params="{ name, value, index, lang, bone, boneState }"
      @close="onClose"
      @next="onNext"
    ></action-dialog>
  </template>
</template>

<script setup>
import { reactive, computed, onMounted, inject } from "vue"
import { resolveActions, isActionDisabled, getActionHandler } from "./actions"
import ActionDialog from "./actions/ActionDialog.vue"

const emit = defineEmits(["change"])

const props = defineProps({
  name: String,
  value: [Object, String, Number, Boolean, Array],
  index: Number,
  lang: String,
  bone: Object,
})

const boneState = inject("boneState")

const state = reactive({
  actions: [],
})

const ctx = computed(() => ({
  name: props.name,
  value: props.value,
  index: props.index,
  lang: props.lang,
  bone: props.bone,
  boneState,
  update: (val) => emit("change", props.name, val, props.lang, props.index),
}))

onMounted(() => {
  state.actions = resolveActions(props.bone?.type, props.bone?.params?.actions)
})

function onClick(action) {
  if (action.type === "assistant") {
    action._opened = true
  } else if (action.type === "callback") {
    const handler = getActionHandler(action.arg)
    handler?.(ctx.value)
  }
}

function onClose(val, lang, action) {
  action._opened = false
  if (val) emit("change", props.name, val, lang, props.index)
}

function onNext(val, lang, action) {
  if (val) emit("change", props.name, val, lang, props.index)
}
</script>
