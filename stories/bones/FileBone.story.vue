<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure, exampleFile, exampleImage } from '../fixtures/file.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/FileBone">

    <Variant title="Leer (Upload-Button)" :source="src(createStructure(), { file: null })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: null }"
      />
    </Variant>

    <Variant title="Mit Datei" :source="src(createStructure(), { file: exampleFile })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleFile }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { file: exampleFile })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ readonly: true })"
        :skel="{ file: exampleFile }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { file: null },
          { errors: [{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ required: true })"
        :skel="{ file: null }"
        :errors="[{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { file: [exampleFile] })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure({ multiple: true })"
        :skel="{ file: [exampleFile] }"
      />
    </Variant>

    <Variant title="Bild-Datei (Vorschau)" :source="src(createStructure(), { file: exampleImage })" :auto-props-disabled="true">
      <BoneStoryWrapper
        bone-name="file"
        bone-type="relational.tree.leaf.file.file"
        :structure="createStructure()"
        :skel="{ file: exampleImage }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="file"
          bone-type="relational.tree.leaf.file.file"
          :structure="state.structure"
          :skel="{ file: null }"
          :errors="state.showError ? [{ fieldPath: ['file'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.file.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.file.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
