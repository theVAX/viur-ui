<template>
  <div
    class="record widget-bone widget-bone-relational widget-bone-relational-select"
    :class="[`widget-bone-relational-${name}`]"
  >
    <div class="single-entry">
      <wa-select
        :disabled="boneState.readonly"
        :value="state.selection?.['dest']['key']"
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
      :value="value"
      :name="name"
      :index="index"
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
  emit("change", props.name, state.selection, props.lang, props.index)
}

function changeEventNested(data) {
  state.selection = { ...state.selection, rel: data["value"] }
  emit("change", data["name"], state.selection, data["lang"], data["index"])
}

onMounted(() => {
  state.selection = props.value
  getList()
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
