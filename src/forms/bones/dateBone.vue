<template>
  <wa-input
    class="widget-bone widget-bone-date widget-bone-date-default"
    :class="[`widget-bone-date-${name}`]"
    :disabled="boneState.readonly"
    :type="state.typeString"
    :name="name"
    :value="state.value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    step="1"
    @change="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, computed, inject } from "vue"
/**
 * Datums- und/oder Zeitfeld, gesteuert durch `bonestructure.date` und `bonestructure.time`.
 *
 * Rendert ein `<wa-input>` mit dem passenden `type`-Attribut:
 * - `date` wenn nur `date: true`
 * - `time` wenn nur `time: true`
 * - `datetime-local` wenn beide gesetzt sind
 *
 * Bereinigt Zeitzonendaten aus dem Wert, bevor er ans Input weitergegeben wird.
 * Unterstützt mehrfache Werte (`multiple`), aber keine Mehrsprachigkeit.
 *
 * @displayName DateBone
 *
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-date - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-date-default - Standard-Variante
 * @cssClass widget-bone-date-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `widget-bone-date-publishedAt`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert als ISO-String, z.B. `"2026-03-28"` oder `"10:30:00"`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach 600 ms auf das Input-Element. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Eingabewert als ISO-String
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: computed(() => {
    // remove timezone data if timed

    let boneValue = props.value
    if (props.value && boneState.bonestructure["time"] && boneState.bonestructure["date"]) {
      boneValue = props.value?.split("+")[0]
    } else if (props.value && boneState.bonestructure["time"] && props.value.includes("T")) {
      boneValue = props.value?.split("+")[0]?.split("T")[1]
    } else if (props.value && props.value.includes("T")) {
      //convert to readable value
      boneValue = new Date(props.value).toISOString().substr(0, 10)
    }

    return boneValue
  }),
  typeString: computed(() => {
    // Calculate the correct datetype String
    let typeString = "datetime-local"
    if (!boneState.bonestructure["time"]) {
      typeString = "date"
    }

    if (!boneState.bonestructure["date"]) {
      typeString = "time"
    }
    return typeString
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

function changeEvent(event) {
  emit("change", props.name, event.target.value, props.lang, props.index)
}

onMounted(() => {
  emit("change", props.name, state.value, props.lang, props.index) //init
})
</script>

<style scoped>
wa-input {
  width: 100%;

  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  @media (max-width: 900px) {
    &::part(base) {
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--sl-border-radius-medium);
    }
  }
}
</style>
