<template>
  <div class="actionbar">
    <wa-button
      v-if="boneState.multiple && !readonly"
      variant="danger"
      :title="$t('bone.del')"
      appearance="outlined"
      class="delete-btn"
      @click="openSelector()"
    >
      <wa-icon slot="start" name="xmark"></wa-icon>
    </wa-button>

    <wa-combobox
      :source="getList"
      @change="
        addMultipleEntry(lang, {
          dest: state.skels?.[$event.target.value],
          rel: state.hasUsing ? undefined : null,
        })
      "
    ></wa-combobox>

    <wa-button
      v-if="boneState.multiple && !readonly"
      variant="success"
      :title="$t('bone.add')"
      appearance="outlined"
      class="add-btn"
      @click="addMultiple"
    >
      <wa-icon slot="start" name="plus"></wa-icon>
      {{ $t("bone.addEmpty") }}
    </wa-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, computed } from "vue"
import { useListFetch } from "../../../request/index.js"

const props = defineProps({
  name: String,
  value: Object,
  index: Number,
  lang: String,
  readonly: Boolean,
  params: Object,
})

const emit = defineEmits(["change"])

const boneState = inject("boneState")
const addMultipleEntry = inject("addMultipleEntry")
const formatString = inject("formatString")
const removeMultipleEntries = null
const state = reactive({
  skels: {},
  hasUsing: computed(() => boneState?.bonestructure["using"]),
})

async function getList(search) {
  let params = { limit: 99 }
  if (boneState.bonestructure["type"].startsWith("relational.tree.leaf")) {
    params.skelType = "leaf"
  } else if (boneState.bonestructure["type"].startsWith("relational.tree.node")) {
    params.skelType = "node"
  }
  const listFetch = useListFetch(boneState.bonestructure["module"], {
    immediate: false,
    params,
    renderer: import.meta.env.VITE_DEFAULT_RENDERER || "vi",
  })

  await listFetch.execute()

  //?viurTags$lk=${search.toLowerCase()}
  const data = { skellist: listFetch.data.value }
  state.skels = data["skellist"].reduce((acc, curr) => ((acc[curr["key"]] = curr), acc), {})

  return data["skellist"]?.map((d) => {
    return { text: formatString(boneState.bonestructure["format"], { dest: d }), value: d.key, data: d }
  })
}

onMounted(() => {
  if (!props.value || props.value.length === 0) {
    emit("change", props.name, [], props.lang) //init
  }
})

function addMultiple() {
  let relDefault = null
  if (state.hasUsing) {
    relDefault = undefined
  }
  addMultipleEntry(props.lang, { dest: {}, rel: relDefault })
}
</script>

<style scoped>
.actionbar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

wa-combobox {
  width: 100%;
}

.delete-btn {
  margin-right: var(--sl-spacing-x-small);
}

.add-btn {
  margin-left: var(--sl-spacing-x-small);
}
</style>
