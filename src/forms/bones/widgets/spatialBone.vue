<template>
  <wa-input
    v-model="state.valueLat"
    class="bone-widget bone-widget-spatial bone-widget-spatial-default"
    :class="([`bone-widget-spatial-${name}`], [`bone-widget-spatial-${name}-lat`])"
    index="lat"
    type="number"
    :name="name"
    :min="boneState.bonestructure.boundslat[0]"
    :max="boneState.bonestructure.boundslat[1]"
    :disabled="boneState.readonly"
    value-as-number
    step="0.000001"
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  ></wa-input>

  <wa-input
    v-model="state.valueLng"
    class="bone-widget bone-widget-spatial bone-widget-spatial-default"
    :class="([`bone-widget-spatial-${name}`], [`bone-widget-spatial-${name}-long`])"
    index="lng"
    type="number"
    :name="name"
    :min="boneState.bonestructure.boundslng[0]"
    :max="boneState.bonestructure.boundslng[1]"
    :disabled="boneState.readonly"
    value-as-number
    step="0.000001"
    :placeholder="state.placeholder"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @change="changeEvent"
  ></wa-input>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
/**
 * Koordinaten-Eingabe für geografische Punkte (Breitengrad / Längengrad).
 *
 * Rendert zwei `<wa-input type="number">` Felder für Latitude und Longitude.
 * Die erlaubten Wertebereiche werden über `boneState.bonestructure.boundslat`
 * und `boneState.bonestructure.boundslng` gesteuert. Unterstützt weder
 * Mehrsprachigkeit noch Mehrfachwerte.
 *
 * @displayName SpatialBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-spatial - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-spatial-default - Standard-Variante
 * @cssClass bone-widget-spatial-{name}-lat - Dynamisch gesetzt für das Breiten­grad-Feld
 * @cssClass bone-widget-spatial-{name}-long - Dynamisch gesetzt für das Längen­grad-Feld
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert als Array `[lat, lng]` oder Objekt `{ lat, lng }`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key (SpatialBone unterstützt kein multilang). */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach dem Mount auf das erste Input-Element. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {[number, number]} value - Koordinaten als `[lat, lng]`
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  valueLat: null,
  valueLng: null,
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

function changeEvent() {
  emit("change", props.name, [state.valueLat, state.valueLng], props.lang, props.index)
}

onMounted(() => {
  try {
    state.valueLat = props.value[0]
    state.valueLng = props.value[1]
  } catch (e) {}
  emit("change", props.name, [state.valueLat, state.valueLng], props.lang, props.index) //init
})
</script>
<!--<style scoped>
wa-input {
  width: 100%;

  &:first-child {
    margin-bottom: 10px;

    &::part(base) {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-top-right-radius: var(--sl-border-radius-medium);
    }

    @media (max-width: 900px) {
      &::part(base) {
        border-top-right-radius: 0;
      }
    }
  }

  &::part(base) {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}
</style>
-->
