<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/raw.js"
</script>

<template>
  <Story title="Legacy Bones/RawBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="code"
        bone-type="raw"
        :structure="createStructure()"
        :skel="{ code: '' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="code"
        bone-type="raw"
        :structure="createStructure({ readonly: true })"
        :skel="{ code: 'Beispiel-Inhalt' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="code"
        bone-type="raw"
        :structure="createStructure({ required: true })"
        :skel="{ code: '' }"
        :errors="[{ fieldPath: ['code'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="code"
        bone-type="raw"
        :structure="createStructure({ multiple: true })"
        :skel="{ code: ['Wert 1', 'Wert 2'] }"
      />
    </Variant>

    <Variant
      title="Multilang"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="code"
        bone-type="raw"
        :structure="createStructure({ type: 'raw', languages: ['de', 'en'] })"
        :skel="{ code: { de: 'Deutsch', en: 'English' } }"
        :languages="['de', 'en']"
      />
    </Variant>
  </Story>
</template>
