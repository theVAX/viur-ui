<template>
  <div class="vi-browser">
    <header class="vi-browser-head">
      <wa-select
        v-if="rootNodes.length > 1"
        class="vi-browser-roots"
        :value="String(activeRoot ?? '')"
        size="small"
        @change="onRootChange($event.target.value)"
      >
        <wa-option
          v-for="root in rootNodes"
          :key="root.key"
          :value="String(root.key)"
        >
          {{ root.name }}
        </wa-option>
      </wa-select>

      <nav
        class="vi-browser-breadcrumb"
        :aria-label="t('browser.path')"
      >
        <template
          v-for="(entry, index) in breadcrumb"
          :key="entry.key"
        >
          <span
            v-if="index"
            class="vi-browser-crumb-sep"
            aria-hidden="true"
          >
            /
          </span>
          <button
            class="vi-browser-crumb"
            type="button"
            :aria-current="index === breadcrumb.length - 1 ? 'location' : undefined"
            @click="navigateTo(entry.key)"
          >
            {{ entry.name }}
          </button>
        </template>
      </nav>

      <div class="vi-browser-actions">
        <slot name="actions"></slot>
      </div>
    </header>

    <wa-split-panel
      class="vi-browser-body"
      primary="start"
      position-in-pixels="260"
      snap="0px 260px"
    >
      <aside
        slot="start"
        class="vi-browser-tree"
      >
        <TreeNav
          ref="treeEl"
          :model-value="location"
          :roots="treeRoots"
          :load-children="loadNodeChildren"
          container-id="tree"
          :label="label"
          @update:model-value="navigateTo($event)"
          @children-loaded="onTreeChildren"
        />
      </aside>

      <main
        slot="end"
        ref="listEl"
        class="vi-browser-list"
        :class="{ 'is-drop-target': listIsDropTarget }"
        @dragenter="onFileDragEnter"
        @dragover="onFileDragOver"
        @dragleave="onFileDragLeave"
        @drop="onFileDrop"
      >
        <DataTable
          ref="tableEl"
          v-model:selected-keys="selectedKeys"
          :data="visibleRows"
          :columns="columns"
          :row-key="rowKey"
          :selectable="selectable"
          :order-field="orderField"
          :loading="loading"
          drag-source="list"
          :label="label"
          :has-more="hasMore"
          appearance="plain"
          v-bind="tableProps"
          @row-dblclick="onRowDoubleClick"
          @row-reorder="$emit('reorder', $event)"
          @load-more="$emit('load-more', $event)"
          @page-change="$emit('page-change', $event)"
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

        <div
          v-if="uploads && fileDragDepth > 0"
          class="vi-browser-dropzone"
        >
          <wa-icon name="upload"></wa-icon>
          <span>{{ uploadHint ?? t("browser.uploadHint") }}</span>
        </div>
      </main>
    </wa-split-panel>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
import { ref, computed, provide, watch } from "vue"
import { DataTable } from "../DataTable/index.ts"
import TreeNav from "./TreeNav.vue"
import { createDragSession, dropModeFor, DRAG_SESSION } from "./dragSession.ts"

// --------------------------------------------------------------------------- //
// Browser — tree for navigation + DataTable as list                            //
// --------------------------------------------------------------------------- //
//
// GENERIC core: knows nothing about ViUR. The app (or ViurBrowser.vue) supplies
// rootnodes, the contents of the current location (`rows`, folders first) and a
// loader for the tree levels — and gets intents back as events:
//   navigate  — another location chosen (tree, breadcrumb, double-click on folder)
//   open      — double-click on an entry (leaf)
//   move      — drag & drop between list and tree, or into a folder row
//   reorder   — reordering within the list (DataTable row-reorder, 1:1)
//   upload    — files dragged from the OS into the list
// The browser loads nothing itself and only moves the VIEW — saving and
// reloading are up to the app (see ViurBrowser for the ViUR variant).

const props = defineProps({
  /** Roots/repositories: { key, name, icon? } */
  rootNodes: { type: Array, default: () => [] },
  /** Contents of the current location — folders first (see rowKind). */
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: "key" },
  /** Classifies a row: "node" (folder) or "leaf". */
  rowKind: { type: Function, default: (row) => (row?.skelType === "node" ? "node" : "leaf") },
  /** Children of a tree node: (node) => Promise<BrowserNode[]> */
  loadNodeChildren: { type: Function, default: null },
  orderField: { type: String, default: "sortindex" },
  selectable: { type: [String, Boolean], default: "multiple" },
  loading: { type: Boolean, default: false },
  /** Accept OS files (only the `upload` event, no upload code here). */
  uploads: { type: Boolean, default: false },
  uploadHint: { type: [String, null], default: null },
  label: { type: String, default: "Browser" },
  /** Cursor loading: null = off, otherwise "is there more?" (DataTable bar). */
  hasMore: { type: [Boolean, null], default: null },
  /** Further DataTable props (withSearch, size, …). */
  tableProps: { type: Object, default: () => ({}) },
})

const location = defineModel("location", { type: [String, Number, null], default: null })
const selectedKeys = defineModel("selectedKeys", { type: Array, default: () => [] })
const emit = defineEmits(["navigate", "open", "move", "reorder", "upload", "load-more", "page-change"])

const { t } = useI18n()

const treeEl = ref(null)
const tableEl = ref(null)
const listEl = ref(null)

// ── Rootnodes & location ──────────────────────────────────────────────────────
// The active root follows from the location (breadcrumb root); without a
// location the first rootnode applies. A change in the select navigates to its root.
const nodeIndex = ref(new Map()) // key → { node, parent }

watch(
  () => props.rootNodes,
  (roots) => {
    const next = new Map(nodeIndex.value)
    for (const root of roots ?? []) next.set(String(root.key), { node: root, parent: null })
    nodeIndex.value = next
    if (location.value == null && roots?.length) navigateTo(roots[0].key)
  },
  { immediate: true }
)

const breadcrumb = computed(() => {
  const out = []
  let key = location.value
  const seen = new Set()
  while (key != null && !seen.has(String(key))) {
    seen.add(String(key))
    const entry = nodeIndex.value.get(String(key))
    out.unshift({ key, name: entry?.node?.name ?? String(key) })
    key = entry?.parent ?? null
  }
  return out
})

const activeRoot = computed(() => breadcrumb.value[0]?.key ?? props.rootNodes[0]?.key ?? null)
const treeRoots = computed(() => {
  if (props.rootNodes.length <= 1) return props.rootNodes
  const active = props.rootNodes.find((root) => String(root.key) === String(activeRoot.value))
  return active ? [active] : props.rootNodes
})

function rememberNodes(nodes, parent) {
  const next = new Map(nodeIndex.value)
  for (const node of nodes ?? []) next.set(String(node.key), { node, parent })
  nodeIndex.value = next
}

function onTreeChildren({ node, children }) {
  rememberNodes(children, node.key)
}

function navigateTo(key) {
  if (key === location.value) return
  location.value = key
  emit("navigate", { key, node: nodeIndex.value.get(String(key))?.node ?? null })
}

function onRootChange(value) {
  const root = props.rootNodes.find((candidate) => String(candidate.key) === value)
  if (root) navigateTo(root.key)
}

function onRowDoubleClick({ row, key }) {
  if (props.rowKind(row) === "node") {
    // Remember the folder from the list so the breadcrumb knows its name.
    rememberNodes([{ key, name: rowName(row), data: row }], location.value)
    navigateTo(key)
  } else {
    emit("open", { row, key })
  }
}

function rowName(row) {
  const value = row?.name
  return typeof value === "string" ? value : (value?.name ?? String(row?.[props.rowKey] ?? ""))
}

// ── Local view of the list ────────────────────────────────────────────────────
// A drag is purely client-side: rows that LEAVE the current location are
// hidden; nodes dragged HERE from the tree are inserted. `rows` (the app's
// data) stay untouched — new data or a change of location discards the
// overlay.
const movedAway = ref(new Set())
const movedIn = ref([])

const visibleRows = computed(() => {
  let out = props.rows
  if (movedAway.value.size) {
    out = out.filter((row) => !movedAway.value.has(String(row[props.rowKey])))
  }
  if (movedIn.value.length) {
    const present = new Set(out.map((row) => String(row[props.rowKey])))
    out = [...out, ...movedIn.value.filter((row) => !present.has(String(row[props.rowKey])))]
  }
  return out
})

function resetLocalMoves() {
  if (movedAway.value.size) movedAway.value = new Set()
  if (movedIn.value.length) movedIn.value = []
}
watch(() => props.rows, resetLocalMoves)
watch(location, resetLocalMoves)

// ── Drag session (list ↔ tree) ────────────────────────────────────────────────
const session = createDragSession((payload, target) => {
  // Nothing drops into itself or its own subtree: discard the target.
  if (payload.keys.some((key) => String(key) === String(target.key))) return
  let parent = target.key != null ? nodeIndex.value.get(String(target.key))?.parent : null
  const seen = new Set()
  while (parent != null && !seen.has(String(parent))) {
    if (payload.keys.some((key) => String(key) === String(parent))) return
    seen.add(String(parent))
    parent = nodeIndex.value.get(String(parent))?.parent ?? null
  }

  // Update the view immediately — without reload.
  const targetIsCurrent = location.value != null && String(target.key) === String(location.value)
  if (targetIsCurrent) {
    const away = new Set(movedAway.value)
    for (const key of payload.keys) away.delete(String(key))
    movedAway.value = away
    if (payload.source === "tree") {
      // Tree node dragged into the open level: insert as a folder row.
      const rows = payload.rows.map((row) => row?.data ?? row).filter(Boolean)
      movedIn.value = [...movedIn.value, ...rows]
    }
  } else {
    movedAway.value = new Set([...movedAway.value, ...payload.keys.map((key) => String(key))])
    movedIn.value = movedIn.value.filter(
      (row) => !payload.keys.some((key) => String(key) === String(row[props.rowKey]))
    )
    // Whatever left the location is no longer selected either.
    selectedKeys.value = selectedKeys.value.filter(
      (selected) => !payload.keys.some((key) => String(key) === String(selected))
    )
  }

  // The TREE also updates locally: moved FOLDERS change (or leave) their
  // loaded level — without reload. Leaves don't appear in the navigation
  // tree and need nothing.
  for (const row of payload.rows) {
    const raw = row?.data ?? row
    const isNode = payload.source === "tree" || props.rowKind(raw) === "node"
    if (!isNode) continue
    const key = raw?.[props.rowKey] ?? row?.key
    const node = { key, name: nodeIndex.value.get(String(key))?.node?.name ?? rowName(raw), data: raw }
    treeEl.value?.moveNode?.(node, target.key)
    rememberNodes([node], target.key) // keep the breadcrumb parent chain up to date
  }

  emit("move", {
    keys: payload.keys,
    rows: payload.rows,
    target: target.key,
    mode: target.mode,
    source: payload.source === "tree" ? "tree" : "list",
  })
})
provide(DRAG_SESSION, session)

// The list itself is a drop target — in both directions:
// • The MIDDLE of a folder row means "into"; the edges (before/after) are
//   left to the table's internal reordering.
// • If the drag comes from the TREE, the rest of the list (leaf rows,
//   empty area) is a target too: "into the currently open folder".
session.register({
  id: "list",
  el: () => listEl.value,
  targetFor: (hit, _x, y) => {
    const fromTree = session.state.payload?.source === "tree"
    const intoCurrent =
      fromTree && location.value != null ? { container: "list", key: location.value, mode: "inside" } : null
    const rowEl = hit.closest?.("[data-key]")
    if (!rowEl) return intoCurrent
    const row = visibleRows.value.find((candidate) => String(candidate[props.rowKey]) === rowEl.dataset.key)
    if (!row || props.rowKind(row) !== "node") return intoCurrent
    if (dropModeFor(rowEl.getBoundingClientRect(), y) !== "inside") return intoCurrent
    return { container: "list", key: row[props.rowKey], mode: "inside" }
  },
})

/** Drag from the tree targets the open level → highlight the whole list. */
const listIsDropTarget = computed(
  () =>
    session.state.over?.container === "list" &&
    location.value != null &&
    String(session.state.over?.key) === String(location.value)
)

// ── Upload dropzone (native, only for OS files) ──────────────────────────────
const fileDragDepth = ref(0)
const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes("Files")
function onFileDragEnter(event) {
  if (!props.uploads || !hasFiles(event)) return
  event.preventDefault()
  fileDragDepth.value++
}
function onFileDragOver(event) {
  if (!props.uploads || !hasFiles(event)) return
  event.preventDefault()
}
function onFileDragLeave(event) {
  if (!props.uploads || !hasFiles(event)) return
  fileDragDepth.value = Math.max(0, fileDragDepth.value - 1)
}
function onFileDrop(event) {
  if (!props.uploads || !hasFiles(event)) return
  event.preventDefault()
  fileDragDepth.value = 0
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) emit("upload", { files, target: location.value })
}

defineExpose({ table: tableEl, tree: treeEl, session, navigateTo })
</script>

<style scoped>
.vi-browser {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  block-size: 100%;
  /* Framed like the list widget (DataTable `appearance="outlined"`): ONE
     box around tree and list. The table inside therefore stays frameless
     (appearance="plain" below), otherwise there would be two nested frames. */
  background-color: var(--wa-color-surface-default, #fff);
  border: var(--wa-border-width-s, 1px) solid var(--wa-color-surface-border, #ddd);
  border-radius: var(--wa-border-radius-m, 0.5rem);
  overflow: hidden;
  /* One text size for the whole box — the same as in the table
     (.vi-dt), so breadcrumb and tree don't look larger than the list. */
  font-size: var(--wa-font-size-s, 0.875rem);
}
.vi-browser-head {
  display: flex;
  align-items: center;
  gap: var(--wa-space-s, 0.5rem);
  padding: var(--wa-space-2xs, 0.25rem) var(--wa-space-xs, 0.5rem);
  border-block-end: 1px solid var(--wa-color-surface-border, #ddd);
  /* Set off like the table header (--dt-header-background). */
  background-color: var(--wa-color-surface-lowered, #f4f4f5);
}
.vi-browser-roots {
  min-inline-size: 10rem;
}
.vi-browser-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--wa-space-2xs, 0.25rem);
  overflow: hidden;
  flex: 1;
}
.vi-browser-crumb {
  border: none;
  background: none;
  padding: var(--wa-space-2xs, 0.25rem);
  border-radius: var(--wa-border-radius-s, 0.25rem);
  cursor: pointer;
  color: inherit;
  white-space: nowrap;
}
.vi-browser-crumb:hover {
  background: var(--wa-color-neutral-fill-quiet, rgba(0 0 0 / 0.05));
}
.vi-browser-crumb[aria-current="location"] {
  font-weight: 600;
}
.vi-browser-crumb-sep {
  color: var(--wa-color-text-quiet, #888);
}
.vi-browser-body {
  flex: 1;
  min-block-size: 0;
  /* <wa-split-panel> IS the grid (display: grid on the host). Its row is
     content-sized by itself and thus overflows the fixed height — the
     table would then be as tall as its rows and lengthen the page instead
     of scrolling within itself. A single full-height row binds the panels
     to the area. Applies to the horizontal split, which is fixed
     here. */
  grid-template-rows: 100%;
  /* Sidebar no smaller than 10rem, list keeps at least half */
  --min: 10rem;
  --max: 50%;
}
.vi-browser-tree {
  block-size: 100%;
  overflow: auto;
  padding: var(--wa-space-2xs, 0.25rem);
}
.vi-browser-list {
  block-size: 100%;
  position: relative;
  min-inline-size: 0;
  min-block-size: 0;
  display: flex;
  flex-direction: column;
}
.vi-browser-list > :deep(.vi-dt) {
  flex: 1;
  min-block-size: 0;
}
.vi-browser-list.is-drop-target {
  outline: 2px dashed var(--wa-color-brand-50, #2563eb);
  outline-offset: -2px;
}
.vi-browser-dropzone {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--wa-space-s, 0.5rem);
  background: color-mix(in oklab, var(--wa-color-surface-default, #fff) 80%, transparent);
  border: 2px dashed var(--wa-color-brand-50, #2563eb);
  border-radius: var(--wa-border-radius-m, 0.5rem);
  pointer-events: none;
  font-weight: 600;
}
</style>
