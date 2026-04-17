<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/spatial.js"
</script>

<template>
  <Story title="Legacy Bones/SpatialBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: [48.1351, 11.582] }"
      />
    </Variant>

    <Variant
      title="Leer"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure()"
        :skel="{ location: null }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ readonly: true })"
        :skel="{ location: [48.1351, 11.582] }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="location"
        bone-type="spatial"
        :structure="createStructure({ required: true })"
        :skel="{ location: null }"
        :errors="[{ fieldPath: ['location'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>
  </Story>
</template>
