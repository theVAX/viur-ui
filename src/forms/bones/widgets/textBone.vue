<template>
  <template v-if="state.editor">
    <template v-if="boneState.bonestructure?.['valid_html'] || boneState.bonestructure?.['validHtml']">
      <ckeditor
        v-model="state.value"
        :editor="state.editor"
        :config="state.editorConfig"
        :disabled="boneState?.readonly"
        :required="
          boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
        "
        class="bone-widget bone-widget-text bone-widget-text-default"
        :class="([`bone-widget-text-${name}`], [`bone-widget-text-${name}-html`])"
        :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
        @ready="onReady"
        @input="changeEvent"
      ></ckeditor>
      <input
        type="text"
        class="bone-widget-text-hidden"
        :value="state.value"
        :required="
          boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
        "
      />
    </template>
    <wa-textarea
      v-else
      class="bone-widget bone-widget-text bone-widget-text-default"
      :class="[`bone-widget-text-${name}`]"
      :disabled="boneState?.readonly"
      :value="value"
      :required="
        boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
      "
      :placeholder="state.placeholder"
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
      @input="changeEventTextarea"
    ></wa-textarea>
  </template>
</template>

<script setup>
import { reactive, onMounted, inject, computed, watch, onBeforeMount } from "vue"
import { Ckeditor } from "@ckeditor/ckeditor5-vue"
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  SourceEditing,
  BlockQuote,
  Heading,
  Image,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResizeButtons,
  FileRepository,
  ImageBlock,
  ImageInline,
  Indent,
  IndentBlock,
  Link,
  List,
  Table,
  TableToolbar,
  TextTransformation,
  Underline,
  Alignment,
  RemoveFormat,
  GeneralHtmlSupport,
} from "ckeditor5"
import coreTranslations from "ckeditor5/dist/translations/de.js"
import "ckeditor5/dist/ckeditor5.css"
import { ViURUploadAdapterPlugin } from "../uploadAdapter"

/**
 * Mehrzeiliges Textfeld für längere Inhalte, wahlweise als Textarea oder Rich-Text-Editor (CKEditor 5).
 *
 * Wenn `boneState.bonestructure.valid_html` oder `boneState.bonestructure.validHtml` gesetzt ist,
 * wird ein CKEditor 5 (ClassicEditor) gerendert. Die sichtbaren Toolbar-Aktionen werden anhand
 * der erlaubten HTML-Tags (`validTags`) gefiltert. Ohne HTML-Konfiguration erscheint ein
 * einfaches `<wa-textarea>`. Bei `boneState.label === "placeholder"` wird der Bone-Name als
 * Placeholder angezeigt statt als Label.
 *
 * @displayName TextBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-text - Kennzeichnet den Bone-Typ
 * @cssClass bone-widget-text-default - Standard-Variante (Textarea oder CKEditor)
 * @cssClass bone-widget-text-{name} - Dynamisch gesetzt auf den Bone-Namen, z.B. `bone-widget-text-content`
 * @cssClass bone-widget-text-{name}-html - Gesetzt wenn der Bone HTML-Inhalt enthält
 */
defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert als Klartext oder HTML-String. */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones, z.B. `"de"`. */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus auf das Eingabefeld (aktuell nicht implementiert). */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Textwert oder HTML-String
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  value: "",
  editorConfig: {},
  editor: computed(() => ClassicEditor),
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
})

function changeEvent(event) {
  emit("change", props.name, state.value, props.lang, props.index)
}
function changeEventTextarea(event) {
  state.value = event.target.value
  emit("change", props.name, state.value, props.lang, props.index)
}

onBeforeMount(() => {
  let toolbarActions = {
    heading: "h1",
    bold: "b",
    italic: "i",
    underline: "u",
    numberedList: "ol",
    bulletedList: "ul",
    blockQuote: "blockquote",
    link: "a",
    insertTable: "table",
    imageUpload: "img",
  }

  let defaultSet = [
    "heading",
    "|",
    "bold",
    "italic",
    "underline",
    "|",
    "alignment",
    "numberedList",
    "bulletedList",
    "blockQuote",
    "|",
    "indent",
    "outdent",
    "|",
    "link",
    "insertTable",
    "imageUpload",
    "|",
    "undo",
    "redo",
    "RemoveFormat",
    "sourceEditing",
  ]

  defaultSet = defaultSet.filter((i) => {
    if (!Object.keys(toolbarActions).includes(i)) {
      return true
    }

    if (boneState.bonestructure?.["valid_html"]?.["validTags"].includes(toolbarActions[i])) {
      return true
    }
    if (boneState.bonestructure?.["validHtml"]?.["validTags"].includes(toolbarActions[i])) {
      return true
    }
    return false
  })

  state.editorConfig = {
    licenseKey: "GPL",
    translations: [coreTranslations],
    toolbar: defaultSet,
    plugins: [
      Essentials,
      Heading,
      Paragraph,
      Bold,
      List,
      ImageUpload,
      Italic,
      Underline,
      ImageBlock,
      ImageInline,
      Alignment,
      Link,
      BlockQuote,
      Indent,
      Table,
      RemoveFormat,
      ImageStyle,
      ImageToolbar,
      ImageResizeButtons,
      IndentBlock,
      TableToolbar,
      TextTransformation,
      GeneralHtmlSupport,
      Image,
      SourceEditing,
      FileRepository,
      ViURUploadAdapterPlugin,
    ],
    link: {
      decorators: [
        {
          mode: "manual",
          label: "Link in neuem Fester öffnen",
          attributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      ],
    },
    image: {
      toolbar: [
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "|",
        "resizeImage:50",
        "resizeImage:75",
        "resizeImage:original",
        "imageTextAlternative",
      ],
      resizeOptions: [
        {
          name: "resizeImage:original",
          value: null,
          icon: "original",
        },
        {
          name: "resizeImage:50",
          value: "50",
          icon: "medium",
        },
        {
          name: "resizeImage:75",
          value: "75",
          icon: "large",
        },
      ],
    },
    table: {
      contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
    },
    heading: {
      options: [
        { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
        { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
        { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
        { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
        { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
        { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
        { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
      ],
    },
    alignment: {
      options: [
        { name: "left", className: "viur-txt-align--left" },
        { name: "right", className: "viur-txt-align--right" },
        { name: "center", className: "viur-txt-align--center" },
        { name: "justify", className: "viur-txt-align--justify" },
      ],
    },
    indentBlock: {
      classes: [
        "viur-txt-indent--1",
        "viur-txt-indent--2",
        "viur-txt-indent--3",
        "viur-txt-indent--4",
        "viur-txt-indent--5",
        "viur-txt-indent--6",
        "viur-txt-indent--7",
        "viur-txt-indent--8",
        "viur-txt-indent--9",
        "viur-txt-indent--10",
      ],
    },

    htmlSupport: {
      allow: [
        {
          name: "a",
          attributes: {
            target: true,
            rel: true,
          },
        },
      ],
    },
    language: "de",
    viur_api_url: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : window.location.origin,
  }
})

onMounted(() => {
  if (props.value !== null) {
    state.value = props.value
  }

  emit("change", props.name, props.value, props.lang, props.index) //init
})

function onReady(editor) {
  editor.editing.view.change((writer) => {
    writer.setStyle("min-height", "250px", editor.editing.view.document.getRoot())
  })

  const codePlugin = editor.plugins.get("SourceEditing")

  codePlugin.on("change:isSourceEditingMode", (_eventInfo, _name, value) => {
    if (value) {
      const sourceEditingTextarea = editor.editing.view.getDomRoot()?.nextSibling?.firstChild
      sourceEditingTextarea.addEventListener("focusout", (event) => {
        if (event.relatedTarget?.classList.contains("ck")) {
          return
        }
        codePlugin.isSourceEditingMode = false
      })
    }
  })
}

watch(
  () => props.value,
  (newVal, oldVal) => {
    if (!newVal) {
      state.value = ""
    } else {
      state.value = newVal
    }
  }
)
</script>
<style scoped>
.bone-widget-text-hidden {
  max-height: 0;
  display: block;
  visibility: hidden;
  width: 100%;
  pointer-events: none;
}
</style>
