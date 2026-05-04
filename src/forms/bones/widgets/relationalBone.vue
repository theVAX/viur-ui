<template>
  <div
    class="record widget-bone widget-bone-relational widget-bone-relational-default"
    :class="[`widget-bone-relational-${name}`]"
  >
    <div class="single-entry">
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

      <wa-button
        v-if="!boneState.multiple && !boneState.isEmpty"
        variant="danger"
        appearance="outlined"
        :title="$t('bone.del')"
        class="delete-btn square-btn"
        @click="
          () => {
            $emit('change', name, '', lang, index)
            state.selection = null
          }
        "
      >
        <wa-icon slot="start" name="xmark"></wa-icon>
      </wa-button>
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
import { useListFetch } from "../../../request/index.js"
import Wrapper_nested from "../wrapper_nested.vue"
/**
 * Relational-Auswahl-Widget für Bones vom Typ `relational` und `relational.select`.
 *
 * Beim Typ `relational` wird eine `<wa-combobox>` angezeigt, die via `getList`
 * Einträge aus dem konfigurierten `module` lädt und filtert. Ist ein Wert gesetzt,
 * wird stattdessen ein gesperrtes `<wa-input>` mit dem formatierten Eintrag angezeigt.
 * Beim Typ `relational.select` wird ein Dropdown-Widget gerendert.
 * Falls die Struktur ein `using`-Objekt enthält, wird zusätzlich ein `Wrapper_nested`
 * für die relationalen Zusatz-Felder (`rel`) eingeblendet.
 *
 * @displayName RelationalBone
 *
 * @cssClass record - Äußerer Container des Widgets
 * @cssClass widget-bone - Basis-Klasse aller Bone-Widgets
 * @cssClass widget-bone-relational - Kennzeichnet den Bone-Typ
 * @cssClass widget-bone-relational-default - Standard-Variante
 * @cssClass widget-bone-relational-{name} - Dynamisch gesetzt auf den Bone-Namen
 * @cssClass single-entry - Zeile mit Combobox/Input und Löschen-Button
 * @cssClass delete-btn - Löschen-Schaltfläche (nur bei `multiple: false` und gesetztem Wert)
 * @cssClass square-btn - Quadratische Schaltflächen-Variante
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert; Objekt mit `dest`- und `rel`-Schlüsseln oder `null`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur; `using` steuert ob ein Nested-Wrapper angezeigt wird. */
  bone: Object,
  /** Aktuell nicht genutzt. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei Auswahl eines Eintrags, beim Löschen und beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {{ dest: object, rel: object|null }|string} value - Ausgewähltes Relational-Objekt oder `""` beim Löschen
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
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

async function getList(search) {
  let params = { limit: 99 }
  if (boneState.bonestructure["type"] === "relational.tree.leaf.file") {
    params.skelType = "leaf"
  } else if (boneState.bonestructure["type"] === "relational.tree.node.file") {
    params.skelType = "node"
  }

  const listFetch = useListFetch(boneState.bonestructure["module"], {
    immediate: false,
    params,
    renderer: import.meta.env.VITE_DEFAULT_RENDERER || "vi",
  })

  await listFetch.execute()

  //?viurTags$lk=${search.toLowerCase()
  const data = { skellist: listFetch.data.value }

  state.skellistdata = {}
  for (let e of data["skellist"]) {
    state.skellistdata[e["key"]] = e
  }

  return data["skellist"]?.map((d) => {
    return { text: formatString(boneState.bonestructure["format"], { dest: d }), value: d.key, data: d }
  })
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

onMounted(() => {
  state.selection = props.value
  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>

<style scoped>
.single-entry {
  display: flex;
  gap: var(--sl-spacing-x-small);

  :deep(wa-combobox) {
    &::part(input__base) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}

wa-input {
  width: 100%;

  &::part(base) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  &::part(base) {
    background-color: var(--sl-color-neutral-0);
  }
}
wa-combobox {
  width: 100%;

  &::part(input) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    & :deep(&::part(base)) {
      border: 1px solid red;
    }
  }
}
</style>
