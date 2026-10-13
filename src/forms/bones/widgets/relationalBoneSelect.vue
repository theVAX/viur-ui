<template>
  <div
    class="bone-widget-record bone-widget bone-widget-relational bone-widget-relational-select"
    :class="[`bone-widget-relational-${name}`]"
  >
    <div class="bone-widget-single-entry">
      <wa-select
        :disabled="boneState.readonly"
        :value="state.selection?.['dest']?.['key']"
        max-options-visible="0"
        with-clear
        :required="
          boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
        "
        :placeholder="state.placeholder"
        :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
        @change="changeEvent"
      >
        <wa-option
          v-for="(obj, key) in state.skellistdata"
          :key="key"
          :value="key"
        >
          {{ formatString(state.format, obj) }}
        </wa-option>
      </wa-select>
    </div>
    <Wrapper_nested
      v-if="bone['using']"
      :value="value?.['rel']"
      :name="name"
      :index="index"
      :lang="lang"
      :bone="bone"
      :disabled="bone['readonly']"
      @change="changeEventNested"
    ></Wrapper_nested>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
import { useRelationalSource } from "../relationalSource.js"
import Wrapper_nested from "../BoneNestedWrapper.vue"
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
const formatString = inject("formatString")
const state = reactive({
  format: computed(() => {
    return boneState?.bonestructure["format"]
  }),
  skellistdata: null,
  selection: null,
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

const relationalSource = useRelationalSource(boneState, formatString)

async function getList(search) {
  try {
    const items = await relationalSource(search)
    state.skellistdata = Object.fromEntries(items.map((item) => [item.value, item.data]))
    return items
  } catch (error) {
    throw error // no partial option list
  }
}

function changeEvent(event) {
  // a new target keeps the extra fields already entered
  state.selection = { ...state.selection, dest: state.skellistdata[event.target.value] }
  emit("change", props.name, state.selection, props.lang, props.index)
}

function changeEventNested(data) {
  state.selection = { ...state.selection, rel: data["value"] }
  // only send a change if we have a valid target
  if (state.selection.dest) emit("change", data["name"], state.selection, data["lang"], data["index"])
}

onMounted(() => {
  state.selection = props.value
  getList()
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
