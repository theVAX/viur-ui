<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/boolean.js'
</script>

<template>
  <Story title="Legacy Bones/BooleanBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure()"
        :skel="{ active: false }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ readonly: true })"
        :skel="{ active: true }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ required: true })"
        :skel="{ active: false }"
        :errors="[{ fieldPath: ['active'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="active"
        bone-type="bool"
        :structure="createStructure({ multiple: true })"
        :skel="{ active: [true, false, true] }"
      />
    </Variant>

  </Story>
</template>
