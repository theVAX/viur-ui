<template>
  <div
    class="file-wrapper"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @dragover.prevent="state.droparea = true"
    @dragleave="state.droparea = false"
    @drop.prevent="handleDrop"
  >
    <div v-if="state.loading" class="loader">
      <wa-spinner slot="end"></wa-spinner>
    </div>

    <div v-if="state.droparea" class="droparea">Dateien hier hinziehen</div>
    <wa-button
      v-if="!boneState.readonly && (!value || state.loading)"
      :title="$t('bone.upload')"
      appearance="outlined"
      class="upload-btn"
      @click="uploadinput.click()"
    >
      <wa-icon name="upload"></wa-icon>
    </wa-button>
    <input ref="uploadinput" hidden type="file" :multiple="boneState.multiple" @change="handleUpload" />
    <wa-button v-if="value" :title="$t('bone.download')" @click="downloadFile">
      <wa-icon slot="start" name="download"></wa-icon>
    </wa-button>
    <div class="box">
      <div
        v-if="value?.['dest']?.['mimetype'].includes('image')"
        class="preview has-preview"
        @click="state.previewopen = !state.previewopen"
      >
        <img class="preview-img" :src="createBackgroundImage()" alt="" />
        <wa-dialog
          :label="decodeURIComponent(value?.['dest']?.['name'])"
          class="preview-overlay"
          :open="state.previewopen"
        >
          <img :src="createBackgroundImage()" alt="" />
        </wa-dialog>
      </div>
      <div v-else class="preview">
        <wa-icon v-if="value?.['dest']?.['name']" name="file"></wa-icon>
      </div>
      <div v-if="value?.['dest']?.['name']">
        {{ decodeURIComponent(value?.["dest"]?.["name"]) }}
      </div>
    </div>
    <wa-button
      v-if="!boneState.multiple"
      variant="danger"
      appearance="outlined"
      :title="$t('bone.del')"
      class="delete-btn"
      @click="$emit('change', name, '', lang, index)"
    >
      <wa-icon name="xmark"></wa-icon>
    </wa-button>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, ref } from "vue"
import { downloadUrlFor, uploadFile } from "../../request/index.js"
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
const uploadinput = ref()
const state = reactive({
  loading: false,
  droparea: false,
  previewopen: false,
})

onMounted(() => {
  emit("change", props.name, props.value, props.lang, props.index) //init
})

function downloadFile() {
  const url = downloadUrlFor(props.value)
  if (url) {
    window.open(url)
  }
}

function createBackgroundImage() {
  return downloadUrlFor(props.value, false)
}

async function handleUpload(event) {
  state.loading = true
  for (let file of event.target.files) {
    let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
    uploadinput.value.value = null
    emit("change", props.name, { dest: fileresult, rel: null }, props.lang, props.index)
  }
  state.loading = false
}

async function handleDrop(event) {
  state.loading = true
  state.droparea = false
  for (let file of event.dataTransfer.files) {
    let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
    uploadinput.value.value = null
    emit("change", props.name, { dest: fileresult, rel: null }, props.lang, props.index)
    break
  }
  state.loading = false
}
</script>

<style scoped>
.box {
  display: flex;
  align-items: center;
  padding: 0 var(--sl-spacing-small) 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  border: 1px solid var(--sl-color-gray-500);
  border-radius: 5px;
  height: var(--wa-input-height-medium);
  background-color: transparent;
}

.preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: var(--wa-input-height-medium);
  width: var(--wa-input-height-medium);
  aspect-ratio: 1;
  border-right: 1px solid var(--sl-color-gray-500);
  margin-right: var(--sl-spacing-small);
  background-image: /* tint image */
    linear-gradient(to right, rgba(255, 255, 255, 0.87), rgba(255, 255, 255, 0.87)),
    /* checkered effect */ linear-gradient(to right, black 50%, white 50%),
    linear-gradient(to bottom, black 50%, white 50%);
  background-blend-mode: normal, difference, normal;
  background-size: 0.65em 0.65em;

  &.has-preview {
    cursor: pointer;
  }

  & wa-icon {
    font-size: 1.1em;
    color: var(--sl-color-gray-400);
  }

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.file-wrapper {
  width: 100%;
  display: flex;
  gap: var(--sl-spacing-x-small);
  position: relative;
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

.delete-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.delete-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.upload-btn {
  &::part(base) {
    aspect-ratio: 1;
  }
}

.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.7);
}

.preview-overlay {
  &::part(panel) {
    width: auto;
    max-width: 1200px;
  }

  &::part(body) {
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: /* tint image */
      linear-gradient(to right, rgba(255, 255, 255, 0.87), rgba(255, 255, 255, 0.87)),
      /* checkered effect */ linear-gradient(to right, black 50%, white 50%),
      linear-gradient(to bottom, black 50%, white 50%);
    background-blend-mode: normal, difference, normal;
    background-size: 1.2em 1.2em;
    padding: 0;
  }

  & img {
    width: auto;
    height: auto;
  }
}
</style>
