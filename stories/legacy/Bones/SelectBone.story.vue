<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/select.js"
</script>

<template>
  <Story title="Legacy Bones/SelectBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure()"
        :skel="{ status: 'draft' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ readonly: true })"
        :skel="{ status: 'published' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ required: true })"
        :skel="{ status: null }"
        :errors="[{ fieldPath: ['status'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ multiple: true })"
        :skel="{ status: ['draft', 'published'] }"
      />
    </Variant>

    <Variant
      title="Multilang"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="status"
        bone-type="select"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ status: { de: 'draft', en: 'published' } }"
        :languages="['de', 'en']"
      />
    </Variant>
  </Story>
</template>
