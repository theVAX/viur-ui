import '../../src/webawesomeConfig.js'
import '../../src/legacy/shoelaceConfig.js'

import { defineSetupVue3 } from '@histoire/plugin-vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import de from '../../src/translations/de.js'
import en from '../../src/translations/en.js'

// Neue Bone-Komponenten
import Bone from '../../src/forms/bones/bone.vue'
import BoneLabel from '../../src/forms/bones/boneLabel.vue'
import WrapperMultiple from '../../src/forms/bones/wrapper_multiple.vue'
import WrapperNested from '../../src/forms/bones/wrapper_nested.vue'

// Legacy Bone-Komponenten
import LegacyBone from '../../src/legacy/bones/edit/bone.vue'
import LegacyBoneLabel from '../../src/legacy/bones/edit/boneLabel.vue'
import LegacyWrapperMultiple from '../../src/legacy/bones/edit/wrapper_multiple.vue'
import LegacyWrapperNested from '../../src/legacy/bones/edit/wrapper_nested.vue'

export const setupVue3 = defineSetupVue3(({ app }) => {
  // Neue Komponenten global registrieren
  app.component('Bone', Bone)
  app.component('bone-label', BoneLabel)
  app.component('wrapper-multiple', WrapperMultiple)
  app.component('wrapper-nested', WrapperNested)

  // Legacy-Komponenten global registrieren
  app.component('LegacyBone', LegacyBone)
  app.component('legacy-bone-label', LegacyBoneLabel)
  app.component('legacy-wrapper-multiple', LegacyWrapperMultiple)
  app.component('legacy-wrapper-nested', LegacyWrapperNested)

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
