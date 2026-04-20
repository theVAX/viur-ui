<script setup>
import { computed } from "vue"

const props = defineProps({
  component: {
    type: Object,
    required: true,
  },
})

const info = computed(() => props.component?.__docgenInfo)

const cssClasses = computed(() => {
  return (info.value?.tags?.cssClass ?? [])
    .map(({ description }) => {
      if (!description) return null
      const sep = description.indexOf(" - ")
      if (sep !== -1) {
        return { name: description.slice(0, sep).trim(), desc: description.slice(sep + 3).trim() }
      }
      return { name: description.trim(), desc: "" }
    })
    .filter(Boolean)
})
</script>

<template>
  <div v-if="info" class="docs-panel">
    <h1>{{ info.displayName }}</h1>
    <p v-if="info.description" class="docs-description">{{ info.description }}</p>

    <template v-if="cssClasses.length">
      <h2>CSS-Klassen</h2>
      <table>
        <thead>
          <tr>
            <th>Klasse</th>
            <th>Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cls in cssClasses" :key="cls.name">
            <td><code>{{ cls.name }}</code></td>
            <td>{{ cls.desc }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template v-if="info.props?.length">
      <h2>Props</h2>
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Typ</th>
            <th>Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prop in info.props" :key="prop.name">
            <td><code>{{ prop.name }}</code></td>
            <td><code>{{ prop.type?.name ?? "-" }}</code></td>
            <td>{{ prop.description }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template v-if="info.events?.length">
      <h2>Events</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Beschreibung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in info.events" :key="event.name">
            <td><code>{{ event.name }}</code></td>
            <td>{{ event.description }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
  <div v-else class="docs-panel docs-panel--empty">
    Keine JSDoc-Doku gefunden.
  </div>
</template>

<style scoped>
.docs-panel {
  padding: 1.5rem;
  max-width: 860px;
  font-size: 14px;
  line-height: 1.6;
  color: #ccc;
}

.docs-panel h1 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #fff;
}

.docs-panel h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.8rem 0 0.6rem;
  color: #fff;
  border-bottom: 1px solid #333;
  padding-bottom: 0.3rem;
}

.docs-description {
  color: #aaa;
  margin: 0 0 1rem;
  white-space: pre-line;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  padding: 6px 12px;
  background: #1e1e1e;
  color: #888;
  font-weight: 600;
  border-bottom: 1px solid #333;
}

td {
  padding: 6px 12px;
  border-bottom: 1px solid #2a2a2a;
  vertical-align: top;
}

tr:last-child td {
  border-bottom: none;
}

code {
  font-family: monospace;
  background: #2a2a2a;
  padding: 1px 5px;
  border-radius: 3px;
  color: #fa7;
  font-size: 12px;
}

.docs-panel--empty {
  color: #666;
  font-style: italic;
}
</style>
