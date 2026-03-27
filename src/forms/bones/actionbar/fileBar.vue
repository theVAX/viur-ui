<template>
  <div
    class="actionbar"
    @dragover.prevent="state.droparea = true"
    @dragleave="state.droparea = false"
    @drop.prevent="handleDrop"
  >
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

    <div v-if="state.droparea" class="droparea">Dateien hier hinziehen</div>

    <input ref="uploadinput" hidden type="file" :multiple="boneState.multiple" @change="handleUpload" />
    <wa-button
      v-if="boneState.multiple && !readonly"
      appearance="outlined"
      :title="$t('bone.list')"
      class="add-btn"
      @click="addMultipleEntry(lang)"
    >
      <wa-icon slot="start" name="plus"></wa-icon>
    </wa-button>

    <wa-button
      v-if="boneState.multiple && !readonly"
      variant="success"
      appearance="outlined"
      :title="$t('bone.upload')"
      class="upload-btn"
      @click="uploadinput.click()"
    >
      <wa-icon name="upload"></wa-icon>
      {{ $t("bone.upload") }}
      <wa-spinner v-if="state.loading" slot="end"></wa-spinner>
    </wa-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, ref, computed } from "vue"
import { uploadFile } from "../../../request/index.js"

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
const removeMultipleEntries = null
const uploadinput = ref()
const state = reactive({
  skels: {},
  uploadinput: null,
  loading: false,
  droparea: false,
  hasUsing: computed(() => boneState?.bonestructure["using"]),
})

async function handleUpload(event) {
  state.loading = true
  for (let file of event.target.files) {
    let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
    uploadinput.value.value = null
    let relDefault = null
    if (state.hasUsing) {
      relDefault = undefined
    }
    addMultipleEntry(props.lang, { dest: fileresult, rel: relDefault })
  }
  state.loading = false
}

async function handleDrop(event) {
  state.loading = true
  state.droparea = false
  for (let file of event.dataTransfer.files) {
    let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
    uploadinput.value.value = null
    let relDefault = null
    if (state.hasUsing) {
      relDefault = undefined
    }
    addMultipleEntry(props.lang, { dest: fileresult, rel: relDefault })
  }
  state.loading = false
}

onMounted(() => {
  if (!props.value || props.value.length === 0) {
    emit("change", props.name, [], props.lang) //init
  }
})
</script>

<style scoped>
.actionbar {
  display: flex;
  position: relative;
  flex-wrap: nowrap;
}
wa-combobox {
  width: 100%;
}

.droparea {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
  pointer-events: none;
  opacity: 0.9;
  border: 1px solid var(--sl-color-info-500);
  background-color: var(--sl-color-info-300);
  color: var(--sl-color-info-900);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn {
  margin-left: var(--sl-spacing-x-small);
}

.upload-btn {
  margin-left: auto;
}
</style>
