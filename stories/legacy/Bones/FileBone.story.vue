<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure, exampleImage, exampleFile } from "../../fixtures/file.js"
</script>

<template>
  <Story title="Legacy Bones/FileBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: null }"
      />
    </Variant>

    <Variant
      title="Mit Bild"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleImage }"
      />
    </Variant>

    <Variant
      title="Mit Datei"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleFile }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ readonly: true })"
        :skel="{ file: exampleImage }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ required: true })"
        :skel="{ file: null }"
        :errors="[{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ multiple: true })"
        :skel="{ file: [exampleImage, exampleFile] }"
      />
    </Variant>
  </Story>
</template>
