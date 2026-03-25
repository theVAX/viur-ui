import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/colorBone.stories.js'

const { Default } = composeStories(stories)

describe('colorBone', () => {
  test('mountet ohne Fehler', () => {
    expect(() => mount(Default)).not.toThrow()
  })
})
