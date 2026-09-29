<template>
  <wa-select
    :disabled="boneState.readonly"
    :value="state.value"
    max-options-visible="0"
    class="bone-widget bone-widget-boolean bone-widget-boolean-select"
    :class="[`bone-widget-boolean-${name}`]"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  >
    <!-- String-Werte: wa-select gleicht seinen Wert beim Setzen mit den
         Options-Werten ab; boolesche werden erst später zu Strings, der
         gespeicherte Wert erschiene dann nicht -->
    <wa-option
      v-for="val in ['true', 'false']"
      :key="val"
      :value="val"
    >
      {{ $t(`bones.bool.${val}`) }}
    </wa-option>
  </wa-select>
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
