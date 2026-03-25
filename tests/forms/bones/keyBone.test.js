import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/keyBone.stories.js'

const { Default } = composeStories(stories)

describe('keyBone', () => {
  test('rendert wa-input', () => {
    expect(mount(Default).find('wa-input').exists()).toBe(true)
  })

  test('ist immer disabled (key-Felder sind readonly)', () => {
    // keyBone has static disabled attribute — always disabled
    const w = mount(Default)
    expect(w.find('wa-input').element.disabled).toBe(true)
  })
})
