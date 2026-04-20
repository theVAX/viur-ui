<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/password.js"
</script>

<template>
  <Story title="Legacy Bones/PasswordBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure()"
        :skel="{ password: '' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ readonly: true })"
        :skel="{ password: '' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ required: true })"
        :skel="{ password: '' }"
        :errors="[{ fieldPath: ['password'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>
  </Story>
</template>
