<template>
  <Browser
    ref="browserEl"
    v-model:location="location"
    v-model:selected-keys="selectedKeys"
    :root-nodes="rootNodeList"
    :rows="rows"
    :columns="effectiveColumns"
    row-key="key"
    :row-kind="rowKind"
    :load-node-children="loadNodeChildren"
    :order-field="orderField"
    :loading="tree.isFetching.value"
    :uploads="uploads"
    :label="module"
    :has-more="tree.hasMore.value"
    :table-props="mergedTableProps"
    @open="$emit('open', $event)"
    @navigate="onNavigate"
    @move="onMove"
    @reorder="onReorder"
    @upload="onUpload"
    @load-more="onLoadMore"
    @page-change="onPageSizeChange"
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
  </Browser>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import Browser from "./Browser.vue"
import { useTreeFetch, useListFetch, useListRootNodesFetch, useMoveFetch, uploadFile } from "../../request/index.js"
import { columnsFromStructure } from "../DataTable/viurColumns"

// Dünner ViUR-Wrapper um den generischen Browser: `module` rein, fertig.
// Rootnodes über /listRootNodes, Inhalt des Ortes über useTreeFetch (Nodes +
// Leaves), Baum-Ebenen über list(skelType=node), Verschieben über /move,
// Uploads über uploadFile. Gespeichert wird pro Zeile; die Ansicht verschiebt
// der Browser lokal — nachgeladen wird nur der Ort selbst nach Uploads.

const props = defineProps({
  module: { type: String, required: true },
  renderer: { type: String, default: null },
  /** Fester Rootnode; ohne ihn wird /listRootNodes befragt. */
  rootNode: { type: [String, Object], default: null },
  /** Spalten; ohne Angabe aus der viewLeafSkel-Struktur abgeleitet. */
  columns: { type: Array, default: null },
  /** Nur diese Bones als Spalten (bei abgeleiteten Spalten). */
  bones: { type: Array, default: null },
  /**
   * Anzeigesprache mehrsprachiger Bones ("de", "en" oder "*" für alle mit der
   * primären vorn) — bestimmt Anzeige UND lokale Sortierung der Spalten.
   */
  language: { type: String, default: null },
  primaryLanguage: { type: String, default: null },
  params: { type: Object, default: () => ({}) },
  orderField: { type: String, default: "sortindex" },
  uploads: { type: Boolean, default: false },
  tableProps: { type: Object, default: () => ({}) },
})
const emit = defineEmits(["open", "moved", "move-failed", "uploaded", "upload-failed"])

const browserEl = ref(null)
const location = defineModel("location", { type: [String, Number, null], default: null })
const selectedKeys = defineModel("selectedKeys", { type: Array, default: () => [] })

const ctx = computed(() => (props.renderer ? { renderer: props.renderer } : {}))

// Seitengröße der Cursor-Leiste = ViUR-Parameter `limit` (core ≥ 3.9; das
// frühere `amount` gibt es dort nicht mehr). Sie gilt vom ERSTEN Fetch an:
// eine per tableProps vorgegebene pageSize (oder ein `limit` in den params)
// bestimmt schon den Initial-Request; sonst 30 (ViUR-Standard). Angezeigt
// wird immer die tatsächliche Fetch-Größe.
const limit = ref(Math.min(99, Number(props.params?.limit ?? props.tableProps?.pageSize ?? 30) || 30))
const baseParams = () => ({ ...props.params, orderby: props.orderField, limit: limit.value })
// Für jeden Fetch nach dem Setup gilt: IMMER mit dem aktuellen Ort (Rootnode
// oder navigierter Ordner) als parententry — sonst listet der Server quer
// über den ganzen Baum.
const currentParams = () => ({
  ...baseParams(),
  ...(location.value != null ? { parententry: location.value } : {}),
})
const mergedTableProps = computed(() => ({
  // Keine Suche im Browser: navigiert wird über Baum und Breadcrumb, gesucht
  // wird in der Listen-Ansicht des Moduls. Wer sie doch will, setzt
  // `tableProps.withSearch` (lokal sinnvoll nur, wenn alles geladen ist:
  // `allLoaded`).
  ...props.tableProps,
  pageSize: limit.value,
}))

// ── Rootnodes ────────────────────────────────────────────────────────────────
const rootNodesFetch = props.rootNode ? null : useListRootNodesFetch(props.module, "/", {}, ctx.value)
const rootNodeList = computed(() => {
  if (props.rootNode) {
    return typeof props.rootNode === "string"
      ? [{ key: props.rootNode, name: props.module }]
      : [{ name: props.module, ...props.rootNode }]
  }
  const list = rootNodesFetch?.data?.value
  return Array.isArray(list) ? list.map((entry) => ({ key: entry.key, name: entry.name ?? entry.key })) : []
})

// ── Inhalt des aktuellen Ortes (Nodes + Leaves) ───────────────────────────────
const tree = useTreeFetch(props.module, {
  params: baseParams(),
  parententry: location.value ?? undefined,
  ...(props.renderer ? { renderer: props.renderer } : {}),
  immediate: false,
})
const rows = computed(() => tree.data.value)
const rowKind = (row) => (row?.skelType === "node" ? "node" : "leaf")

// Ohne expliziten Ort ist die ROOTNODE der Ort: sobald sie bekannt ist, wird
// sie zum Standard-`parententry` für alles — Listen-Fetch, Drops auf die
// freie Fläche, Reorder und Uploads. Gefetcht wird nie ohne parententry.
watch(
  rootNodeList,
  (roots) => {
    if (location.value == null && roots.length) location.value = roots[0].key
  },
  { immediate: true }
)

watch(
  location,
  (parent) => {
    if (parent != null) void tree.open(parent).catch(() => null)
  },
  { immediate: true }
)

// Alles geladen (tree.complete)? Dann laufen Sortierung, Suche und
// Spaltenfilter nur noch LOKAL auf dem vollständigen Datensatz.
const allLoaded = computed(() => tree.complete.value)

const effectiveColumns = computed(() => {
  if (props.columns) return props.columns
  const structure = tree.structure.value?.leaf ?? tree.structure.value?.node ?? {}
  const derived = columnsFromStructure(structure, {
    ...(props.bones ? { bones: props.bones } : {}),
    ...(props.language ? { language: props.language } : {}),
    ...(props.primaryLanguage ? { primaryLanguage: props.primaryLanguage } : {}),
    local: allLoaded.value,
  })
  return derived.length ? derived : [{ id: "name", label: "Name" }]
})

function onNavigate() {
  selectedKeys.value = []
}

// ── Cursor-Nachladen: 1 / 5 / 10 Seiten oder alles ───────────────────────────
async function onLoadMore({ pages }) {
  if (pages === "all") {
    await tree.nextAll().catch(() => null)
    return
  }
  let remaining = pages
  while (remaining-- > 0 && tree.hasMore.value) {
    await tree.next().catch(() => null)
  }
}

/** Neue Seitengröße: aktuellen Ort mit geändertem `limit` neu holen. */
function onPageSizeChange({ pageSize }) {
  if (!pageSize || pageSize === limit.value) return
  limit.value = Math.min(99, pageSize)
  void tree.filter(currentParams()).catch(() => null)
}

// ── Verschieben (Drop auf Baum/Ordner) & Umsortieren ─────────────────────────
async function saveMove(row, parentNode, sortindex, kind = rowKind(row)) {
  const data = {
    skelType: kind,
    key: row.key,
    parentNode,
    ...(sortindex !== undefined ? { sortindex } : {}),
  }
  const result = useMoveFetch(props.module, "/", data, { ...ctx.value, immediate: false })
  try {
    await result.execute()
    return result.data.value
  } catch (error) {
    // Fehler trägt der Aufrufer aus (onMove/onReorder fangen und melden).
    throw error
  }
}

async function onMove({ rows: movedRows, target, keys, source }) {
  try {
    for (const row of movedRows) {
      // Aus dem BAUM kommen BrowserNodes ({ key, name, data }) — das Skel
      // steckt in `data`, und ein Baum-Eintrag ist immer ein Node. Aus der
      // LISTE kommen Skels mit skelType.
      const raw = row?.data ?? row
      await saveMove(raw, target, undefined, source === "tree" ? "node" : rowKind(raw))
    }
    emit("moved", { keys, target })
    // Ansicht (Liste UND Baum) ist bereits lokal verschoben — kein Reload.
  } catch (error) {
    emit("move-failed", { keys, target, error })
    // Der lokale Stand (Liste UND Baum) ist dann falsch — einmal frisch holen.
    void refresh().catch(() => null)
  }
}

async function onReorder({ row, order, parent, parentChanged, key }) {
  try {
    await saveMove(row, parent ?? location.value, order)
    emit("moved", { keys: [key], target: parent ?? location.value, parentChanged })
  } catch (error) {
    emit("move-failed", { keys: [key], target: parent, error })
    void refresh().catch(() => null)
  }
}

// ── Uploads ───────────────────────────────────────────────────────────────────
async function onUpload({ files, target }) {
  const results = []
  for (const file of files) {
    try {
      results.push(await uploadFile(file, { target: target ?? undefined, renderer: props.renderer ?? undefined }))
    } catch (error) {
      emit("upload-failed", { file, error })
    }
  }
  if (results.length) {
    emit("uploaded", { files: results, target })
    // Neue Einträge gibt es nur vom Server — den aktuellen Ort einmal holen.
    void tree.execute().catch(() => null)
  }
}

// ── Baum-Ebenen (nur Nodes) ───────────────────────────────────────────────────
async function loadNodeChildren(node) {
  const list = useListFetch(props.module, {
    // Baum-Ebenen sind Navigation: möglichst vollständig (ViUR-Maximum 99).
    params: { skelType: "node", parententry: node.key, orderby: props.orderField, limit: 99 },
    ...(props.renderer ? { renderer: props.renderer } : {}),
    immediate: false,
  })
  await list.execute().catch(() => null)
  return list.data.value.map((skel) => ({
    key: skel.key,
    name: typeof skel.name === "string" ? skel.name : (skel.name?.name ?? skel.key),
    data: skel,
  }))
}

/**
 * Alles neu laden: die Liste des aktuellen Ortes UND den Navigations-Baum.
 * Der Baum verwirft seine geladenen Ebenen und klappt die Rootnodes wieder
 * auf (frisch vom Server); offene Unterebenen laden beim Aufklappen neu.
 */
function refresh() {
  browserEl.value?.tree?.reset?.()
  return tree.execute()
}

defineExpose({ browser: browserEl, tree, refresh })
</script>
