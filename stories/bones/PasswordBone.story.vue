<script setup>
import BoneStoryWrapper from '../BoneStoryWrapper.vue'
import { createStructure } from '../fixtures/password.js'
</script>

<template>
  <Story title="Bones/PasswordBone">

    <Variant title="Default (editierbar)">
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure()"
        :skel="{ password: '' }"
      />
    </Variant>

    <Variant title="Readonly">
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ readonly: true })"
        :skel="{ password: 'geheim' }"
      />
    </Variant>

    <Variant title="Required + Fehler">
      <BoneStoryWrapper
        bone-name="password"
        bone-type="password"
        :structure="createStructure({ required: true })"
        :skel="{ password: '' }"
        :errors="[{ fieldPath: ['password'], errorMessage: 'field_not_set', severity: 3 }]"
      />
    </Variant>

  </Story>
</template>
