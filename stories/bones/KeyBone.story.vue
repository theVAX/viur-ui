<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/key.js'
</script>

<template>
  <Story title="Bones/KeyBone">

    <Variant title="Mit Schlüssel">
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: 'ag9zfnZpdXItdGVzdHIRCxIHQXJ0aWNsZRiAgICAgICAgAoM' }"
      />
    </Variant>

    <Variant title="Leer">
      <BoneStoryWrapper
        bone-name="key"
        bone-type="key"
        :structure="createStructure()"
        :skel="{ key: null }"
      />
    </Variant>

  </Story>
</template>
