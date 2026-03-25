import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'

// CodeMirror mocks
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
  return {
    EditorView,
    keymap: { of: () => [] },
    drawSelection: () => [],
  }
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

import * as stories from '../../../stories/forms/bones/codeBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('codeBone', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    expect(() => mount(Readonly)).not.toThrow()
  })
})
