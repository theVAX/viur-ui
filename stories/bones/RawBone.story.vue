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

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/RawBone">

    <Variant title="Default (editierbar)" :source="src(createStructure(), { content: 'Rohtext\nZeile 2' })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure()"
        :skel="{ content: 'Rohtext\nZeile 2' }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { content: 'Nur lesen' })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure({ readonly: true })"
        :skel="{ content: 'Nur lesen' }"
      />
    </Variant>

    <Variant title="JSON-Typ" :source="src(createJsonStructure(), { content: exampleJson })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw.json"
        :structure="createJsonStructure()"
        :skel="{ content: exampleJson }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { content: '' },
          { errors: [{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="content"
        bone-type="raw"
        :structure="createStructure({ required: true })"
        :skel="{ content: '' }"
        :errors="[{ fieldPath: ['content'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multilang"
      :source="src(createStructure({ languages: ['de', 'en'] }), { content: { de: 'Deutscher Text', en: 'English text' } }, { languages: ['de', 'en'] })"
      :auto-props-disabled="true"
    >
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
          bone-name="content"
          :bone-type="state.structure.content.type"
          :structure="state.structure"
          :skel="{ content: 'Beispielinhalt' }"
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
