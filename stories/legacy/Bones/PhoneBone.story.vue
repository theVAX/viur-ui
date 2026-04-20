<script setup>
import CompareWrapper from "../CompareWrapper.vue"
import { createStructure } from "../../fixtures/phone.js"
</script>

<template>
  <Story title="Legacy Bones/PhoneBone">
    <Variant
      title="Default"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure()"
        :skel="{ phone: '+49 89 123456' }"
      />
    </Variant>

    <Variant
      title="Readonly"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ readonly: true })"
        :skel="{ phone: '+49 89 123456' }"
      />
    </Variant>

    <Variant
      title="Required + Fehler"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ required: true })"
        :skel="{ phone: '' }"
        :errors="[{ fieldPath: ['phone'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant
      title="Multiple"
      :auto-props-disabled="true"
    >
      <CompareWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ multiple: true })"
        :skel="{ phone: ['+49 89 123456', '+49 30 654321'] }"
      />
    </Variant>
  </Story>
</template>
