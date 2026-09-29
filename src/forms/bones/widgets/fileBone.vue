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
/**
 * Datei-Upload-Widget für Bones vom Typ `relational.tree.leaf.file.file`.
 *
 * Stellt eine kombinierte Klick-/Drop-Fläche bereit: ein Klick öffnet den File-Picker,
 * ein Drop lädt die fallengelassene Datei hoch. Bei Bilddateien wird eine klickbare
 * Vorschau angezeigt, die einen Dialog öffnet. Action-Buttons (Download, Delete)
 * werden über `<bone-actions>` per Default-Slot eingebracht.
 *
 * @displayName FileBone
 *
 * @cssClass bone-widget-file-area - Äußerer klickbarer Container (Drop-Zone)
 * @cssClass bone-widget-prompt - Empty-State (Icon + Text)
 * @cssClass bone-widget-loader - Während des Uploads sichtbar
 * @cssClass bone-widget-preview - Container für das Vorschaubild oder das Datei-Icon
 * @cssClass has-preview - Zusatzklasse wenn ein Bild-Vorschau vorliegt
 * @cssClass is-dragover - Wenn eine Datei über die Fläche gezogen wird
 * @cssClass has-value - Wenn ein Wert gesetzt ist
 * @cssClass is-loading - Während ein Upload läuft
 * @cssClass is-readonly - Wenn der Bone readonly ist
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
  /** Bone-Struktur; `public`-Flag steuert ob der Upload öffentlich ist. */
  bone: Object,
  /** Aktuell nicht genutzt. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei Datei-Upload, Datei-Drop, Löschen und beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {{ dest: object, rel: null }|string} value - Hochgeladenes Datei-Objekt oder `""` beim Löschen
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
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
 * Triggert den nativen File-Picker des hidden Inputs.
 * Nur im Empty-State aktiv — ist bereits ein Wert gesetzt, muss zuerst per
 * Delete-Action geleert oder per Drag-and-Drop ersetzt werden.
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
  /* Klicks fallen auf die outer Drop-Zone durch */
  pointer-events: none;
}

/* Dateiname-Zeile darf schrumpfen; lange Namen werden mit Ellipsis abgekürzt */
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

/* Klickbare Bildvorschau: Zoom-Cursor + leichte Skalierung beim Hover */
.bone-widget-preview.has-preview {
  cursor: zoom-in;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
}
</style>
