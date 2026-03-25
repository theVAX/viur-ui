import { mount } from '@vue/test-utils'
import { composeStories } from '@storybook/vue3'

// @viur/vue-utils mock (describeImage.vue → assistantWindow.vue → boneActions.vue → wrapper_multiple.vue)
vi.mock('@viur/vue-utils/generic/Image.vue', () => ({
  default: { name: 'ViImage', template: '<img />' },
}))

import * as stories from '../../../stories/forms/bones/wrapper_multiple.stories.js'

const { Default, Readonly } = composeStories(stories)

const boneStateBase = {
  readonly: false,
  multiple: true,
  isEmpty: false,
  required: false,
  label: 'normal',
  params: {},
  errorMessages: [],
  boneactions: false,
  bonevalue: [],
  bonestructure: { type: 'str', params: {} },
}

const mountOpts = {
  global: {
    mocks: { $t: (key) => key },
    provide: {
      updateValue: () => {},
      addMultipleEntry: () => {},
      removeMultipleEntries: () => {},
      boneState: boneStateBase,
    },
  },
}

describe('wrapper_multiple', () => {
  test('mountet ohne Fehler (Default)', () => {
    expect(() => mount(Default, mountOpts)).not.toThrow()
  })

  test('mountet ohne Fehler (Readonly)', () => {
    const opts = {
      global: {
        mocks: { $t: (key) => key },
        provide: {
          ...mountOpts.global.provide,
          boneState: { ...boneStateBase, readonly: true },
        },
      },
    }
    expect(() => mount(Readonly, opts)).not.toThrow()
  })
})
