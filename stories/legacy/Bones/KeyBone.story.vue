<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/key.js"
</script>

<template>
  <Story title="Legacy Bones/KeyBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
      />
    </Variant>

    <Variant
      title="Leer"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: null }"
      />
    </Variant>
  </Story>
</template>
