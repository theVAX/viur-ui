<script setup>
import RecordBoneWrapper from '../RecordBoneWrapper.vue'
import { createStructure } from '../fixtures/record.js'

function src(structure, skel, extra = {}) {
  let out = `// structure\n${JSON.stringify(structure, null, 2)}\n\n// skel\n${JSON.stringify(skel, null, 2)}`
  if (extra.languages) out += `\n\n// languages\n${JSON.stringify(extra.languages, null, 2)}`
  if (extra.errors) out += `\n\n// errors\n${JSON.stringify(extra.errors, null, 2)}`
  return out
}
</script>

<template>
  <Story title="Bones/RecordBone">

    <Variant title="Default (editierbar)" :source="src(createStructure(), { address: {} })" :auto-props-disabled="true">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure()"
        :skel="{ address: {} }"
      />
    </Variant>

    <Variant title="Readonly" :source="src(createStructure({ readonly: true }), { address: {} })" :auto-props-disabled="true">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ readonly: true })"
        :skel="{ address: {} }"
      />
    </Variant>

    <Variant title="Multiple" :source="src(createStructure({ multiple: true }), { address: [{}] })" :auto-props-disabled="true">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ multiple: true })"
        :skel="{ address: [{}] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :source="
        src(
          createStructure({ required: true }),
          { address: null },
          { errors: [{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }] }
        )
      "
      :auto-props-disabled="true"
    >
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ required: true })"
        :skel="{ address: null }"
        :errors="[{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ structure: createStructure(), showError: false })"
    >
      <template #default="{ state }">
        <RecordBoneWrapper
          bone-name="address"
          :structure="state.structure"
          :skel="{ address: {} }"
          :errors="state.showError ? [{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }] : []"
        />
      </template>
      <template #controls="{ state }">
        <HstJson v-model="state.structure" title="Structure" />
        <HstCheckbox v-model="state.structure.address.readonly" title="Readonly" />
        <HstCheckbox v-model="state.structure.address.required" title="Required" />
        <HstCheckbox v-model="state.showError" title="Mit Fehler" />
      </template>
    </Variant>

  </Story>
</template>
