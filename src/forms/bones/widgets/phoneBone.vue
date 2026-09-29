<template>
  <wa-spinner v-if="state.loading"></wa-spinner>
  <div
    v-else
    class="wa-flank wa-gap-xs bone-widget-input-wrapper"
  >
    <wa-select
      :value="state.dialCode"
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
      @change="handleSelect"
    >
      <wa-option
        v-for="country in state.countryInfo"
        :key="country.currentCode"
        :value="country.dialCode"
      >
        {{ country.emoji }}
      </wa-option>
    </wa-select>
    <wa-input
      ref="phoneBone"
      type="tel"
      :disabled="boneState.readonly"
      :value="Utils.unescape(state.value)"
      :required="
        boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
      "
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
      @change="changeEvent"
    ></wa-input>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, computed, watchEffect, ref } from "vue"
import { useTimeoutFn } from "@vueuse/core"
import Utils from "../utils.js"
import jsonData from "../country_information.json"
import parsePhoneNumber from "libphonenumber-js/min"
import { AsYouType, validatePhoneNumberLength } from "libphonenumber-js/min"
/**
 * Phone number input field with country code selection.
 *
 * Renders a `<wa-select>` for the country code (flag emoji) and a
 * `<wa-input type="tel">` for the actual number. The number is formatted and
 * normalized via `libphonenumber-js` while typing. The
 * default country code can be controlled via `boneState.bonestructure.default_country_code`
 * (default: `+49`).
 *
 * @displayName PhoneBone
 *
 * @cssClass bone-widget - Base class of all bone widgets (on the inner `<wa-input>`)
 * @cssClass bone-widget-phone - Identifies the bone type (on the inner `<wa-input>`, via wrapper class)
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value as an international phone number, e.g. `"+49 89 12345678"`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the tel input element after 600 ms. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string} value - Formatted international phone number
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() =>
    props.value
      ? parsePhoneNumber(state.reference, getCountry(state.dialCode)).formatInternational()
      : state.dialCode + ""
  ),
  loading: false,
  reference: computed(() => parsePhoneNumber(props.value, getCountry(state.dialCode)).formatNational()),
  country: computed(() => getCountry(state.dialCode)),
  dialCode: "",
  countryInfo: [],
})

const countryInformation = ref(jsonData)
const phoneBone = ref(null)

function changeEvent(event) {
  if (!event.target.value) {
    emit("change", props.name, "", props.lang, props.index)
    return
  }
  if (event.target.value.length > 4) {
    const number = parsePhoneNumber(event.target.value, state.country)
    const valueFormatter = new AsYouType()

    let value = valueFormatter.input(number ? number.number : event.target.value)
    state.dialCode = "+" + number?.countryCallingCode
    emit("change", props.name, value, props.lang, props.index)
    return
  } else return
}

watchEffect(() => {
  if (phoneBone.value && phoneBone.value !== null && phoneBone.value !== null) {
    if (props.autofocus) {
      const { start } = useTimeoutFn(() => {
        phoneBone.value.focus()
      }, 600)

      start()
    }
  }
})

function handleSelect(e) {
  state.dialCode = e.target.value
  changeEvent({ target: { value: state.value } })
}

function getCountry(dialCode) {
  let result = state.countryInfo.filter((country) => country.dialCode === dialCode)
  result = result[0] ? result[0].code : "DE"
  return result
}

function getDefaultCode() {
  let defaultDialCode = boneState.bonestructure.default_country_code
    ? boneState.bonestructure.default_country_code
    : "+49"

  state.dialCode = defaultDialCode
}

function getCode(value) {
  if (!value) return boneState.bonestructure.default_country_code ? boneState.bonestructure.default_country_code : "+49"
  return "+" + parsePhoneNumber(value).countryCallingCode
}

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
  state.loading = true
  countryInformation.value.forEach((country) => {
    let temp = {}
    temp.name = country.name
    temp.code = country.code
    temp.emoji = country.emoji
    temp.dialCode = country.dialCodes ? country.dialCodes[0] : ""
    state.countryInfo.push(temp)
  })
  state.loading = false
  state.dialCode = getCode(props.value)
  // let available_countries = []
})
</script>
<style scoped>
wa-select {
  width: 6rem;
}
</style>
