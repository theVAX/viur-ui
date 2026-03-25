import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/rawBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('rawBone', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    expect(() => mount(Readonly)).not.toThrow()
  })
})
