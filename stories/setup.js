import '../src/webawesomeConfig.js'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'

export function setupApp({ app }) {
  app.use(createPinia())
  app.use(
    createI18n({
      legacy: false,
      locale: 'de',
      fallbackLocale: 'en',
      messages: { de: {}, en: {} },
    })
  )
}
