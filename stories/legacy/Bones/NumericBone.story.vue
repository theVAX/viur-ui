<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/numeric.js"
</script>

<template>
  <Story title="Legacy Bones/NumericBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure()"
        :skel="{ amount: 42 }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ readonly: true })"
        :skel="{ amount: 100 }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ required: true })"
        :skel="{ amount: null }"
        :errors="[{ fieldPath: ['amount'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ multiple: true })"
        :skel="{ amount: [1, 2, 3] }"
      />
    </Variant>

    <Variant
      title="Multilang"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="amount"
        bone-type="numeric"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ amount: { de: 42, en: 42 } }"
        :languages="['de', 'en']"
      />
    </Variant>
  </Story>
</template>
