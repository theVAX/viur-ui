<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/email.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/EmailBone">

    <Variant title="Default (editierbar)" :source="src(createStructure(), { email: 'hallo@example.com' })">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure()"
        :skel="{ email: 'hallo@example.com' }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { email: 'hallo@example.com' })">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ readonly: true })"
        :skel="{ email: 'hallo@example.com' }"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { email: ['eins@example.com', 'zwei@example.com'] })">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ multiple: true })"
        :skel="{ email: ['eins@example.com', 'zwei@example.com'] }"
      />
    </Variant>

    <Variant title="Required + Fehler" :source="src(createStructure({ required: true }), { email: '' }, { errors: [{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }] })">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ required: true })"
        :skel="{ email: '' }"
        :errors="[{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang" :source="src(createStructure({ languages: ['de', 'en'] }), { email: { de: 'de@example.com', en: 'en@example.com' } }, { languages: ['de', 'en'] })">
      <BoneStoryWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ email: { de: 'de@example.com', en: 'en@example.com' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="email"
          bone-type="str.email"
          :structure="state.structure"
          :skel="{ email: 'beispiel@example.com' }"
          :errors="state.showError ? [{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.email.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.email.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
