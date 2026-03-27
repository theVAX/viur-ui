<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/color.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/ColorBone">

    <Variant title="Default (leer)" :source="src(createStructure(), { color: null })">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure()"
        :skel="{ color: null }"
      />
    </Variant>

    <Variant title="Mit Farbe" :source="src(createStructure(), { color: '#e74c3c' })">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure()"
        :skel="{ color: '#e74c3c' }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { color: '#3498db' })">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ readonly: true })"
        :skel="{ color: '#3498db' }"
      />
    </Variant>

    <Variant title="Required + Fehler" :source="src(createStructure({ required: true }), { color: null }, { errors: [{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }] })">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ required: true })"
        :skel="{ color: null }"
        :errors="[{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { color: ['#e74c3c', '#3498db'] })">
      <BoneStoryWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ multiple: true })"
        :skel="{ color: ['#e74c3c', '#3498db'] }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="color"
          bone-type="color"
          :structure="state.structure"
          :skel="{ color: '#3b82f6' }"
          :errors="state.showError ? [{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.color.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.color.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
