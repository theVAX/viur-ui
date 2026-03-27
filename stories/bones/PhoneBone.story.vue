<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/phone.js'
</script>

<template>
  <Story title="Bones/PhoneBone">

    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure()"
        :skel="{ phone: '+49 89 12345678' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ readonly: true })"
        :skel="{ phone: '+49 89 12345678' }"
      />
    </Variant>

    <Variant title="Multiple">
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ multiple: true })"
        :skel="{ phone: ['+49 89 12345678', '+43 1 98765432'] }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="phone"
        bone-type="str.phone"
        :structure="createStructure({ required: true })"
        :skel="{ phone: '' }"
        :errors="[{ fieldPath: ['phone'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

  </Story>
</template>
