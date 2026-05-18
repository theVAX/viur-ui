import "../src/webawesomeConfig.js"
import "./histoire-global.css"
import "../src/legacy/shoelaceConfig.js"
import { defineSetupVue3 } from "@histoire/plugin-vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import de from "../src/translations/de.js"
import en from "../src/translations/en.js"
import Bone from "../src/forms/bones/Bone.vue"
import BoneLabel from "../src/forms/bones/BoneLabel.vue"
import BoneMultipleWrapper from "../src/forms/bones/BoneMultipleWrapper.vue"
import BoneNestedWrapper from "../src/forms/bones/BoneNestedWrapper.vue"
import LegacyBone from "../src/legacy/bones/edit/bone.vue"
import LegacyBoneLabel from "../src/legacy/bones/edit/boneLabel.vue"
import LegacyWrapperMultiple from "../src/legacy/bones/edit/wrapper_multiple.vue"
import LegacyWrapperNested from "../src/legacy/bones/edit/wrapper_nested.vue"

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.component("Bone", Bone)
  app.component("BoneLabel", BoneLabel)
  app.component("BoneMultipleWrapper", BoneMultipleWrapper)
  app.component("BoneNestedWrapper", BoneNestedWrapper)
  app.component("LegacyBone", LegacyBone)
  app.component("legacy-bone-label", LegacyBoneLabel)
  app.component("legacy-wrapper-multiple", LegacyWrapperMultiple)
  app.component("legacy-wrapper-nested", LegacyWrapperNested)
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
