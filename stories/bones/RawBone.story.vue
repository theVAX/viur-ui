<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'

function createStructure(overrides = {}) {
  return {
    content: {
      type: 'raw',
      descr: 'Rohinhalt',
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

function createJsonStructure(overrides = {}) {
  return {
    content: {
      type: 'raw.json',
      descr: 'JSON',
      required: false,
      readonly: false,
      multiple: false,
      languages: null,
      params: {},
      ...overrides,
    },
  }
}

const exampleJson = { name: 'Test', value: 42, active: true }
</script>

<template>
  <Story title="Bones/RawBone">

    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure()"
        :skel="{ content: 'Rohtext\nZeile 2' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure({ readonly: true })"
        :skel="{ content: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="JSON-Typ">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw.json"
        :structure="createJsonStructure()"
        :skel="{ content: exampleJson }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure({ required: true })"
        :skel="{ content: '' }"
        :errors="[{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multilang">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
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
          bone-name="code"
          :bone-type="state.structure.code.type"
          :structure="state.structure"
          :skel="{ code: 'Beispielinhalt' }"
          :errors="state.showError ? [{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.code.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.code.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
