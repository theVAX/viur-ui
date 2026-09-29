<template>
  <div
    class="bone-widget-file-area"
    :class="{
      'is-dragover': state.droparea,
      'has-value': !!value,
      'is-loading': state.loading,
      'is-readonly': boneState.readonly,
    }"
    :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    @click="openPicker"
    @dragover.prevent="state.droparea = true"
    @dragleave.prevent="state.droparea = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="uploadinput"
      style="display: none"
      type="file"
      :multiple="boneState.multiple"
      @change="handleUpload"
    />

    <div
      v-if="!value"
      class="wa-cluster wa-gap-s wa-align-items-center bone-widget-prompt"
    >
      <wa-icon name="upload"></wa-icon>
      <span>{{ $t("bone.dropzone") }}</span>
    </div>

    <div
      v-else
      class="wa-flank wa-gap-xs wa-align-items-center"
    >
      <div
        v-if="value?.['dest']?.['mimetype']?.includes('image')"
        class="bone-widget-preview has-preview"
        @click.stop="state.previewopen = !state.previewopen"
      >
        <wa-avatar
          style="--size: round(calc(var(--wa-form-control-height) - 0.09em), 1px)"
          class="bone-widget-preview-img"
          shape="rounded"
          :image="createBackgroundImage()"
          alt=""
        ></wa-avatar>
        <wa-dialog
          :label="decodeURIComponent(value?.['dest']?.['name'])"
          class="bone-widget-preview-overlay"
          :open="state.previewopen"
        >
          <img
            :src="createBackgroundImage()"
            alt=""
          />
        </wa-dialog>
      </div>
      <div
        v-else
        class="bone-widget-preview"
      >
        <wa-avatar
          v-if="value?.['dest']?.['name']"
          shape="rounded"
          style="--size: round(calc(var(--wa-form-control-height) - 0.09em), 1px)"
        >
          <wa-icon
            slot="icon"
            name="file"
          ></wa-icon>
        </wa-avatar>
      </div>
      <div class="wa-flank:end wa-gap-xs wa-align-items-center bone-widget-file-row">
        <div
          v-if="value?.['dest']?.['name']"
          class="bone-widget-filename"
          :title="decodeURIComponent(value?.['dest']?.['name'])"
        >
          {{ decodeURIComponent(value?.["dest"]?.["name"]) }}
        </div>
        <div @click.stop>
          <slot></slot>
        </div>
      </div>
    </div>

    <div
      v-if="state.loading"
      class="wa-cluster wa-align-items-center bone-widget-loader"
    >
      <wa-spinner></wa-spinner>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, inject, ref } from "vue"
import { downloadUrlFor, uploadFile } from "../../../request/index.js"
import BoneActions from "../BoneActions.vue"
/**
 * File upload widget for bones of type `relational.tree.leaf.file.file`.
 *
 * Provides a combined click/drop area: a click opens the file picker,
 * a drop uploads the dropped file. For image files, a clickable
 * preview is shown that opens a dialog. Action buttons (download, delete)
 * are inserted via `<bone-actions>` through the default slot.
 *
 * @displayName FileBone
 *
 * @cssClass bone-widget-file-area - Outer clickable container (drop zone)
 * @cssClass bone-widget-prompt - Empty state (icon + text)
 * @cssClass bone-widget-loader - Visible during the upload
 * @cssClass bone-widget-preview - Container for the preview image or the file icon
 * @cssClass has-preview - Additional class when an image preview is present
 * @cssClass is-dragover - When a file is dragged over the area
 * @cssClass has-value - When a value is set
 * @cssClass is-loading - While an upload is in progress
 * @cssClass is-readonly - When the bone is readonly
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value; object with `dest` and `rel` keys, or `null`. */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones, e.g. `"de"`. */
  lang: String,
  /** Bone structure; the `public` flag controls whether the upload is public. */
  bone: Object,
  /** Currently not used. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on file upload, file drop, clearing, and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {{ dest: object, rel: null }|string} value - Uploaded file object, or `""` when cleared
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
   */
  "change",
])

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

/**
 * Triggers the native file picker of the hidden input.
 * Only active in the empty state — if a value is already set, it must first be
 * cleared via the delete action or replaced via drag-and-drop.
 */
function openPicker() {
  if (state.loading || boneState.readonly || props.value) return
  uploadinput.value?.click()
}

function createBackgroundImage() {
  console.log(props.value)
  return downloadUrlFor(props.value, false)
}

async function handleUpload(event) {
  state.loading = true
  try {
    for (let file of event.target.files) {
      let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
      console.log(fileresult)
      uploadinput.value.value = ""
      emit("change", props.name, { dest: fileresult, rel: null }, props.lang, props.index)
    }
  } finally {
    state.loading = false
  }
}

async function handleDrop(event) {
  state.loading = true
  state.droparea = false
  try {
    for (let file of event.dataTransfer.files) {
      let fileresult = await uploadFile(file, { publicUpload: !!boneState?.bonestructure["public"] })
      uploadinput.value.value = ""
      emit("change", props.name, { dest: fileresult, rel: null }, props.lang, props.index)
      break
    }
  } finally {
    state.loading = false
  }
}
</script>

<style scoped>
.bone-widget-file-area {
  position: relative;
  padding: calc(var(--wa-space-xs) - 1px);
  border: 2px dashed var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
  cursor: pointer;
  transition: all 0.15s ease;

  &.has-value {
    border-style: none;
    padding: 0;
    background-color: var(--wa-color-neutral-95);
  }

  &.is-dragover {
    border-color: var(--wa-color-brand-50);
    background-color: var(--wa-color-brand-95);
  }

  &.is-readonly,
  &.is-loading,
  &.has-value {
    cursor: default;
  }

  &:hover:not(.is-readonly):not(.is-loading):not(.has-value) {
    border-color: var(--wa-color-brand-60);
  }
}

.bone-widget-prompt {
  justify-content: center;
  color: var(--wa-color-on-quiet);
  /* Clicks fall through to the outer drop zone */
  pointer-events: none;
}

/* Filename row may shrink; long names are truncated with an ellipsis */
.bone-widget-file-row {
  min-width: 0;
}

.bone-widget-filename {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.bone-widget-loader {
  position: absolute;
  inset: 0;
  justify-content: center;
  border-radius: inherit;
  background-color: color-mix(in srgb, var(--wa-color-surface-default) 70%, transparent);
}

/* Clickable image preview: zoom cursor + slight scaling on hover */
.bone-widget-preview.has-preview {
  cursor: zoom-in;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
}
</style>
