<script setup>
import RecordBoneWrapper from '../RecordBoneWrapper.vue'
import { createStructure } from '../fixtures/record.js'
</script>

<template>
  <Story title="Bones/RecordBone">

    <Variant title="Default (editierbar)">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure()"
        :skel="{ address: {} }"
      />
    </Variant>

    <Variant title="Readonly">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ readonly: true })"
        :skel="{ address: {} }"
      />
    </Variant>

    <Variant title="Multiple">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ multiple: true })"
        :skel="{ address: [{}] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <RecordBoneWrapper
        bone-name="address"
        :structure="createStructure({ required: true })"
        :skel="{ address: null }"
        :errors="[{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: false, required: false, showError: false })"
    >
      <template #default="{ state }">
        <RecordBoneWrapper
          bone-name="address"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ address: {} }"
          :errors="state.showError ? [{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }] : []"
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
