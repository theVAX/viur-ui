<template>
  <div
    ref="rootEl"
    class="vi-treenav"
    role="tree"
    :aria-label="label ?? t('browser.navigation')"
    @keydown="onKeydown"
  >
    <template
      v-for="entry in visibleEntries"
      :key="entry.node.key"
    >
      <div
        class="vi-treenav-row"
        :class="{
          'is-current': entry.node.key === location,
          'is-drop': session?.state.over?.container === containerId && session?.state.over?.key === entry.node.key,
        }"
        role="treeitem"
        :aria-level="entry.depth + 1"
        :aria-expanded="canExpand(entry.node) ? expanded.has(entry.node.key) : undefined"
        :aria-selected="entry.node.key === location"
        :tabindex="entry.node.key === activeKey ? 0 : -1"
        :style="{ paddingInlineStart: `calc(${entry.depth} * var(--wa-space-m, 1rem))` }"
        :data-tree-key="entry.node.key"
        @click="open(entry.node)"
        @focus="activeKey = entry.node.key"
        @pointerdown="onPointerDown(entry.node, $event)"
      >
        <span
          class="vi-treenav-arrow"
          :class="{ 'is-open': expanded.has(entry.node.key), 'is-none': !canExpand(entry.node) }"
          @click.stop="toggle(entry.node)"
        >
          <wa-spinner v-if="loading.has(entry.node.key)"></wa-spinner>
          <wa-icon
            v-else
            name="chevron-right"
          ></wa-icon>
        </span>
        <wa-icon
          class="vi-treenav-icon"
          :name="entry.node.icon || 'folder'"
        ></wa-icon>
        <span class="vi-treenav-name">{{ entry.node.name }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
import { ref, computed, watch, inject, onMounted, onBeforeUnmount } from "vue"
import { DRAG_SESSION } from "./dragSession"

// Lean NAVIGATION tree: only nodes (name, icon, arrow), children are loaded
// via `loadChildren`. Deliberately no DataTable — navigation is not a data
// grid. As a drop target it registers with the browser's drag session
// (always "inside": into the folder that was hit).

const props = defineProps({
  /** Roots (e.g. the rootnodes) — { key, name, icon?, hasChildren? } */
  roots: { type: Array, default: () => [] },
  /** Fetch the children of a node: (node) => Promise<BrowserNode[]> */
  loadChildren: { type: Function, default: null },
  label: { type: [String, null], default: null },
  /** Container id in the drag session */
  containerId: { type: String, default: "tree" },
})
const location = defineModel({ type: [String, Number, null], default: null })
const emit = defineEmits(["navigate", "children-loaded"])

const { t } = useI18n()

const rootEl = ref(null)
const expanded = ref(new Set())
const loading = ref(new Set())
const children = ref(new Map()) // String(key) → BrowserNode[]
// Locally inserted nodes for levels not loaded yet: merged in when the level
// is first loaded (the server may lag behind briefly).
const pendingInserts = ref(new Map()) // String(key) → BrowserNode[]
const bucketOf = (key) => children.value.get(String(key))
const activeKey = ref(null)

const session = inject(DRAG_SESSION, null)

const visibleEntries = computed(() => {
  const out = []
  const walk = (nodes, depth) => {
    for (const node of nodes ?? []) {
      out.push({ node, depth })
      if (expanded.value.has(node.key)) walk(bucketOf(node.key), depth + 1)
    }
  }
  walk(props.roots, 0)
  return out
})

watch(
  () => props.roots,
  (roots) => {
    if (activeKey.value === null && roots?.length) activeKey.value = roots[0].key
    void expandRoots()
  },
  { immediate: true }
)

/** The roots (rootnodes) are always expanded — without a first click. */
async function expandRoots() {
  for (const root of props.roots ?? []) {
    if (expanded.value.has(root.key) || root.hasChildren === false) continue
    await fetchChildren(root).catch(() => null)
    if ((bucketOf(root.key) ?? []).length) {
      expanded.value = new Set(expanded.value).add(root.key)
    }
  }
}

function canExpand(node) {
  if (node.hasChildren === false) return false
  const known = bucketOf(node.key)
  return known ? known.length > 0 : true
}

async function fetchChildren(node, force = false) {
  if (!props.loadChildren || loading.value.has(node.key)) return
  if (!force && children.value.has(String(node.key))) return
  loading.value = new Set(loading.value).add(node.key)
  try {
    const result = (await props.loadChildren(node)) ?? []
    // Merge in nodes moved here locally (via drag & drop) — the server may
    // not know about the move yet. Whatever it already returns has thus
    // arrived and no longer needs a marker.
    const bucketKey = String(node.key)
    const pending = pendingInserts.value.get(bucketKey) ?? []
    const merged = [...result]
    for (const entry of pending) {
      if (!merged.some((candidate) => String(candidate.key) === String(entry.key))) merged.push(entry)
    }
    const remaining = pending.filter(
      (entry) => !result.some((candidate) => String(candidate.key) === String(entry.key))
    )
    if (remaining.length !== pending.length || !remaining.length) {
      const nextPending = new Map(pendingInserts.value)
      if (remaining.length) nextPending.set(bucketKey, remaining)
      else nextPending.delete(bucketKey)
      pendingInserts.value = nextPending
    }
    const next = new Map(children.value)
    next.set(bucketKey, merged)
    children.value = next
    emit("children-loaded", { node, children: merged })
  } finally {
    const next = new Set(loading.value)
    next.delete(node.key)
    loading.value = next
  }
}

async function toggle(node) {
  if (!canExpand(node)) return
  const next = new Set(expanded.value)
  if (next.has(node.key)) {
    next.delete(node.key)
    expanded.value = next
    return
  }
  try {
    await fetchChildren(node)
  } catch {
    return // level can't be loaded → stay collapsed
  }
  if ((bucketOf(node.key) ?? []).length) {
    next.add(node.key)
    expanded.value = next
  }
}

function open(node) {
  activeKey.value = node.key
  location.value = node.key
  emit("navigate", node)
  void toggle(node) // expanding is part of navigating; only the arrow collapses
}

/**
 * Take a node LOCALLY out of its previous level and — if the target level is
 * already loaded — attach it there. No request: a target level that isn't
 * loaded yet fetches it fresh from the server on first expand anyway.
 * `node` may be a full BrowserNode (for nodes the tree itself doesn't know
 * yet, e.g. folder rows from the list) or just a key.
 */
function moveNode(node, targetKey) {
  const key = typeof node === "object" && node !== null ? node.key : node
  const removed = removeNode(key)
  const entry = removed ?? (typeof node === "object" && node !== null ? node : null)
  if (entry == null || targetKey == null) return
  const bucketKey = String(targetKey)
  if (children.value.has(bucketKey)) {
    const next = new Map(children.value)
    next.set(bucketKey, [...(next.get(bucketKey) ?? []), entry])
    children.value = next
  } else {
    // Target level never loaded: queue it — on first load the node is
    // merged in (see fetchChildren). No request needed.
    const next = new Map(pendingInserts.value)
    next.set(bucketKey, [...(next.get(bucketKey) ?? []), entry])
    pendingInserts.value = next
  }
}

/** Remove a node locally from all loaded levels; returns it. */
function removeNode(key) {
  let removed = null
  const next = new Map(children.value)
  for (const [parent, list] of next) {
    const index = list.findIndex((candidate) => String(candidate.key) === String(key))
    if (index === -1) continue
    removed = list[index]
    next.set(parent, [...list.slice(0, index), ...list.slice(index + 1)])
  }
  if (removed) children.value = next
  for (const [parent, list] of pendingInserts.value) {
    const index = list.findIndex((candidate) => String(candidate.key) === String(key))
    if (index === -1) continue
    removed = removed ?? list[index]
    const nextPending = new Map(pendingInserts.value)
    const shortened = [...list.slice(0, index), ...list.slice(index + 1)]
    if (shortened.length) nextPending.set(parent, shortened)
    else nextPending.delete(parent)
    pendingInserts.value = nextPending
  }
  return removed
}

/** Discard a node's level and re-fetch it (e.g. after a move). */
function reloadChildren(key) {
  const entry = visibleEntries.value.find((candidate) => String(candidate.node.key) === String(key))
  if (!entry) return Promise.resolve()
  return fetchChildren(entry.node, true).catch(() => null)
}

function reset() {
  expanded.value = new Set()
  children.value = new Map()
  pendingInserts.value = new Map()
  void expandRoots()
}

// ── Keyboard (WAI-ARIA tree) ──────────────────────────────────────────────────
function onKeydown(event) {
  const entries = visibleEntries.value
  const index = entries.findIndex((entry) => entry.node.key === activeKey.value)
  if (index === -1) return
  const focusAt = (i) => {
    const entry = entries[Math.max(0, Math.min(entries.length - 1, i))]
    activeKey.value = entry.node.key
    rootEl.value?.querySelector(`[data-tree-key="${CSS.escape(String(entry.node.key))}"]`)?.focus()
  }
  const entry = entries[index]
  switch (event.key) {
    case "ArrowDown":
      focusAt(index + 1)
      break
    case "ArrowUp":
      focusAt(index - 1)
      break
    case "ArrowRight":
      if (!expanded.value.has(entry.node.key)) void toggle(entry.node)
      else focusAt(index + 1)
      break
    case "ArrowLeft":
      if (expanded.value.has(entry.node.key)) void toggle(entry.node)
      else {
        const parentIndex = entries.slice(0, index).findLastIndex((candidate) => candidate.depth === entry.depth - 1)
        if (parentIndex !== -1) focusAt(parentIndex)
      }
      break
    case "Home":
      focusAt(0)
      break
    case "End":
      focusAt(entries.length - 1)
      break
    case "Enter":
    case " ":
      open(entry.node)
      break
    default:
      return
  }
  event.preventDefault()
}

// ── Drag source: drag nodes into the list (or onto other nodes) ───────────────
// Only past a small movement threshold does a click become a drag — clicks
// for navigating stay clicks.
function onPointerDown(node, event) {
  if (!session || event.button !== 0) return
  // Roots (rootnodes) can't be moved.
  if (props.roots.some((root) => String(root.key) === String(node.key))) return
  const startX = event.clientX
  const startY = event.clientY
  let dragging = false
  const move = (moveEvent) => {
    if (!dragging && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 5) return
    if (!dragging) {
      dragging = true
      session.start({ keys: [node.key], rows: [node.data ?? node], source: props.containerId })
    }
    session.update(moveEvent.clientX, moveEvent.clientY)
  }
  const up = (upEvent) => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    if (!dragging) return
    session.update(upEvent.clientX, upEvent.clientY)
    if (session.state.over) session.drop()
    else session.cancel()
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}

// ── Drop target of the drag session ───────────────────────────────────────────
let unregister = null
let hoverTimer = null
let hoverKey = null

onMounted(() => {
  if (!session) return
  unregister = session.register({
    id: props.containerId,
    el: () => rootEl.value,
    targetFor: (hit) => {
      const row = hit.closest?.("[data-tree-key]")
      if (!row) return null
      const key = row.dataset.treeKey
      // Hovering over a collapsed folder expands it.
      if (hoverKey !== key) {
        hoverKey = key
        clearTimeout(hoverTimer)
        hoverTimer = setTimeout(() => {
          const entry = visibleEntries.value.find((candidate) => String(candidate.node.key) === key)
          if (entry && !expanded.value.has(entry.node.key)) void toggle(entry.node)
        }, 700)
      }
      return { container: props.containerId, key, mode: "inside" }
    },
  })
})
onBeforeUnmount(() => {
  unregister?.()
  clearTimeout(hoverTimer)
})

defineExpose({ reloadChildren, reset, moveNode, removeNode, expanded, children })
</script>

<style scoped>
.vi-treenav {
  min-inline-size: 0;
  overflow: auto;
  padding-block: var(--wa-space-2xs, 0.25rem);
}
.vi-treenav-row {
  display: flex;
  align-items: center;
  gap: var(--wa-space-2xs, 0.25rem);
  padding-block: var(--wa-space-2xs, 0.25rem);
  padding-inline-end: var(--wa-space-s, 0.5rem);
  border-radius: var(--wa-border-radius-s, 0.25rem);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.vi-treenav-row:hover {
  background: var(--wa-color-neutral-fill-quiet, rgba(0 0 0 / 0.05));
}
.vi-treenav-row.is-current {
  background: var(--wa-color-brand-fill-quiet, rgba(0 80 255 / 0.1));
  font-weight: 600;
}
.vi-treenav-row.is-drop {
  outline: 2px dashed var(--wa-color-brand-50, #2563eb);
  outline-offset: -2px;
}
.vi-treenav-arrow {
  display: inline-flex;
  inline-size: 1.25em;
  justify-content: center;
  transition: rotate 0.15s ease;
  flex: none;
}
.vi-treenav-arrow.is-open {
  rotate: 90deg;
}
.vi-treenav-arrow.is-none {
  visibility: hidden;
}
.vi-treenav-icon {
  flex: none;
}
.vi-treenav-name {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
