<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/key.js'
</script>

<template>
  <Story title="Bones/KeyBone">

    <Variant title="Mit Schlüssel">
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
      />
    </Variant>

    <Variant title="Leer">
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: null }"
      />
    </Variant>

    <Variant
      title="Playground"
      :init-state="() => ({ readonly: true, required: false, showError: false })"
    >
      <template #default="{ state }">
        <BoneStoryWrapper
          bone-name="key"
          bone-type="key"
          :structure="createStructure({ readonly: state.readonly, required: state.required })"
          :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
          :errors="state.showError ? [{ fieldPath: ['key'], errorMessage: 'field_not_set', severity: 3 }] : []"
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
