<script setup>
import ViForm from 'viur-ui/src/legacy/forms/ViForm.vue'
import RequestTest from './RequestTest.vue'

const structure = {
  name: {
    type: 'str',
    descr: 'Name',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: {},
  },
  age: {
    type: 'numeric',
    descr: 'Alter',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: {},
  },
}

const skel = {
  name: 'Max Mustermann',
  age: 30,
}
</script>

<template>
  <h2>ViForm Beispiel</h2>
  <ViForm :structure="structure" :skel="skel" />

  <hr />

  <h2>Request Beispiele (user Modul)</h2>
  <RequestTest />
</template>
