import '../src/webawesomeConfig.js'
import { defineSetupVue3 } from '@histoire/plugin-vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import de from '../src/translations/de.js'
import en from '../src/translations/en.js'
import Bone from '../src/forms/bones/bone.vue'

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.component('Bone', Bone)
  app.use(createPinia())
  app.use(
    createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'en',
      messages: { de, en },
    })
  )
})
