<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure, exampleEntry } from "../../fixtures/relational.js"
</script>

<template>
  <Story title="Legacy Bones/RelationalBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: null }"
      />
    </Variant>

    <Variant
      title="Mit Wert"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure()"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ readonly: true })"
        :skel="{ entry: exampleEntry }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ required: true })"
        :skel="{ entry: null }"
        :errors="[{ fieldPath: ['entry'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="entry"
        bone-type="relational"
        :structure="createStructure({ multiple: true })"
        :skel="{ entry: [exampleEntry] }"
      />
    </Variant>
  </Story>
</template>
