import "../src/webawesomeConfig.js"
import "./histoire-global.css"
import { defineSetupVue3 } from "@histoire/plugin-vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import de from "../src/translations/de.js"
import en from "../src/translations/en.js"
import Bone from "../src/forms/bones/Bone.vue"
import BoneLabel from "../src/forms/bones/BoneLabel.vue"
import BoneMultipleWrapper from "../src/forms/bones/BoneMultipleWrapper.vue"
import BoneNestedWrapper from "../src/forms/bones/BoneNestedWrapper.vue"

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.component("Bone", Bone)
  app.component("BoneLabel", BoneLabel)
  app.component("BoneMultipleWrapper", BoneMultipleWrapper)
  app.component("BoneNestedWrapper", BoneNestedWrapper)
  app.use(createPinia())
  app.use(
    createI18n({
      legacy: false,
      locale: "de",
      fallbackLocale: "en",
      messages: { de, en },
    })
  )
})
