<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/text.js'
</script>

<template>
  <Story title="Bones/TextBone">

    <Variant title="Default – Textarea">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure()"
        :skel="{ content: 'Langer Text\nMit mehreren Zeilen.' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ readonly: true })"
        :skel="{ content: 'Nur lesen.' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ multiple: true })"
        :skel="{ content: ['Erster Absatz', 'Zweiter Absatz'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ required: true })"
        :skel="{ content: '' }"
        :errors="[{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ content: { de: 'Deutscher Text', en: 'English text' } }"
        :languages="['de', 'en']"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="content"
          bone-type="text"
          :structure="state.structure"
          :skel="{ content: '<p>Beispielinhalt</p>' }"
          :errors="state.showError ? [{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.content.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.content.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
