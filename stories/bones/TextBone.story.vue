<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/text.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/TextBone">

    <Variant
      title="Default – Textarea"
      :source="src(createStructure(), { content: 'Langer Text\nMit mehreren Zeilen.' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure()"
        :skel="{ content: 'Langer Text\nMit mehreren Zeilen.' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :source="src(createStructure({ readonly: true }), { content: 'Nur lesen.' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ readonly: true })"
        :skel="{ content: 'Nur lesen.' }"
      />
    </Variant>

    <Variant
      title="Multiple"
      :source="src(createStructure({ multiple: true }), { content: ['Erster Absatz', 'Zweiter Absatz'] })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="content"
        bone-type="text"
        :structure="createStructure({ multiple: true })"
        :skel="{ content: ['Erster Absatz', 'Zweiter Absatz'] }"
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
        bone-type="text"
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
