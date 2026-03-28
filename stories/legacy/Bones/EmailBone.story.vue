<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/email.js'
</script>

<template>
  <Story title="Legacy Bones/EmailBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure()"
        :skel="{ email: 'beispiel@example.com' }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ readonly: true })"
        :skel="{ email: 'readonly@example.com' }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ required: true })"
        :skel="{ email: '' }"
        :errors="[{ fieldPath: ['email'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ multiple: true })"
        :skel="{ email: ['a@example.com', 'b@example.com'] }"
      />
    </Variant>

    <Variant title="Multilang" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="email"
        bone-type="str.email"
        :structure="createStructure({ languages: ['de', 'en'] })"
        :skel="{ email: { de: 'de@example.com', en: 'en@example.com' } }"
        :languages="['de', 'en']"
      />
    </Variant>

  </Story>
</template>
