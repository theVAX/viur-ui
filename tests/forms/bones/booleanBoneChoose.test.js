import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/booleanBoneChoose.stories.js'

const { Default } = composeStories(stories)

describe('booleanBoneChoose', () => {
  test('mountet ohne Fehler', () => {
    expect(() => mount(Default, { global: { mocks: { $t: (key) => key } } })).not.toThrow()
  })
})
