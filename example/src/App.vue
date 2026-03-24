<script setup>
import { computed, ref } from 'vue'
import ViForm from 'viur-ui/src/forms/ViForm.vue'
import RequestTest from './RequestTest.vue'

const localForm = ref(null)
const requestForm = ref(null)
const requestError = ref(null)

const localStructure = {
  key: {
    type: 'key',
    descr: 'Key',
    visible: true,
    required: false,
    readonly: true,
    multiple: false,
    languages: null,
    params: { category: 'Meta' },
  },
  name: {
    type: 'str',
    descr: 'Name',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  email: {
    type: 'str.email',
    descr: 'E-Mail',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  age: {
    type: 'numeric',
    descr: 'Alter',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Profil' },
  },
  isActive: {
    type: 'bool',
    descr: 'Aktiv',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Zugang' },
  },
  role: {
    type: 'select',
    descr: 'Rolle',
    visible: true,
    required: true,
    readonly: false,
    multiple: false,
    languages: null,
    values: {
      admin: 'Admin',
      editor: 'Editor',
      user: 'User',
    },
    params: { category: 'Zugang' },
  },
  birthday: {
    type: 'date',
    descr: 'Geburtstag',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    date: true,
    time: false,
    params: { category: 'Persoenlich' },
  },
  bio: {
    type: 'text',
    descr: 'Kurzprofil',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: { category: 'Persoenlich' },
  },
  address: {
    type: 'record',
    descr: 'Adresse',
    visible: true,
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    using: {
      street: {
        type: 'str',
        descr: 'Strasse',
        visible: true,
        required: false,
        readonly: false,
        multiple: false,
        languages: null,
        params: {},
      },
      city: {
        type: 'str',
        descr: 'Ort',
        visible: true,
        required: false,
        readonly: false,
        multiple: false,
        languages: null,
        params: {},
      },
    },
    params: { category: 'Adresse' },
  },
}

const localSkel = {
  key: 'demo-user-1',
  name: 'Max Mustermann',
  email: 'max@example.org',
  age: 30,
  isActive: true,
  role: 'editor',
  birthday: '1994-08-16',
  bio: 'Diese Demo verwendet die neuen src/forms Komponenten.',
  address: {
    street: 'Beispielstrasse 5',
    city: 'Brussels',
  },
}

const localState = computed(() => localForm.value?.state ?? null)
const requestState = computed(() => requestForm.value?.state ?? null)

async function submitRequestForm() {
  requestError.value = null
  if (!requestForm.value) return

  try {
    await requestForm.value.sendData()
  } catch (error) {
    requestError.value = error
  }
}

function reloadRequestForm() {
  requestError.value = null
  requestForm.value?.fetchData()
}
</script>

<template>
  <main class="page">
    <section class="demo-card">
      <div class="demo-head">
        <div>
          <p class="eyebrow">Forms</p>
          <h2>Lokale Form mit `structure` + `skel`</h2>
        </div>
      </div>

      <ViForm ref="localForm" :structure="localStructure" :skel="localSkel" label="top" />

      <div class="state-grid">
        <div>
          <h3>Aktueller Skel</h3>
          <pre>{{ JSON.stringify(localState?.skel ?? {}, null, 2) }}</pre>
        </div>
        <div>
          <h3>Aktuelle Errors</h3>
          <pre>{{ JSON.stringify(localState?.errors ?? [], null, 2) }}</pre>
        </div>
      </div>
    </section>

    <section class="demo-card">
      <div class="demo-head">
        <div>
          <p class="eyebrow">Forms</p>
          <h2>Request-basierte Form mit `module` + `action`</h2>
          <p class="muted">
            Beispiel gegen das Modul `user`. Das funktioniert nur, wenn dein Example gegen ein passendes ViUR-Backend
            laeuft.
          </p>
        </div>
        <div class="button-row">
          <wa-button appearance="outlined" @click="reloadRequestForm">reload()</wa-button>
          <wa-button variant="brand" @click="submitRequestForm">sendData()</wa-button>
        </div>
      </div>

      <ViForm ref="requestForm" module="user" action="add" label="top" @failed="requestError = $event" />

      <div class="state-grid">
        <div>
          <h3>Status</h3>
          <pre>{{ JSON.stringify({
            loading: requestState?.loading ?? false,
            actionname: requestState?.actionname ?? null,
            failed: requestState?.failed ?? null,
          }, null, 2) }}</pre>
        </div>
        <div>
          <h3>Antwort / Fehler</h3>
          <pre>{{ JSON.stringify(requestError ?? requestState?.skel ?? {}, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <section class="demo-card">
      <div class="demo-head">
        <div>
          <p class="eyebrow">Requests</p>
          <h2>Request Beispiele</h2>
        </div>
      </div>

      <RequestTest />
    </section>
  </main>
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  color: #172033;
}

.demo-card {
  background: linear-gradient(180deg, #ffffff 0%, #f7f8fc 100%);
  border: 1px solid #d6dbea;
  border-radius: 18px;
  box-shadow: 0 18px 50px rgba(13, 27, 62, 0.08);
  padding: 1.5rem;
}

.demo-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  color: #5b6f9d;
}

h2 {
  margin: 0;
  font-size: 1.45rem;
}

h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.muted {
  margin: 0.5rem 0 0;
  color: #5d6a86;
  max-width: 58ch;
}

.button-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.state-grid {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

pre {
  margin: 0;
  padding: 1rem;
  border-radius: 12px;
  background: #0f1729;
  color: #d9e3ff;
  font-size: 0.82rem;
  overflow: auto;
  min-height: 8rem;
}

@media (max-width: 900px) {
  .demo-head,
  .state-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .demo-head {
    gap: 1rem;
  }
}
</style>
