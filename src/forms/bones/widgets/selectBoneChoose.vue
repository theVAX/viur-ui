<template>
  <div
    v-if="boneState['bonestructure']['multiple']"
    class="bone-widget-multiple-wrapper bone-widget bone-widget-select bone-widget-select-choose"
    :class="[`bone-widget-select-${name}`]"
  >
    <wa-checkbox
      v-for="value in convertObjToList()"
      :key="value[0]"
      :data-value="value[0]"
      :checked="state.value.includes(String(value[0]))"
      :disabled="boneState.readonly"
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
      @change="changeEventMultiple"
    >
      {{ value[1] }}
    </wa-checkbox>
  </div>

  <!-- readonly on the group (see booleanBoneChoose): disabled radios
       would show no selection -->
  <wa-radio-group
    v-else
    :value="state.value"
    :disabled="boneState.readonly"
    class="bone-widget bone-widget-select bone-widget-select-choose"
    :class="[`bone-widget-select-${name}`]"
    @change="changeEvent"
  >
    <wa-radio
      v-for="value in convertObjToList()"
      :key="value[0]"
      :value="value[0]"
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    >
      {{ value[1] }}
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
  value: null,
  index: Number,
  lang: String,
  bone: Object,
  autofocus: Boolean,
})

const emit = defineEmits(["change"])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    // The options carry string keys: compare as strings, numeric keys (1 vs "1") included
    if (Array.isArray(props.value)) {
      const keys = convertObjToList().map((entry) => String(entry[0]))
      return props.value.map(String).filter((key) => keys.includes(key))
    }
    return props.value == null ? "" : String(props.value)
  }),
})

function convertObjToList() {
  if (Array.isArray(boneState["bonestructure"]["values"])) {
    return boneState["bonestructure"]["values"]
  } else {
    let objToList = []
    for (const [key, value] of Object.entries(boneState["bonestructure"]["values"])) {
      objToList.push([key, value])
    }
    return objToList
  }
}

function changeEventMultiple(event) {
  let currentValue = [...state.value]
  if (event.target.checked) {
    currentValue.push(event.target.dataset["value"])
  } else {
    currentValue = currentValue.filter((x) => x !== event.target.dataset["value"])
  }
  emit("change", props.name, currentValue, props.lang, props.index)
}

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, state.value, props.lang, props.index) //init
})
</script>
