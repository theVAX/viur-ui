<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure, exampleEntry } from '../fixtures/relational.js'
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

  </Story>
</template>
