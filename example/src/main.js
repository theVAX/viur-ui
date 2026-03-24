import './shoelaceConfig'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

import Bone from 'viur-ui/src/legacy/bones/edit/bone.vue'
import BoneLabel from 'viur-ui/src/legacy/bones/edit/boneLabel.vue'
import BoneActions from 'viur-ui/src/legacy/bones/edit/boneActions.vue'
import ViFormCategory from 'viur-ui/src/legacy/forms/ViFormCategory.vue'

const i18n = createI18n({ legacy: false, locale: 'de', messages: {} })

const app = createApp(App)
app.use(createPinia())
app.use(i18n)

app.component('bone', Bone)
app.component('bone-label', BoneLabel)
app.component('bone-actions', BoneActions)
app.component('vi-form-category', ViFormCategory)

app.mount('#app')
