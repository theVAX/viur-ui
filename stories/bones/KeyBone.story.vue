<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/key.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/KeyBone">

    <Variant
      title="Mit Schlüssel"
      :source="src(createStructure(), { key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
      />
    </Variant>

    <Variant
      title="Leer"
      :source="src(createStructure(), { key: null })"
      :auto-props-disabled="true"
    >
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: null }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="key"
          bone-type="key"
          :structure="state.structure"
          :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
          :errors="state.showError ? [{ fieldPath: ['key'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.key.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.key.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>
  </Story>
</template>
