<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/string.js'
</script>

<template>
  <Story title="Bones/StringBone">
    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure()"
        :skel="{ title: 'Beispieltext' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ readonly: true })"
        :skel="{ title: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ multiple: true })"
        :skel="{ title: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="title"
        bone-type="str"
        :structure="createStructure({ required: true })"
        :skel="{ title: '' }"
        :errors="[{ fieldPath: ['title'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
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
