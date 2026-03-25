import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'
import * as stories from '../../../stories/forms/bones/booleanBone.stories.js'

const { Default, Readonly } = composeStories(stories)

describe('booleanBone', () => {
  test('mountet ohne Fehler und rendert wa-switch', () => {
    const wrapper = mount(Default)
    expect(wrapper.find('wa-switch').exists()).toBe(true)
  })

  test('hat disabled-Attribut im Readonly-Modus', () => {
    const wrapper = mount(Readonly)
    // Vue sets :disabled as a DOM property on custom elements (not as an HTML attribute)
    expect(wrapper.find('wa-switch').element.disabled).toBe(true)
  })
})
