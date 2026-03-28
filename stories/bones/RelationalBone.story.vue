<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure, exampleEntry } from '../fixtures/relational.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/RelationalBone">

    <Variant title="Leer (Combobox)" :source="src(createStructure(), { entry: null })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: null }"
      />
    </Variant>

    <Variant title="Mit Auswahl" :source="src(createStructure(), { entry: exampleEntry })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { entry: exampleEntry })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ readonly: true })"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { entry: null },
          { errors: [{ fieldPath: ['entry'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ required: true })"
        :skel="{ entry: null }"
        :errors="[{ fieldPath: ['entry'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { entry: [exampleEntry] })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ multiple: true })"
        :skel="{ entry: [exampleEntry] }"
      />
    </Variant>

    <Variant title="Select (Dropdown)" :source="src(createStructure({ type: 'relational.select' }), { entry: exampleEntry })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational.select"
        :structure="createStructure({ type: 'relational.select' })"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant title="Select – Leer" :source="src(createStructure({ type: 'relational.select' }), { entry: null })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational.select"
        :structure="createStructure({ type: 'relational.select' })"
        :skel="{ entry: null }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="entry"
          bone-type="relational"
          :structure="state.structure"
          :skel="{ entry: null }"
          :errors="state.showError ? [{ fieldPath: ['entry'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.entry.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.entry.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
