<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure, exampleFile, exampleImage } from '../fixtures/file.js'
</script>

<template>
  <Story title="Bones/FileBone">

    <Variant title="Leer (Upload-Button)">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: null }"
      />
    </Variant>

    <Variant title="Mit Datei">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleFile }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ readonly: true })"
        :skel="{ file: exampleFile }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ required: true })"
        :skel="{ file: null }"
        :errors="[{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ multiple: true })"
        :skel="{ file: [exampleFile] }"
      />
    </Variant>

    <Variant title="Bild-Datei (Vorschau)">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleImage }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="file"
          bone-type="relational.tree.leaf.file.file"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ file: null }"
          :errors="state.showError ? [{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstCheckbox v-model="state.readonly" title="Readonly" />
        <HstCheckbox v-model="state.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
