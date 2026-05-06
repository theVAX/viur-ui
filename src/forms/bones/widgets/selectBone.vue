<template>
  <wa-select
    class="widget-bone widget-bone-select widget-bone-select-default"
    :class="[`widget-bone-select-${name}`]"
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
 * Dropdown-Auswahlfeld für vordefinierte Werte (Typ `select`).
 *
 * Rendert ein `<wa-select>` mit `<wa-option>`-Einträgen, die aus
 * `boneState.bonestructure.values` generiert werden. `values` kann ein Array
 * von `[key, label]`-Tupeln oder ein Objekt `{ key: label }` sein.
 * Bei aktiviertem `multiple` können mehrere Optionen gleichzeitig gewählt werden.
 * Der Bone-Typ `select.choose` wird durch die separate Komponente `SelectBoneChoose`
 * abgehandelt und rendert Radio-Buttons bzw. Checkboxen.
 * Bei `boneState.label === "placeholder"` wird der Bone-Name als Placeholder angezeigt.
 *
 * @displayName SelectBone
 *
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-select - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-select-default - Standard-Variante (Dropdown)
 * @cssClass widget-bone-select-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `widget-bone-select-status`
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert (String, Array bei multiple). */
  value: null,
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus auf das Select-Element (aktuell nicht implementiert). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string|string[]} value - Gewählter Wert oder Array bei multiple
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
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

<style scoped>
wa-select {
  width: 100%;

  &::part(combobox) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  @media (max-width: 900px) {
    &::part(combobox) {
      border-top-right-radius: 0;
      border-bottom-left-radius: var(--sl-border-radius-medium);
    }
  }
}

wa-option {
  &::part(base) {
    transition: background-color ease 0.3s;
  }

  &:hover {
    &::part(base) {
      background-color: var(--sl-color-gray-200);
    }
  }
}
</style>
