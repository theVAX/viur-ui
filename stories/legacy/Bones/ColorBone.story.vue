<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/color.js"
</script>

<template>
  <Story title="Legacy Bones/ColorBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure()"
        :skel="{ color: '#3b82f6' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ readonly: true })"
        :skel="{ color: '#f97316' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ required: true })"
        :skel="{ color: null }"
        :errors="[{ fieldPath: ['color'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="color"
        bone-type="color"
        :structure="createStructure({ multiple: true })"
        :skel="{ color: ['#3b82f6', '#f97316'] }"
      />
    </Variant>
  </Story>
</template>
