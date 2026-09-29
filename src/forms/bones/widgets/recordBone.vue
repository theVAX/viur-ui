<template>
  <Wrapper_nested
    :value="value"
    :name="name"
    :index="index"
    :lang="lang"
    :bone="bone"
    :disabled="bone['readonly']"
    @change="changeEvent"
  ></Wrapper_nested>
</template>

<script setup>
import { reactive, onMounted, inject, computed, getCurrentInstance } from "vue"
import Wrapper_nested from "../BoneNestedWrapper.vue"
/**
 * Record widget for bones of type `record`.
 *
 * Delegates all rendering to `Wrapper_nested`, which renders the sub-bones
 * from `bone.using`. The record value is an object whose keys match the
 * sub-bone names. With `multiple: true`, the value is an array
 * of these objects.
 *
 * @displayName RecordBone
 */
defineOptions({
  inheritAttrs: false,
})

const emit = defineEmits([
  /**
   * Forwarded when `Wrapper_nested` changes a value, or on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {object} value - Current record value (object with sub-bone values)
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current record value; object with sub-bone values, or an array of them with `multiple`. */
  value: null,
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure; `using` contains the sub-bone definitions. */
  bone: Object,
  /** Currently not used. */
  autofocus: Boolean,
})

const state = reactive({})

function changeEvent(data) {
  emit("change", data["name"], data["value"], data["lang"], data["index"])
}

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
