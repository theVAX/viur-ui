import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/jsonBone.stories.js'

const { Default, WithValue, Readonly } = composeStories(stories)

describe('jsonBone', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default)).not.toThrow()
  })

  test('mountet ohne Fehler (WithValue)', () => {
    expect(() => mount(WithValue)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    expect(() => mount(Readonly)).not.toThrow()
  })
})
