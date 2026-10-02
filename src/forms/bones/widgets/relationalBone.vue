<template>
  <div
    class="bone-widget-record bone-widget bone-widget-relational bone-widget-relational-default"
    :class="[`bone-widget-relational-${name}`]"
  >
    <div class="bone-widget-single-entry">
      <wa-input
        v-if="state.selection?.['dest']?.['key']"
        :disabled="true"
        :value="value ? formatString(state.format, state.selection) : ''"
      ></wa-input>
      <wa-combobox
        v-else
        :disabled="boneState.readonly"
        :source="getList"
        :placeholder="state.placeholder"
        :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
        @change="changeEvent"
      ></wa-combobox>
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
import { reactive, onMounted, inject, computed, watch } from "vue"
import { useRelationalSource } from "../relationalSource.js"
import Wrapper_nested from "../BoneNestedWrapper.vue"
/**
 * Relational selection widget for bones of type `relational` and `relational.select`.
 *
 * For type `relational`, a `<wa-combobox>` is shown that loads and filters
 * entries from the configured `module` via `getList`. If a value is set,
 * a locked `<wa-input>` with the formatted entry is shown instead.
 * For type `relational.select`, a dropdown widget is rendered.
 * If the structure contains a `using` object, a `Wrapper_nested`
 * is additionally shown for the relational extra fields (`rel`).
 *
 * @displayName RelationalBone
 *
 * @cssClass bone-widget-record - Outer container of the widget
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-relational - Identifies the bone type
 * @cssClass bone-widget-relational-default - Default variant
 * @cssClass bone-widget-relational-{name} - Dynamically set to the bone name
 * @cssClass bone-widget-single-entry - Row with combobox/input
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value; object with `dest` and `rel` keys, or `null`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure; `using` controls whether a nested wrapper is shown. */
  bone: Object,
  /** Currently not used. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired when an entry is selected, when cleared, and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {{ dest: object, rel: object|null }|string} value - Selected relational object, or `""` when cleared
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])

const boneState = inject("boneState")
const formatString = inject("formatString")
const state = reactive({
  format: computed(() => {
    return boneState?.bonestructure["format"]
  }),
  skellistdata: null,
  selection: null,
  relationalData: null,
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
    throw error // no partial list; wa-combobox then shows no suggestions
  }
}

function changeEvent(event) {
  state.selection = { dest: state.skellistdata[event.target.value] }
  if (props.bone["using"] && state.relationalData) {
    state.selection = { ...state.selection, rel: state.relationalData }
  }
  emit("change", props.name, state.selection, props.lang, props.index)
}

function changeEventNested(data) {
  state.relationalData = data["value"]
  if (state.selection?.dest) {
    // only send a change if we have a valid target
    state.selection = { ...props.value, rel: data["value"] }
    emit("change", data["name"], state.selection, data["lang"], data["index"])
  }
}

// Keep state.selection in sync with props.value — important when the value
// is cleared from outside (e.g. via the delete action).
watch(
  () => props.value,
  (newVal) => {
    state.selection = newVal || null
  }
)

onMounted(() => {
  state.selection = props.value
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
