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
import { useI18n } from "vue-i18n"
import Browser from "./Browser.vue"
import { useTreeFetch, useListFetch, useListRootNodesFetch, useMoveFetch, uploadFile } from "../../request/index.js"
import { columnsFromStructure } from "../DataTable/viurColumns.ts"

// Thin ViUR wrapper around the generic browser: pass in `module`, done.
// Rootnodes via /listRootNodes, contents of the location via useTreeFetch
// (nodes + leaves), tree levels via list(skelType=node), moving via /move,
// uploads via uploadFile. Saving happens per row; the browser moves the view
// locally — only the location itself is reloaded, after uploads.

const props = defineProps({
  module: { type: String, required: true },
  renderer: { type: String, default: null },
  /** Fixed rootnode; without it, /listRootNodes is queried. */
  rootNode: { type: [String, Object], default: null },
  /** Columns; if omitted, derived from the viewLeafSkel structure. */
  columns: { type: Array, default: null },
  /** Only these bones as columns (for derived columns). */
  bones: { type: Array, default: null },
  /**
   * Display language of multilingual bones ("de", "en" or "*" for all, with the
   * primary one first) — determines display AND local sorting of the columns.
   */
  language: { type: String, default: null },
  primaryLanguage: { type: String, default: null },
  params: { type: Object, default: () => ({}) },
  orderField: { type: String, default: "sortindex" },
  uploads: { type: Boolean, default: false },
  tableProps: { type: Object, default: () => ({}) },
})
const emit = defineEmits(["open", "moved", "move-failed", "uploaded", "upload-failed"])
const { t } = useI18n()

const browserEl = ref(null)
const location = defineModel("location", { type: [String, Number, null], default: null })
const selectedKeys = defineModel("selectedKeys", { type: Array, default: () => [] })

const ctx = computed(() => (props.renderer ? { renderer: props.renderer } : {}))

// Page size of the cursor bar = ViUR parameter `limit` (core ≥ 3.9; the
// former `amount` no longer exists there). It applies from the FIRST fetch:
// a pageSize given via tableProps (or a `limit` in the params) already
// determines the initial request; otherwise 30 (ViUR default). The actual
// fetch size is always what's displayed.
const limit = ref(Math.min(99, Number(props.params?.limit ?? props.tableProps?.pageSize ?? 30) || 30))
const baseParams = () => ({ ...props.params, orderby: props.orderField, limit: limit.value })
// Every fetch after setup ALWAYS uses the current location (rootnode or
// navigated folder) as parententry — otherwise the server lists across the
// whole tree.
const currentParams = () => ({
  ...baseParams(),
  ...(location.value != null ? { parententry: location.value } : {}),
})
const mergedTableProps = computed(() => ({
  // No search in the browser: navigation happens via tree and breadcrumb,
  // searching in the module's list view. Anyone who wants it anyway sets
  // `tableProps.withSearch` (locally only useful once everything is loaded:
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

// ── Contents of the current location (nodes + leaves) ─────────────────────────
const tree = useTreeFetch(props.module, {
  params: baseParams(),
  parententry: location.value ?? undefined,
  ...(props.renderer ? { renderer: props.renderer } : {}),
  immediate: false,
})
const rows = computed(() => tree.data.value)
const rowKind = (row) => (row?.skelType === "node" ? "node" : "leaf")

// Without an explicit location, the ROOTNODE is the location: as soon as it is
// known, it becomes the default `parententry` for everything — list fetch,
// drops onto the empty area, reorder and uploads. Never fetch without parententry.
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

// Everything loaded (tree.complete)? Then sorting, search and column
// filters run only LOCALLY on the complete dataset.
const allLoaded = computed(() => tree.complete.value)

const effectiveColumns = computed(() => {
  if (props.columns) return props.columns
  const structure = tree.structure.value?.leaf ?? tree.structure.value?.node ?? {}
  const derived = columnsFromStructure(structure, {
    ...(props.bones ? { bones: props.bones } : {}),
    ...(props.language ? { language: props.language } : {}),
    ...(props.primaryLanguage ? { primaryLanguage: props.primaryLanguage } : {}),
    local: allLoaded.value,
    boolTexts: [t("bones.bool.true"), t("bones.bool.false")],
  })
  return derived.length ? derived : [{ id: "name", label: t("browser.name") }]
})

function onNavigate() {
  selectedKeys.value = []
}

// ── Cursor loading: 1 / 5 / 10 pages or everything ───────────────────────────
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

/** New page size: re-fetch the current location with the changed `limit`. */
function onPageSizeChange({ pageSize }) {
  if (!pageSize || pageSize === limit.value) return
  limit.value = Math.min(99, pageSize)
  void tree.filter(currentParams()).catch(() => null)
}

// ── Moving (drop on tree/folder) & reordering ────────────────────────────────
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
    // The caller handles errors (onMove/onReorder catch and report).
    throw error
  }
}

async function onMove({ rows: movedRows, target, keys, source }) {
  try {
    for (const row of movedRows) {
      // From the TREE come BrowserNodes ({ key, name, data }) — the skel
      // lives in `data`, and a tree entry is always a node. From the
      // LIST come skels with skelType.
      const raw = row?.data ?? row
      await saveMove(raw, target, undefined, source === "tree" ? "node" : rowKind(raw))
    }
    emit("moved", { keys, target })
    // View (list AND tree) has already been moved locally — no reload.
  } catch (error) {
    emit("move-failed", { keys, target, error })
    // The local state (list AND tree) is then wrong — fetch it fresh once.
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
    // New entries only come from the server — fetch the current location once.
    void tree.execute().catch(() => null)
  }
}

// ── Tree levels (nodes only) ──────────────────────────────────────────────────
async function loadNodeChildren(node) {
  const list = useListFetch(props.module, {
    // Tree levels are navigation: as complete as possible (ViUR maximum 99).
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
 * Reload everything: the list of the current location AND the navigation tree.
 * The tree discards its loaded levels and expands the rootnodes again
 * (fresh from the server); open sublevels reload when expanded.
 */
function refresh() {
  browserEl.value?.tree?.reset?.()
  return tree.execute()
}

defineExpose({ browser: browserEl, tree, refresh })
</script>
