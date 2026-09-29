<template>
  <wa-select
    class="bone-widget bone-widget-select bone-widget-select-default"
    :class="[`bone-widget-select-${name}`]"
    :name="name"
    :disabled="boneState.readonly"
    :value="state.value"
    :multiple="boneState['bonestructure']['multiple']"
    max-options-visible="0"
    :required="boneState.bonestructure.required"
    with-clear
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  >
    <wa-option
      v-for="value in convertObjToList()"
      :key="value[0]"
      :value="value[0]"
    >
      {{ value[1] }}
    </wa-option>
  </wa-select>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
/**
 * Dropdown select field for predefined values (type `select`).
 *
 * Renders a `<wa-select>` with `<wa-option>` entries generated from
 * `boneState.bonestructure.values`. `values` can be an array
 * of `[key, label]` tuples or an object `{ key: label }`.
 * With `multiple` enabled, several options can be selected at once.
 * The bone type `select.choose` is handled by the separate component `SelectBoneChoose`
 * and renders radio buttons or checkboxes.
 * With `boneState.label === "placeholder"`, the bone name is shown as a placeholder.
 *
 * @displayName SelectBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-select - Identifies the bone type
 * @cssClass bone-widget-select-default - Default variant (dropdown)
 * @cssClass bone-widget-select-{name} - Dynamically set to the bone name, e.g. `bone-widget-select-status`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value (string, array with multiple). */
  value: null,
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the select element (currently not implemented). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string|string[]} value - Selected value, or array with multiple
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    let val = props.value
    if (Array.isArray(props.value)) {
      if (boneState["bonestructure"]["values"] instanceof Array) {
        val = val.filter((i) => boneState["bonestructure"]["values"].map((i) => i[0].toString()).includes(i))
      } else
        val = val.filter((i) =>
          Object.keys(boneState["bonestructure"]["values"])
            .map((i) => i.toString())
            .includes(i)
        )

      return val.map((i) => i.toString())
    }
    return props.value ? props.value.toString() : ""
  }),
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
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

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, state.value, props.lang, props.index) //init
})
</script>
