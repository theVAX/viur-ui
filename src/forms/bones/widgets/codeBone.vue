<template>
  <div
    class="bone-widget-wrapper bone-widget bone-widget-raw bone-widget-raw-default"
    :class="{ 'is-max-size': state.max }"
  >
    <textarea
      ref="element"
      :disabled="boneState?.readonly"
      :placeholder="state.placeholder"
      :data-user-invalid="boneState.errorMessages.length === 0 ? undefined : true"
    ></textarea>
    <wa-button
      appearance="plain"
      class="bone-expand-button"
      @click="state.max = !state.max"
    >
      <wa-icon :name="state.max ? 'compress' : 'expand'"></wa-icon>
    </wa-button>
  </div>

  <input
    type="text"
    class="bone-widget-raw-hidden"
    :value="state.value"
    :required="
      boneState.bonestructure.required && !boneState.bonestructure.multiple && !boneState.bonestructure.languages
    "
  />
</template>

<script setup>
import { reactive, onMounted, inject, computed, ref } from "vue"
import { basicSetup } from "codemirror"
import { EditorView, keymap, drawSelection } from "@codemirror/view"
import { syntaxHighlighting, defaultHighlightStyle, LanguageDescription } from "@codemirror/language"
import { indentLess, indentMore, indentWithTab, indentSelection, insertTab } from "@codemirror/commands"
import { indentString, indentUnit } from "@codemirror/language"
import { EditorState } from "@codemirror/state"
import { languages } from "@codemirror/language-data"

/**
 * Code-Editor auf Basis von CodeMirror für syntaxhervorgehobene Quelltext-Eingabe.
 *
 * Erkennt die Programmiersprache anhand von `boneState.bonestructure.type`
 * (z.B. `raw.code.python`, `raw.code.html`, `raw.code.javascript`) und lädt
 * das passende CodeMirror-Language-Plugin dynamisch nach. Unterstützt
 * Mehrfachwerte (`multiple`). Ein Expand-Button ermöglicht das Aufklappen
 * auf volle Höhe.
 *
 * @displayName CodeBone
 *
 * @cssClass bone-widget - Basis-Klasse aller Bone-Widgets
 * @cssClass bone-widget-raw - Kennzeichnet den übergeordneten Bone-Typ
 * @cssClass bone-widget-raw-default - Standard-Variante
 * @cssClass bone-widget-wrapper - Umschließt Editor und Expand-Button
 * @cssClass is-max-size - Wird per Expand-Button umgeschaltet; hebt die maximale Höhe auf
 */
defineOptions({
  inheritAttrs: false,
})

const element = ref(null)
const view = ref(null)

const props = defineProps({
  /** Bone-Name – wird in jedem `change`-Event als erstes Argument übergeben. */
  name: String,
  /** Aktueller Bone-Wert (Quelltext als String). */
  value: [Object, String, Number, Boolean, Array],
  /** Index im Multiple-Array; `undefined` bei Einzelwert. */
  index: Number,
  /** Sprach-Key bei mehrsprachigen Bones (CodeBone unterstützt kein multilang). */
  lang: String,
  /** Bone-Struktur (aktuell nicht aktiv genutzt). */
  bone: Object,
  /** Setzt den Fokus nach dem Mount auf den CodeMirror-Editor. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Wird bei jeder Wertänderung sowie beim Mount (Initialisierung) gefeuert.
   * @arg {string} name - Bone-Name
   * @arg {string} value - Aktueller Quelltext
   * @arg {string|undefined} lang - Sprach-Key
   * @arg {number|undefined} index - Index im Multiple-Array
   */
  "change",
])

const boneState = inject("boneState")
const state = reactive({
  placeholder: computed(() => {
    if (boneState.label !== "placeholder") return undefined
    let name = boneState?.bonestructure?.descr
    if (boneState.bonestructure.required) {
      name += "*"
    }
    return name
  }),
  value: "",
  max: false,
})

function editorFromTextArea(textarea, extensions) {
  let _view = new EditorView({ doc: textarea.value, extensions })

  textarea.parentNode.insertBefore(_view.dom, textarea)
  textarea.style.display = "none"

  if (textarea.form) {
    textarea.form.addEventListener("submit", () => {
      textarea.value = _view.state.doc.toString()
    })
  }

  indentString(_view.state, 4)

  let listener = () => {
    let lines = ""
    for (let i = 0; i < _view.state.doc.lines; ++i) {
      let line = _view.state.doc.line(i + 1).text
      lines += line + "\n"
    }
    state.value = lines
    emit("change", props.name, state.value, props.lang, props.index)
  }

  _view.dom.addEventListener("input", listener)
  _view.dom.addEventListener("keyup", listener)
  _view.dom.addEventListener("paste", listener)
  _view.dom.addEventListener("cut", listener)
  return _view
}

async function build() {
  const exts = [
    basicSetup,
    syntaxHighlighting(defaultHighlightStyle),
    keymap.of([indentWithTab]),
    indentUnit.of("    "),
    EditorState.tabSize.of(4),
    EditorView.lineWrapping,
    drawSelection(),
  ]

  let langDesc = LanguageDescription.matchLanguageName(
    languages,
    boneState?.bonestructure?.type.replace("raw.code.", "")
  )

  if (langDesc) {
    const support = await langDesc.load()
    exts.push(support)
  }

  if (boneState?.readonly) {
    exts.push(EditorView.editable.of(false))
  }

  return exts
}

onMounted(async () => {
  if (props.value !== null) {
    state.value = props.value
  }
  const exts = await build()
  view.value = editorFromTextArea(element.value, exts)

  //init editor
  view.value.dispatch({
    changes: { from: 0, to: view.value.state.doc.length, insert: state.value },
  })

  emit("change", props.name, props.value, props.lang, props.index) //init
})
</script>
<style scoped>
.bone-widget-raw-hidden {
  max-height: 0;
  display: block;
  visibility: hidden;
  width: 100%;
  pointer-events: none;
}

.bone-expand-button {
  position: absolute;
  bottom: 0px;
  right: 10px;
  z-index: 1;
}

.bone-widget-wrapper {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
}
:deep(.cm-editor) {
  width: 100%;

  & .cm-scroller {
    min-height: 3em;
    max-height: 28em;
    overflow-y: auto;
  }
}

.bone-widget-wrapper.is-max-size :deep(.cm-editor) .cm-scroller {
  max-height: none;
}
</style>
