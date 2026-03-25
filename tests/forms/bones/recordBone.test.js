import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'

// CKEditor mocks (textBone.vue pulled in via index.js → wrapper_nested.vue)
vi.mock('@ckeditor/ckeditor5-vue', () => ({
  Ckeditor: { name: 'Ckeditor', template: '<div class="mock-ckeditor"></div>' },
}))
vi.mock('ckeditor5', () => ({
  ClassicEditor: class ClassicEditor {},
  Essentials: class {}, Paragraph: class {}, Bold: class {}, Italic: class {},
  SourceEditing: class {}, BlockQuote: class {}, Heading: class {}, Image: class {},
  ImageStyle: class {}, ImageToolbar: class {}, ImageUpload: class {},
  ImageResizeButtons: class {}, FileRepository: class {}, ImageBlock: class {},
  ImageInline: class {}, Indent: class {}, IndentBlock: class {}, Link: class {},
  List: class {}, Table: class {}, TableToolbar: class {}, TextTransformation: class {},
  Underline: class {}, Alignment: class {}, RemoveFormat: class {},
  GeneralHtmlSupport: class {},
}))
vi.mock('ckeditor5/dist/translations/de.js', () => ({ default: {} }))
vi.mock('ckeditor5/dist/ckeditor5.css', () => ({}))

// CodeMirror mocks (codeBone.vue pulled in via index.js)
vi.mock('codemirror', () => ({ basicSetup: [] }))
vi.mock('@codemirror/view', () => {
  class EditorView {
    constructor({ doc } = {}) {
      this.dom = document.createElement('div')
      this.state = { doc: { length: (doc || '').length, lines: 1, line: () => ({ text: doc || '' }) } }
    }
    dispatch() {}
  }
  EditorView.editable = { of: () => [] }
  EditorView.lineWrapping = []
  return { EditorView, keymap: { of: () => [] }, drawSelection: () => [] }
})
vi.mock('@codemirror/language', () => ({
  syntaxHighlighting: () => [],
  defaultHighlightStyle: {},
  LanguageDescription: { matchLanguageName: () => null },
  indentString: () => {},
  indentUnit: { of: () => [] },
}))
vi.mock('@codemirror/commands', () => ({
  indentLess: {}, indentMore: {}, indentWithTab: {}, indentSelection: {}, insertTab: {},
}))
vi.mock('@codemirror/state', () => ({
  EditorState: { tabSize: { of: () => [] } },
}))
vi.mock('@codemirror/language-data', () => ({ languages: [] }))

import * as stories from '../../../stories/forms/bones/recordBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('recordBone', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    expect(() => mount(Readonly)).not.toThrow()
  })
})
