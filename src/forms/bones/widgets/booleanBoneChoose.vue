<template>
  <wa-radio-group
    :value="state.value"
    class="bone-widget bone-widget-boolean bone-widget-boolean-choose"
    :class="[`bone-widget-boolean-${name}`]"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  >
    <wa-radio
      :value="'true'"
      :disabled="boneState.readonly"
    >
      {{ $t("bones.bool.true") }}
    </wa-radio>
    <wa-radio
      :value="'false'"
      :disabled="boneState.readonly"
    >
      {{ $t("bones.bool.false") }}
    </wa-radio>
  </wa-radio-group>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  name: String,
  value: [Object, String, Number, Boolean, Array],
  index: Number,
  lang: String,
  bone: Object,
  autofocus: Boolean,
})

const emit = defineEmits(["change"])
const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    return "" + ![false, null, undefined, "", "false"].includes(props.value)
  }),
})

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  let val = props.value
  if (!val) {
    val = false
  }
  emit("change", props.name, val, props.lang, props.index) //init
})
</script>
