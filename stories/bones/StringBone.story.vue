<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/string.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/StringBone">
    <Variant
      title="Default (editierbar)"
      :source="src(createStructure(), { title: 'Beispieltext' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: 'Beispieltext' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { title: 'Nur lesen' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ readonly: true })"
        :skel="{ title: 'Nur lesen' }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { title: ['Wert 1', 'Wert 2'] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="src(createStructure({ required: true }), { title: '' }, { errors: [{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multilang"
      :source="src(createStructure({ languages: ['de', 'en'] }), { title: { de: 'Deutsch', en: 'English' } }, { languages: ['de', 'en'] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ title: { de: 'Deutsch', en: 'English' } }"
        :languages="['de', 'en']"
      />
    </Variant>
    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="title"
          bone-type="str"
          :structure="state.structure"
          :skel="{ title: 'Beispieltext' }"
          :errors="state.showError ? [{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.title.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.title.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
