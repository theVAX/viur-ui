<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/relational.js'
</script>

<template>
  <Story title="Bones/RelationalBone">

    <Variant title="Leer (Combobox)">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: null }"
      />
    </Variant>

    <Variant title="Mit Auswahl">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ readonly: true })"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ required: true })"
        :skel="{ entry: null }"
        :errors="[{ fieldPath: ['entry'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ multiple: true })"
        :skel="{ entry: [exampleEntry] }"
      />
    </Variant>

    <Variant title="Select (Dropdown)">
      <BoneStoryWrapper
        bone-name="entry"
        bone-type="relational.select"
        :structure="createStructure({ type: 'relational.select' })"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant title="Select – Leer">
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
