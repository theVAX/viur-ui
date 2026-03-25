import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/passwordBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('passwordBone', () => {
  test('rendert wa-input', () => {
    expect(mount(Default).find('wa-input').exists()).toBe(true)
  })

  test('disabled im Readonly-Modus', () => {
    const w = mount(Readonly)
    expect(w.find('wa-input').element.disabled).toBe(true)
  })
})
