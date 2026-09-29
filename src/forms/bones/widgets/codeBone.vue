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
 * Code editor based on CodeMirror for syntax-highlighted source code input.
 *
 * Detects the programming language from `boneState.bonestructure.type`
 * (e.g. `raw.code.python`, `raw.code.html`, `raw.code.javascript`) and dynamically
 * loads the matching CodeMirror language plugin. Supports
 * multiple values (`multiple`). An expand button allows expanding
 * to full height.
 *
 * @displayName CodeBone
 *
 * @cssClass bone-widget - Base class of all bone widgets
 * @cssClass bone-widget-raw - Identifies the parent bone type
 * @cssClass bone-widget-raw-default - Default variant
 * @cssClass bone-widget-wrapper - Wraps the editor and the expand button
 * @cssClass is-max-size - Toggled via the expand button; removes the maximum height
 */
defineOptions({
  inheritAttrs: false,
})

const element = ref(null)
const view = ref(null)

const props = defineProps({
  /** Bone name – passed as the first argument in every `change` event. */
  name: String,
  /** Current bone value (source code as a string). */
  value: [Object, String, Number, Boolean, Array],
  /** Index in the multiple array; `undefined` for a single value. */
  index: Number,
  /** Language key for multilingual bones (CodeBone does not support multilang). */
  lang: String,
  /** Bone structure (currently not actively used). */
  bone: Object,
  /** Focuses the CodeMirror editor after mount. */
  autofocus: Boolean,
})

const emit = defineEmits([
  /**
   * Fired on every value change and on mount (initialization).
   * @arg {string} name - Bone name
   * @arg {string} value - Current source code
   * @arg {string|undefined} lang - Language key
   * @arg {number|undefined} index - Index in the multiple array
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
