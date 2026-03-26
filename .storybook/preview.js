import { provide, getCurrentInstance } from 'vue'
import { createI18n } from 'vue-i18n'
import '../src/webawesomeConfig.js'
import './storybook.css'
import de_translations from '../src/legacy/translations/de.js'
import en_translations from '../src/legacy/translations/en.js'

const i18n = createI18n({
  locale: 'de',
  messages: { de: de_translations, en: en_translations },
  legacy: false,
})

export const setup = (app) => {
  app.use(i18n)
}

export const decorators = [
  (story, context) => ({
    setup() {
      const instance = getCurrentInstance()
      if (instance) {
        const app = instance.appContext.app
        if (!app.config.globalProperties.$t) {
          app.config.globalProperties.$t = (key, ...args) => i18n.global.t(key, ...args)
        }
      }

      provide('boneState', {
        readonly:        context.args.readonly ?? false,
        multiple:        context.args.multiple ?? false,
        isEmpty:         context.args.isEmpty ?? false,
        required:        context.args.required ?? false,
        label:           'normal',
        params:          {},
        defaultLanguage: 'de',
        maxlength:       undefined,
        minlength:       undefined,
        errorMessages:   [],
        bonestructure:   context.args.bone ?? {},
      })
      provide('formatString', (skel) => skel?.name ?? String(skel ?? ''))
      provide('mainformState', { skel: {}, errors: {} })
      provide('bonePath', [])
    },
    template: '<story />',
  }),
]
