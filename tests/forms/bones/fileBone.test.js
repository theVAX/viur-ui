import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/fileBone.stories.js'

const { Default, WithFile, Readonly } = composeStories(stories)

const mountOpts = { global: { mocks: { $t: (key) => key } } }

describe('fileBone', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default, mountOpts)).not.toThrow()
  })

  test('mountet ohne Fehler (WithFile)', () => {
    expect(() => mount(WithFile, mountOpts)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    expect(() => mount(Readonly, mountOpts)).not.toThrow()
  })
})
