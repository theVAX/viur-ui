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

  </Story>
</template>
