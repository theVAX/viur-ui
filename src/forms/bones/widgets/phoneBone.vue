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
import Utils from "../utils"
import jsonData from "../country_information.json"
import parsePhoneNumber from "libphonenumber-js/min"
import { AsYouType, validatePhoneNumberLength } from "libphonenumber-js/min"
/**
 * Telefonnummer-Eingabefeld mit Ländervorwahl-Auswahl.
 *
 * Rendert ein `<wa-select>` für die Ländervorwahl (Flaggen-Emoji) und ein
 * `<wa-input type="tel">` für die eigentliche Nummer. Die Nummer wird beim
 * Tippen über `libphonenumber-js` formatiert und normalisiert. Der
 * Standard-Ländercode kann über `boneState.bonestructure.default_country_code`
 * gesteuert werden (Standard: `+49`).
 *
 * @displayName PhoneBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets (auf dem inneren `<wa-input>`)
 * @cssClass bone-widget-phone - Kennzeichnet den Bone-Typ (auf dem inneren `<wa-input>`, via Wrapper-Klasse)
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert als internationale Telefonnummer, z.B. `"+49 89 12345678"`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach 600 ms auf das Tel-Input-Element. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Formatierte internationale Telefonnummer
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
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
