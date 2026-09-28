<template>
  <div class="vi-vdt">
    <!-- Struktur kam nicht an (Recht fehlt, unerwartete Antwort): Spalten sind
         dann aus den Daten abgeleitet — Hinweis bleibt stehen. -->
    <wa-callout
      v-if="notice"
      class="vi-vdt-notice"
      variant="warning"
    >
      {{ notice }}
    </wa-callout>

    <DataTable
      ref="tableEl"
      v-model:sort="sort"
      v-model:selected-keys="selectedKeys"
      v-model:page-size="limit"
      v-model:search="clientSearch"
      v-model:filters="clientFilters"
      class="vi-vdt-table"
      :server="!allLoaded"
      :columns="effectiveColumns"
      :data="rows"
      :label="label ?? module"
      row-key="key"
      :selectable="selectable"
      :loading="list.isFetching.value"
      :has-more="Boolean(list.cursor.value)"
      :resizable="resizable"
      :reorderable="reorderable"
      :pinnable="pinnable"
      v-bind="tableProps"
      @data-request="onRequest"
      @load-more="onLoadMore"
      @page-change="onPageSizeChange"
      @row-dblclick="$emit('open', { row: $event.row, key: $event.key })"
    >
      <template
        v-for="(_, slotName) in $slots"
        #[slotName]="scope"
      >
        <slot
          :name="slotName"
          v-bind="scope"
        ></slot>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { useListFetch } from "../../request/index.js"
import { useI18n } from "vue-i18n"
import DataTable from "./DataTable.vue"
import { columnsFromStructure } from "./viurColumns"

// ViurDataTable: dünner ViUR-Wrapper um die DataTable für LIST-Module
// (Pendant zum ViurBrowser für Baum-Module): `module` rein, fertig. Enthält die komplette
// Listen-Mechanik — Server-Sortierung/-Suche, Cursor-Nachladen, Lokal-Modus
// (alles geladen → Sortieren/Filtern/Suchen clientseitig), Spalten aus der
// Struktur, Feld-Sichtbarkeit inkl. optionaler Persistenz und optionalem
// X-VIUR-BONELIST (Server serialisiert nur die sichtbaren Felder).

const props = defineProps({
  module: { type: String, required: true },
  renderer: { type: String, default: null },
  /** Untertyp gruppierter Listen (Handler `list.grouped`). */
  group: { type: String, default: null },
  /** Zusätzliche Request-Parameter — bei JEDEM Abruf gespreadet (z.B. der
   *  Server-Context als @-Parameter). Änderungen greifen ab dem nächsten
   *  Abruf; sofort neu laden macht `refresh()`. */
  params: { type: Object, default: () => ({}) },
  /** Spalten; ohne Angabe aus der viewSkel-Struktur abgeleitet. */
  columns: { type: Array, default: null },
  /** Nur diese Bones als Spalten (bei abgeleiteten Spalten). */
  bones: { type: Array, default: null },
  /** Zugängliche Beschriftung; Standard: Modulname. */
  label: { type: String, default: null },
  selectable: { type: [String, Boolean], default: "multiple" },
  /** Einträge je Nachladen (ViUR `limit`). */
  pageSize: { type: Number, default: 50 },
  /**
   * Obergrenze für den Lokal-Modus: darüber bleiben Sortieren/Filtern/Suchen
   * beim Server (der erste lokale Suchlauf schickt jede Zeile durch den
   * Bone-Formatter — fünfstellig friert das den Main-Thread ein).
   */
  localModeLimit: { type: Number, default: 5_000 },
  /** X-VIUR-BONELIST senden, wenn Felder abgewählt sind. NUR aktivieren, wenn
   *  das Modul es serverseitig trägt ("*"-Subskel) — sonst antwortet der
   *  Core mit 400. */
  bonelist: { type: Boolean, default: false },
  /** localStorage-Key der Feld-Sichtbarkeit (gespeichert wird die
   *  HIDDEN-Liste: neue Server-Felder erscheinen automatisch); null = keine
   *  Persistenz. */
  storageKey: { type: String, default: null },
  /** Sprache/Locale für Bone-Darstellung in den Spalten. */
  language: { type: String, default: null },
  /** Steht bei language="*" vorn (üblicherweise die UI-Sprache). */
  primaryLanguage: { type: String, default: null },
  locale: { type: String, default: null },
  /** Spalten per Griff in der Kopfzeile breiter/schmaler ziehen. Anders als
   *  bei der nackten DataTable (dort Opt-in) hier standardmäßig AN — die
   *  ViurDataTable ist das Komfort-Widget. */
  resizable: { type: Boolean, default: true },
  /** Spalten per Drag umsortieren. */
  reorderable: { type: Boolean, default: true },
  /** Spalten links/rechts anpinnen. */
  pinnable: { type: Boolean, default: true },
  /** Wird an die DataTable durchgereicht (überschreibt Einzel-Props). */
  tableProps: { type: Object, default: () => ({}) },
})

defineEmits(["open"])

const { t } = useI18n()
const tableEl = ref(null)
const selectedKeys = defineModel("selectedKeys", { type: Array, default: () => [] })

const sort = ref([])
const limit = ref(Math.min(99, Number(props.params?.limit ?? props.pageSize) || 50))
/** Serverseitiger Suchbegriff (ViUR `search`); leer = aus. */
const serverSearch = ref("")
/** Client-Suche/-Filter — greifen NUR im vollständig geladenen Zustand. */
const clientSearch = ref("")
const clientFilters = ref([])
/** Ausgeblendete Spalten (Feldnamen). */
const hiddenFields = ref(loadHiddenFields())

const list = useListFetch(props.module, {
  group: props.group ?? null,
  params: { limit: limit.value },
  immediate: false,
  ...(props.renderer ? { renderer: props.renderer } : {}),
  headers: () => bonelistHeader(),
})

const rows = computed(() => list.data.value)

/** Alles geladen und klein genug → Lokal-Modus (Client-Pipeline der Tabelle). */
const allLoaded = computed(
  () =>
    rows.value.length > 0 &&
    rows.value.length <= props.localModeLimit &&
    list.complete.value &&
    !serverSearch.value
)

const effectiveColumns = computed(() => {
  if (props.columns) return props.columns
  const derived = columnsFromStructure(list.structure.value, {
    ...(props.bones ? { bones: props.bones } : {}),
    ...(props.language ? { language: props.language } : {}),
    ...(props.primaryLanguage ? { primaryLanguage: props.primaryLanguage } : {}),
    ...(props.locale ? { locale: props.locale } : {}),
    exclude: ["key"],
    local: allLoaded.value,
  })
  if (derived.length) {
    return derived.map((column) => ({
      ...column,
      hidden: hiddenFields.value.includes(String(column.field ?? column.id)),
    }))
  }
  return fallbackColumns(rows.value[0])
})

const notice = computed(() =>
  rows.value.length && !columnsFromStructure(list.structure.value).length
    ? t("dataTable.structureNotice")
    : ""
)

/** Notfall-Spalten: die Felder des ersten Datensatzes, unformatiert. */
function fallbackColumns(row) {
  if (!row) return []
  return Object.keys(row)
    .filter((field) => field !== "key")
    .map((field) => ({ field, label: field, sortable: false, minWidth: 120, flex: 1 }))
}

/** Abrufparameter: props.params (Context etc.) + Suche + Sortierung + limit. */
function requestParams(sortEntries = sort.value) {
  const params = { ...props.params, limit: limit.value }
  if (serverSearch.value) params.search = serverSearch.value
  const [first] = sortEntries
  if (first) {
    params.orderby = first.id
    if (first.desc) params.orderdir = "1"
  }
  return params
}

function onRequest(request) {
  if (request.pageSize) limit.value = Math.min(99, request.pageSize)
  void list.filter(requestParams(request.sort)).catch(() => null)
}

function onPageSizeChange({ pageSize }) {
  if (!pageSize || pageSize === limit.value) return
  limit.value = Math.min(99, pageSize)
  void list.filter(requestParams()).catch(() => null)
}

async function onLoadMore({ pages }) {
  if (pages === "all") {
    await list.nextAll().catch(() => null)
    return
  }
  await list.next(pages).catch(() => null)
}

// Zurück im Server-Modus (Reload, neuer Cursor, Server-Suche): lokale
// Verfeinerungen zurücksetzen und Sortierungen entfernen, die der Server
// nicht kann (nur indizierte, einwertige Bones).
watch(allLoaded, (local) => {
  if (local) return
  clientSearch.value = ""
  clientFilters.value = []
  sort.value = sort.value.filter((entry) => {
    const bone = list.structure.value?.[entry.id]
    return bone?.indexed === true && !bone?.multiple && !bone?.languages?.length
  })
})

// ── Feld-Sichtbarkeit (+ optionale Persistenz, + optionale Bonelist) ─────────
function loadHiddenFields() {
  if (!props.storageKey) return []
  try {
    const parsed = JSON.parse(localStorage.getItem(props.storageKey) ?? "[]")
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function bonelistHeader() {
  if (!props.bonelist || !hiddenFields.value.length) return null
  const fields = Object.keys(list.structure.value ?? {}).filter(
    (name) => !hiddenFields.value.includes(name)
  )
  if (!fields.length) return null
  return { "X-VIUR-BONELIST": ["key", ...fields].join(",") }
}

const columnsApi = {
  /** Alle ein-/ausblendbaren Spalten mit aktuellem Zustand. */
  all: () =>
    effectiveColumns.value
      .filter((column) => column.hideable !== false)
      .map((column) => ({
        id: String(column.field ?? column.id),
        label: String(column.label ?? column.field ?? column.id),
        hidden: column.hidden === true,
      })),
  /** Sichtbare Spalten setzen (persistiert; mit Bonelist folgt ein Reload). */
  apply: (visibleIds) => {
    const visible = new Set(visibleIds)
    hiddenFields.value = effectiveColumns.value
      .map((column) => String(column.field ?? column.id))
      .filter((id) => !visible.has(id))
    if (props.storageKey) {
      try {
        localStorage.setItem(props.storageKey, JSON.stringify(hiddenFields.value))
      } catch {
        // localStorage kann fehlen (Privatmodus) — dann eben nicht persistent.
      }
    }
    if (props.bonelist) void list.filter(requestParams()).catch(() => null)
  },
}

/** Serverseitige Suche — bzw. lokal, wenn alles geladen ist. */
function search(term) {
  const trimmed = String(term ?? "").trim()
  if (allLoaded.value) {
    clientSearch.value = trimmed
  } else {
    serverSearch.value = trimmed
    void list.filter(requestParams()).catch(() => null)
  }
}

/** Von vorn laden — mit den AKTUELLEN props.params (Context etc.). */
function refresh() {
  return list.filter(requestParams())
}

/** Beschriftung eines Eintrags: erster Textwert seiner Spalten, sonst der Key. */
function entryTitle(key) {
  const row = rows.value.find((entry) => String(entry.key) === String(key))
  if (!row) return String(key)
  for (const column of effectiveColumns.value) {
    const field = column.field
    if (!field) continue
    const text = column.formatter
      ? column.formatter(row[field], row)
      : row[field] === null || row[field] === undefined
        ? ""
        : String(row[field])
    if (text) return text
  }
  return String(key)
}

defineExpose({
  list,
  table: tableEl,
  refresh,
  search,
  columns: columnsApi,
  entryTitle,
  allLoaded,
  rows,
})
</script>

<style scoped>
.vi-vdt {
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-s);
  flex: 1;
  min-block-size: 0;
}

.vi-vdt-table {
  flex: 1;
  min-block-size: 0;
}
</style>
