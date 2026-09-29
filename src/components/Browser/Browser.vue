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
import { DataTable } from "../DataTable"
import TreeNav from "./TreeNav.vue"
import { createDragSession, dropModeFor, DRAG_SESSION } from "./dragSession"

// --------------------------------------------------------------------------- //
// Browser — Baum zur Navigation + DataTable als Liste                          //
// --------------------------------------------------------------------------- //
//
// GENERISCHER Kern: kennt kein ViUR. Die App (oder ViurBrowser.vue) liefert
// Rootnodes, den Inhalt des aktuellen Ortes (`rows`, Ordner zuerst) und einen
// Loader für die Baum-Ebenen — und bekommt Absichten als Events zurück:
//   navigate  — anderer Ort gewählt (Baum, Breadcrumb, Doppelklick auf Ordner)
//   open      — Doppelklick auf einen Eintrag (Leaf)
//   move      — Drag & Drop zwischen Liste und Baum bzw. in eine Ordnerzeile
//   reorder   — Umsortieren innerhalb der Liste (DataTable row-reorder, 1:1)
//   upload    — Dateien aus dem OS in die Liste gezogen
// Der Browser lädt selbst nichts und verschiebt nur die ANSICHT — Speichern
// und Nachladen entscheidet die App (siehe ViurBrowser für die ViUR-Variante).

const props = defineProps({
  /** Wurzeln/Repositories: { key, name, icon? } */
  rootNodes: { type: Array, default: () => [] },
  /** Inhalt des aktuellen Ortes — Ordner zuerst (siehe rowKind). */
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: "key" },
  /** Ordnet eine Zeile ein: "node" (Ordner) oder "leaf". */
  rowKind: { type: Function, default: (row) => (row?.skelType === "node" ? "node" : "leaf") },
  /** Kinder eines Baumknotens: (node) => Promise<BrowserNode[]> */
  loadNodeChildren: { type: Function, default: null },
  orderField: { type: String, default: "sortindex" },
  selectable: { type: [String, Boolean], default: "multiple" },
  loading: { type: Boolean, default: false },
  /** OS-Dateien annehmen (nur Event `upload`, kein Upload-Code hier). */
  uploads: { type: Boolean, default: false },
  uploadHint: { type: [String, null], default: null },
  label: { type: String, default: "Browser" },
  /** Cursor-Nachladen: null = aus, sonst „gibt es mehr?" (DataTable-Leiste). */
  hasMore: { type: [Boolean, null], default: null },
  /** Weitere DataTable-Props (withSearch, size, …). */
  tableProps: { type: Object, default: () => ({}) },
})

const location = defineModel("location", { type: [String, Number, null], default: null })
const selectedKeys = defineModel("selectedKeys", { type: Array, default: () => [] })
const emit = defineEmits(["navigate", "open", "move", "reorder", "upload", "load-more", "page-change"])

const { t } = useI18n()

const treeEl = ref(null)
const tableEl = ref(null)
const listEl = ref(null)

// ── Rootnodes & Ort ───────────────────────────────────────────────────────────
// Der aktive Root ergibt sich aus dem Ort (Breadcrumb-Wurzel); ohne Ort gilt
// der erste Rootnode. Ein Wechsel im Select navigiert auf dessen Wurzel.
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
    // Ordner aus der Liste merken, damit der Breadcrumb seinen Namen kennt.
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

// ── Lokale Sicht auf die Liste ────────────────────────────────────────────────
// Ein Zug ist rein clientseitig: Zeilen, die den aktuellen Ort VERLASSEN,
// werden ausgeblendet; Knoten, die aus dem Baum HIERHER gezogen wurden, werden
// eingefügt. `rows` (die Daten der App) bleiben unangetastet — neue Daten oder
// ein Ortswechsel verwerfen die Überlagerung.
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

// ── Drag-Session (Liste ↔ Baum) ───────────────────────────────────────────────
const session = createDragSession((payload, target) => {
  // In sich selbst oder den eigenen Teilbaum fällt nichts: Ziel verwerfen.
  if (payload.keys.some((key) => String(key) === String(target.key))) return
  let parent = target.key != null ? nodeIndex.value.get(String(target.key))?.parent : null
  const seen = new Set()
  while (parent != null && !seen.has(String(parent))) {
    if (payload.keys.some((key) => String(key) === String(parent))) return
    seen.add(String(parent))
    parent = nodeIndex.value.get(String(parent))?.parent ?? null
  }

  // Ansicht sofort nachziehen — ohne Reload.
  const targetIsCurrent = location.value != null && String(target.key) === String(location.value)
  if (targetIsCurrent) {
    const away = new Set(movedAway.value)
    for (const key of payload.keys) away.delete(String(key))
    movedAway.value = away
    if (payload.source === "tree") {
      // Baumknoten in die offene Ebene gezogen: als Ordnerzeile einfügen.
      const rows = payload.rows.map((row) => row?.data ?? row).filter(Boolean)
      movedIn.value = [...movedIn.value, ...rows]
    }
  } else {
    movedAway.value = new Set([...movedAway.value, ...payload.keys.map((key) => String(key))])
    movedIn.value = movedIn.value.filter(
      (row) => !payload.keys.some((key) => String(key) === String(row[props.rowKey]))
    )
    // Was den Ort verlassen hat, ist auch nicht mehr ausgewählt.
    selectedKeys.value = selectedKeys.value.filter(
      (selected) => !payload.keys.some((key) => String(key) === String(selected))
    )
  }

  // Auch der BAUM zieht lokal nach: verschobene ORDNER wechseln (oder
  // verlassen) ihre geladene Ebene — ohne Reload. Blätter tauchen im
  // Navigations-Baum nicht auf und brauchen nichts.
  for (const row of payload.rows) {
    const raw = row?.data ?? row
    const isNode = payload.source === "tree" || props.rowKind(raw) === "node"
    if (!isNode) continue
    const key = raw?.[props.rowKey] ?? row?.key
    const node = { key, name: nodeIndex.value.get(String(key))?.node?.name ?? rowName(raw), data: raw }
    treeEl.value?.moveNode?.(node, target.key)
    rememberNodes([node], target.key) // Breadcrumb-Elternkette aktuell halten
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

// Die Liste ist selbst Drop-Ziel — in beide Richtungen:
// • Die MITTE einer Ordnerzeile heißt „hinein"; die Ränder (davor/dahinter)
//   überlässt sie der internen Umsortierung der Tabelle.
// • Kommt der Zug aus dem BAUM, ist auch der Rest der Liste (Leaf-Zeilen,
//   freie Fläche) ein Ziel: „in den gerade geöffneten Ordner".
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

/** Zug aus dem Baum zielt auf die offene Ebene → die ganze Liste markieren. */
const listIsDropTarget = computed(
  () =>
    session.state.over?.container === "list" &&
    location.value != null &&
    String(session.state.over?.key) === String(location.value)
)

// ── Upload-Dropzone (native, nur für OS-Dateien) ─────────────────────────────
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
  /* Gerahmt wie das Listen-Widget (DataTable `appearance="outlined"`): EIN
     Kasten um Baum und Liste. Die Tabelle darin bleibt deshalb rahmenlos
     (appearance="plain" unten), sonst stünden zwei Rahmen ineinander. */
  background-color: var(--wa-color-surface-default, #fff);
  border: var(--wa-border-width-s, 1px) solid var(--wa-color-surface-border, #ddd);
  border-radius: var(--wa-border-radius-m, 0.5rem);
  overflow: hidden;
  /* Eine Textgröße für den ganzen Kasten — dieselbe wie in der Tabelle
     (.vi-dt), damit Breadcrumb und Baum nicht größer wirken als die Liste. */
  font-size: var(--wa-font-size-s, 0.875rem);
}
.vi-browser-head {
  display: flex;
  align-items: center;
  gap: var(--wa-space-s, 0.5rem);
  padding: var(--wa-space-2xs, 0.25rem) var(--wa-space-xs, 0.5rem);
  border-block-end: 1px solid var(--wa-color-surface-border, #ddd);
  /* Abgesetzt wie der Kopf der Tabelle (--dt-header-background). */
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
  /* <wa-split-panel> IST das Grid (display: grid am Host). Seine Zeile ist von
     sich aus inhaltshoch und läuft damit über die feste Höhe hinaus — die
     Tabelle wäre dann so hoch wie ihre Zeilen und würde die Seite verlängern
     statt in sich zu scrollen. Eine Zeile über die volle Höhe bindet die
     Panels an die Fläche. Gilt für die waagerechte Aufteilung, die hier fest
     eingestellt ist. */
  grid-template-rows: 100%;
  /* Seitenleiste nicht kleiner als 10rem, Liste behält mindestens die Hälfte */
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
