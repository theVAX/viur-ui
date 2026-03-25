import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'

vi.mock('@ckeditor/ckeditor5-vue', () => ({
  Ckeditor: { name: 'Ckeditor', template: '<div class="mock-ckeditor"></div>' },
}))

vi.mock('ckeditor5', () => ({
  ClassicEditor: class ClassicEditor {},
  Essentials: class {},
  Paragraph: class {},
  Bold: class {},
  Italic: class {},
  SourceEditing: class {},
  BlockQuote: class {},
  Heading: class {},
  Image: class {},
  ImageStyle: class {},
  ImageToolbar: class {},
  ImageUpload: class {},
  ImageResizeButtons: class {},
  FileRepository: class {},
  ImageBlock: class {},
  ImageInline: class {},
  Indent: class {},
  IndentBlock: class {},
  Link: class {},
  List: class {},
  Table: class {},
  TableToolbar: class {},
  TextTransformation: class {},
  Underline: class {},
  Alignment: class {},
  RemoveFormat: class {},
  GeneralHtmlSupport: class {},
}))

vi.mock('ckeditor5/dist/translations/de.js', () => ({ default: {} }))
vi.mock('ckeditor5/dist/ckeditor5.css', () => ({}))

import * as stories from '../../../stories/forms/bones/textBone.stories.js'

const { Default } = composeStories(stories)

describe('textBone', () => {
  test('mountet ohne Fehler', () => {
    expect(() => mount(Default)).not.toThrow()
  })
})
