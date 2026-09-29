// Pure row pipeline: filter → search → sort → tree/groups →
// pagination → flat display rows. Also Vue-free and therefore directly
// testable; the component just calls the whole thing inside a computed.

import { aggregateColumn, defaultText, findColumn, rowMatchesFilters, rowMatchesSearch, sortRows } from "./columns"
import type { ColumnFacets, DisplayRow, FilterEntry, ResolvedColumn, Row, RowKey, RowNode, SortEntry } from "./types"
import { computeFacets, isEmptyFilter } from "./columns"

export type ChildRowsAccessor<R extends Row = Row> = string | ((row: R) => R[] | undefined | null)

export interface BuildRowsOptions<R extends Row = Row> {
  data: R[]
  columns: ResolvedColumn<R>[]
  sort?: SortEntry[]
  filters?: FilterEntry[]
  search?: string
  searchFn?: ((value: unknown, term: string, row: R) => boolean) | null
  /** Tree data: field name or function that returns the children. */
  childRows?: ChildRowsAccessor<R> | null
  /** Parent row stays visible when a descendant matches. */
  filterFromLeafRows?: boolean
  /** Grouping by one or more column ids (no effect on tree data). */
  groupBy?: string[]
  /** Field with a stable row id. Without it, index paths are used ("0", "0.1"). */
  rowKey?: string | null
}

export interface BuiltRows<R extends Row = Row> {
  /** Hierarchy after filtering/sorting/grouping. */
  nodes: RowNode<R>[]
  /** All data rows in display order (including collapsed ones). */
  dataRows: R[]
  /** Top level only — for footer functions with tree data. */
  topLevelRows: R[]
  /** Rows in the result (top level or groups) across all pages. */
  filteredCount: number
  facets: Record<string, ColumnFacets>
}

function childrenOf<R extends Row>(row: R, accessor: ChildRowsAccessor<R> | null | undefined): R[] {
  if (!accessor) return []
  const value = typeof accessor === "function" ? accessor(row) : (row[accessor] as R[] | undefined)
  return Array.isArray(value) ? value : []
}

function keyOf<R extends Row>(row: R, rowKey: string | null | undefined, path: string): RowKey {
  if (rowKey) {
    const value = row[rowKey]
    if (value !== undefined && value !== null) return value as RowKey
  }
  return path
}

/** Convert data rows (with children) into nodes — filtering and sorting included. */
function buildDataNodes<R extends Row>(
  rows: R[],
  options: BuildRowsOptions<R>,
  depth: number,
  pathPrefix: string
): RowNode<R>[] {
  const { columns, filters = [], search = "", searchFn, childRows, filterFromLeafRows } = options
  const sorted = sortRows(rows, options.sort ?? [], columns)

  const nodes: RowNode<R>[] = []
  sorted.forEach((row, index) => {
    const path = pathPrefix ? `${pathPrefix}.${index}` : String(index)
    const selfMatches = rowMatchesFilters(row, filters, columns) && rowMatchesSearch(row, search, columns, searchFn)

    const rawChildren = childrenOf(row, childRows)
    // With filterFromLeafRows a descendant's match counts; otherwise a
    // non-matching row takes its whole subtree with it.
    const children = rawChildren.length ? buildDataNodes(rawChildren, options, depth + 1, path) : []

    if (!selfMatches && !(filterFromLeafRows && children.length)) return

    nodes.push({
      kind: "data",
      key: keyOf(row, options.rowKey, path),
      depth,
      row,
      children,
    })
  })
  return nodes
}

/** Group data nodes by one or more columns. */
function groupNodes<R extends Row>(
  nodes: RowNode<R>[],
  groupBy: string[],
  columns: ResolvedColumn<R>[],
  depth: number,
  pathPrefix: string
): RowNode<R>[] {
  const [current, ...rest] = groupBy
  const column = findColumn(columns, current)
  if (!column) return nodes

  const groups = new Map<string, { value: unknown; nodes: RowNode<R>[] }>()
  for (const node of nodes) {
    if (!node.row) continue
    const value = column.get(node.row)
    const key = defaultText(value)
    const bucket = groups.get(key)
    if (bucket) bucket.nodes.push(node)
    else groups.set(key, { value, nodes: [node] })
  }

  return [...groups.entries()].map(([key, bucket], index) => {
    const path = pathPrefix ? `${pathPrefix}.${key}` : `group:${current}:${key}`
    const children = rest.length
      ? groupNodes(bucket.nodes, rest, columns, depth + 1, path)
      : bucket.nodes.map((node) => ({ ...node, depth: depth + 1 }))
    const groupRows = bucket.nodes.map((node) => node.row!).filter(Boolean)
    const aggregates: Record<string, unknown> = {}
    for (const col of columns) {
      const value = aggregateColumn(col, groupRows)
      if (value !== undefined) aggregates[col.id] = value
    }
    return {
      kind: "group" as const,
      key: `${path}#${index}`,
      depth,
      children,
      groupColumnId: current,
      groupValue: bucket.value,
      groupCount: groupRows.length,
      groupRows,
      aggregates,
    }
  })
}

function collectDataRows<R extends Row>(nodes: RowNode<R>[], into: R[] = []): R[] {
  for (const node of nodes) {
    if (node.row) into.push(node.row)
    if (node.children.length) collectDataRows(node.children, into)
  }
  return into
}

/** Facets per filterable column — each without its own filter. */
function buildFacets<R extends Row>(options: BuildRowsOptions<R>): Record<string, ColumnFacets> {
  const { columns, filters = [], search = "", searchFn, childRows } = options
  const flat = flattenData(options.data, childRows)
  const facets: Record<string, ColumnFacets> = {}
  for (const column of columns) {
    if (!column.filterable) continue
    const others = filters.filter((filter) => filter.id !== column.id && !isEmptyFilter(filter.value))
    const base = flat.filter(
      (row) => rowMatchesFilters(row, others, columns) && rowMatchesSearch(row, search, columns, searchFn)
    )
    facets[column.id] = computeFacets(base, column)
  }
  return facets
}

function flattenData<R extends Row>(
  rows: R[],
  childRows: ChildRowsAccessor<R> | null | undefined,
  into: R[] = []
): R[] {
  for (const row of rows) {
    into.push(row)
    const children = childrenOf(row, childRows)
    if (children.length) flattenData(children, childRows, into)
  }
  return into
}

export function buildRows<R extends Row>(options: BuildRowsOptions<R>): BuiltRows<R> {
  const nodes = buildDataNodes(options.data, options, 0, "")
  const grouped =
    options.groupBy?.length && !options.childRows ? groupNodes(nodes, options.groupBy, options.columns, 0, "") : nodes

  return {
    nodes: grouped,
    dataRows: collectDataRows(grouped),
    topLevelRows: nodes.map((node) => node.row!).filter(Boolean),
    filteredCount: grouped.length,
    facets: buildFacets(options),
  }
}

/** Slice one page from the top level (subtrees stay with their parent). */
export function paginateNodes<R extends Row>(nodes: RowNode<R>[], page: number, pageSize: number): RowNode<R>[] {
  if (pageSize <= 0) return nodes
  const start = page * pageSize
  return nodes.slice(start, start + pageSize)
}

export interface FlattenOptions<R extends Row = Row> {
  isExpanded: (key: RowKey) => boolean
  /** Rows get a detail panel (a separate row below the data row). */
  withDetail?: boolean
  /**
   * For lazily loaded levels: the row counts as expandable even though there
   * are no children in the data (yet). When lazy loading, you don't know in
   * advance whether there are any — the arrow must still be there from the start.
   */
  mayHaveChildren?: (node: RowNode<R>) => boolean
}

/**
 * Turn the hierarchy into a flat render list: collapsed subtrees are
 * dropped, expanded detail panels are added as separate rows.
 */
export function flattenNodes<R extends Row>(nodes: RowNode<R>[], options: FlattenOptions<R>): DisplayRow<R>[] {
  const out: DisplayRow<R>[] = []
  let dataIndex = 0

  /**
   * `lines` are the pass-through columns left of the row's own connector: one
   * column per entry in which a vertical line runs through, because the ancestor
   * of the NEXT level still has a sibling (see `DisplayRow.ancestorLines`).
   * After the last child the column stays empty.
   */
  const walk = (list: RowNode<R>[], lines: boolean[]): void => {
    list.forEach((node, position) => {
      const isLastChild = position === list.length - 1
      const hasChildren = node.children.length > 0
      const expandable =
        node.kind === "group"
          ? hasChildren
          : hasChildren || Boolean(options.withDetail) || Boolean(options.mayHaveChildren?.(node))
      const expanded = expandable && options.isExpanded(node.key)

      const base = {
        nodeKey: node.key,
        depth: node.depth,
        ancestorLines: lines,
        isLastChild,
        row: node.row,
        node,
      }

      out.push({
        ...base,
        kind: node.kind,
        key: String(node.key),
        expandable,
        expanded,
        index: node.kind === "data" ? dataIndex++ : -1,
      })

      if (!expanded) return
      const detailRow = (): DisplayRow<R> => ({
        ...base,
        kind: "detail",
        key: `${String(node.key)}::detail`,
        expandable: false,
        expanded: true,
        index: -1,
      })

      if (node.kind === "data" && options.withDetail && !hasChildren) out.push(detailRow())
      // Roots create no pass-through column (there is no line between roots);
      // from level 1 on, one is added per level.
      else if (hasChildren) {
        walk(node.children, node.depth === 0 ? [] : [...lines, !isLastChild])
      } else if (options.withDetail) out.push(detailRow())
    })
  }

  walk(nodes, [])
  return out
}

// ── Selection (tree/groups) ───────────────────────────────────────────

/** All data keys of a node including descendants. */
export function collectKeys<R extends Row>(node: RowNode<R>, into: RowKey[] = []): RowKey[] {
  if (node.kind === "data") into.push(node.key)
  for (const child of node.children) collectKeys(child, into)
  return into
}

export type SelectionState = "checked" | "indeterminate" | "unchecked"

/** Checkbox state of a node (parent mirrors its children). */
export function selectionStateFor<R extends Row>(node: RowNode<R>, selected: Set<RowKey>): SelectionState {
  const keys = collectKeys(node)
  if (!keys.length) return "unchecked"
  const hits = keys.filter((key) => selected.has(key)).length
  if (hits === 0) return "unchecked"
  return hits === keys.length ? "checked" : "indeterminate"
}

// ── Flat list to tree ─────────────────────────────────────────────────

export interface NestedTree<R extends Row = Row> {
  /** Top-level rows, in input order. */
  roots: R[]
  /** Children per row key. */
  children: Map<RowKey, R[]>
}

/**
 * Build the hierarchy from a FLAT list with parent references (ViUR:
 * `parententry`).
 *
 * Principle: nothing gets lost. Rows without a parent value are roots; so are
 * rows whose parent isn't in the data (orphans — e.g. because only one page
 * is loaded). Cycles (A → B → A, or a row that is its own parent) also end
 * up as roots, instead of blowing up the list or making rows disappear.
 */
export function nestByParent<R extends Row>(rows: R[], rowKey: string, parentField: string): NestedTree<R> {
  const byKey = new Map<RowKey, R>()
  for (const row of rows) {
    const key = row[rowKey] as RowKey | undefined
    if (key !== undefined && key !== null) byKey.set(key, row)
  }

  const children = new Map<RowKey, R[]>()
  const roots: R[] = []
  const attached = new Set<R>()

  for (const row of rows) {
    const key = row[rowKey] as RowKey | undefined
    const parent = row[parentField] as RowKey | undefined
    const hasParent = parent !== undefined && parent !== null && parent !== "" && parent !== key && byKey.has(parent)

    if (!hasParent) {
      roots.push(row)
      continue
    }
    const list = children.get(parent!) ?? []
    list.push(row)
    children.set(parent!, list)
    attached.add(row)
  }

  // Cycles: anything that has a parent but isn't reachable from any root
  // becomes a root itself — otherwise it would be invisible.
  const reachable = new Set<R>()
  const walk = (list: R[]): void => {
    for (const row of list) {
      if (reachable.has(row)) continue
      reachable.add(row)
      const key = row[rowKey] as RowKey | undefined
      if (key !== undefined) walk(children.get(key) ?? [])
    }
  }
  walk(roots)

  for (const row of rows) {
    if (!attached.has(row) || reachable.has(row)) continue
    // Cut the edge to the (cyclic) parent and treat it as a root.
    const parent = row[parentField] as RowKey
    const siblings = children.get(parent)
    if (siblings) {
      const index = siblings.indexOf(row)
      if (index !== -1) siblings.splice(index, 1)
    }
    roots.push(row)
    walk([row])
  }

  return { roots, children }
}

// ── Position in the tree ──────────────────────────────────────────────

export interface NodeLocation<R extends Row = Row> {
  node: RowNode<R>
  /** Key of the parent row; null on the top level. */
  parentKey: RowKey | null
  /** Siblings including the node itself, in display order. */
  siblings: RowNode<R>[]
  index: number
}

/** Find a node along with its parent and siblings. */
export function locateNode<R extends Row>(
  nodes: RowNode<R>[],
  key: RowKey,
  parentKey: RowKey | null = null
): NodeLocation<R> | null {
  const index = nodes.findIndex((node) => node.key === key)
  if (index !== -1) return { node: nodes[index], parentKey, siblings: nodes, index }
  for (const node of nodes) {
    if (!node.children.length) continue
    const found = locateNode(node.children, key, node.key)
    if (found) return found
  }
  return null
}

/**
 * Is `candidateKey` in the subtree of `ancestorKey`? Prevents a row from
 * being dragged into its own descendant — the subtree would otherwise hang
 * from itself and disappear from the view.
 */
export function isDescendant<R extends Row>(nodes: RowNode<R>[], ancestorKey: RowKey, candidateKey: RowKey): boolean {
  const ancestor = locateNode(nodes, ancestorKey)
  if (!ancestor) return false
  const walk = (list: RowNode<R>[]): boolean => list.some((node) => node.key === candidateKey || walk(node.children))
  return walk(ancestor.node.children)
}

// ── Fixed order (numeric order column) ────────────────────────────────

export interface OrderValue {
  /** New value for the order column of the moved row. */
  order: number
  /**
   * true if the two neighbors are NOT distinguishable — in practice whenever
   * several records carry the same order value (e.g. freshly created entries
   * with default 0). The midpoint there would be the same value again, so the
   * row wouldn't visibly move; instead it is placed after the block and the
   * application can renumber.
   *
   * This doesn't happen with spread-out floating-point values: there are about
   * 50 halvings between two values before precision runs out.
   */
  needsReindex: boolean
}

/**
 * Determine a new order value for an insert position — the same calculation as
 * in admin4: `(prev + next) / 2`, ±step at the edges.
 *
 * `values` are the order values of the target list WITHOUT the moved row,
 * ascending; `index` is the insert position (0 = very front, values.length =
 * very end). Using the midpoint between neighbors means: when moving, exactly
 * ONE record has to be saved, not the whole list.
 */
export function orderValueFor(values: number[], index: number, step = 1): OrderValue {
  const clean = values.filter((value) => Number.isFinite(value))
  const position = Math.max(0, Math.min(clean.length, index))

  if (!clean.length) return { order: step, needsReindex: false }
  if (position === 0) return { order: clean[0] - step, needsReindex: false }
  if (position === clean.length) {
    return { order: clean[clean.length - 1] + step, needsReindex: false }
  }

  const previous = clean[position - 1]
  const next = clean[position]
  const middle = previous + (next - previous) / 2
  // Equal (or indistinguishable) neighbors: the midpoint would hit one of
  // them — so place it after the block instead of silently doing nothing.
  const needsReindex = middle <= previous || middle >= next
  return { order: needsReindex ? previous + step : middle, needsReindex }
}
