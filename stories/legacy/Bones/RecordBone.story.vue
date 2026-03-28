<script setup>
import CompareWrapper from '../CompareWrapper.vue'
import { createStructure } from '../../fixtures/record.js'
</script>

<template>
  <Story title="Legacy Bones/RecordBone">

    <Variant title="Default" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="address"
        bone-type="record"
        :structure="createStructure()"
        :skel="{ address: { street: 'Musterstraße 1', city: 'München', zip: '80333' } }"
      />
    </Variant>

    <Variant title="Readonly" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="address"
        bone-type="record"
        :structure="createStructure({ readonly: true })"
        :skel="{ address: { street: 'Musterstraße 1', city: 'München', zip: '80333' } }"
      />
    </Variant>

    <Variant title="Required + Fehler" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="address"
        bone-type="record"
        :structure="createStructure({ required: true })"
        :skel="{ address: {} }"
        :errors="[{ fieldPath: ['address'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

    <Variant title="Multiple" :auto-props-disabled="true">
      <CompareWrapper
        bone-name="address"
        bone-type="record"
        :structure="createStructure({ multiple: true })"
        :skel="{ address: [{ street: 'Str. 1', city: 'München', zip: '80333' }, { street: 'Str. 2', city: 'Berlin', zip: '10115' }] }"
      />
    </Variant>

  </Story>
</template>
