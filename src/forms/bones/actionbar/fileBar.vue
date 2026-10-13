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
      :title="$t('bone.delAll')"
      appearance="outlined"
      class="delete-btn"
      @click="removeMultipleEntries(lang)"
    >
      <wa-icon
        slot="start"
        name="xmark"
      ></wa-icon>
    </wa-button>

    <div
      v-if="state.droparea"
      class="droparea"
    >
      {{ t("bone.dragFile") }}
    </div>

    <input
      ref="uploadinput"
      hidden
      type="file"
      :multiple="boneState.multiple"
      @change="handleUpload"
    />
    <wa-button
      v-if="boneState.multiple && !readonly"
      appearance="outlined"
      :title="$t('bone.list')"
      class="add-btn"
      @click="addMultipleEntry(lang)"
    >
      <wa-icon
        slot="start"
        name="plus"
      ></wa-icon>
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
      <wa-spinner
        v-if="state.loading"
        slot="end"
      ></wa-spinner>
    </wa-button>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
import { reactive, onMounted, inject, ref, computed } from "vue"
import { uploadFile } from "../../../request/index.js"
import { notify, requestMessage } from "../../../request/messageStore.js"

const { t } = useI18n()

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
const removeMultipleEntries = inject("removeMultipleEntries")
const uploadinput = ref()
const state = reactive({
  skels: {},
  uploadinput: null,
  loading: false,
  droparea: false,
  hasUsing: computed(() => boneState?.bonestructure["using"]),
})

/**
 * Uploads the files one by one and appends each as an entry. A failed upload stops the rest and
 * is reported in the message store, like in the file widget.
 * @param {FileList} files
 */
async function uploadAll(files) {
  state.loading = true
  try {
    for (const file of files) {
      const fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
      addMultipleEntry(props.lang, { dest: fileresult, rel: state.hasUsing ? undefined : null })
    }
  } catch (error) {
    notify(requestMessage({ method: "POST", endpoint: "add", module: "file", error }))
  } finally {
    if (uploadinput.value) uploadinput.value.value = ""
    state.loading = false
  }
}

function handleUpload(event) {
  return uploadAll(event.target.files)
}

function handleDrop(event) {
  state.droparea = false
  return uploadAll(event.dataTransfer.files)
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
  border: 1px solid var(--wa-color-info-50);
  background-color: var(--wa-color-info-80);
  color: var(--wa-color-info-10);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn {
  margin-left: var(--wa-space-xs);
}

.upload-btn {
  margin-left: auto;
}
</style>
