// Reine Zeilen-Pipeline: Filter → Suche → Sortierung → Baum/Gruppen →
// Paginierung → flache Anzeigezeilen. Ebenfalls Vue-frei und damit direkt
// testbar; die Komponente ruft das Ganze nur in einem computed auf.

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
  /** Baumdaten: Feldname oder Funktion, die die Kinder liefert. */
  childRows?: ChildRowsAccessor<R> | null
  /** Elternzeile bleibt sichtbar, wenn ein Nachfahre passt. */
  filterFromLeafRows?: boolean
  /** Gruppierung nach einer oder mehreren Spalten-ids (ohne Wirkung bei Baumdaten). */
  groupBy?: string[]
  /** Feld mit stabiler Zeilen-id. Ohne das werden Indexpfade benutzt ("0", "0.1"). */
  rowKey?: string | null
}

export interface BuiltRows<R extends Row = Row> {
  /** Hierarchie nach Filter/Sortierung/Gruppierung. */
  nodes: RowNode<R>[]
  /** Alle Datenzeilen in Anzeigereihenfolge (auch eingeklappte). */
  dataRows: R[]
  /** Nur oberste Ebene — für Fußzeilen-Funktionen bei Baumdaten. */
  topLevelRows: R[]
  /** Zeilen im Ergebnis (oberste Ebene bzw. Gruppen) über alle Seiten. */
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

/** Datenzeilen (mit Kindern) in Knoten überführen — Filter und Sortierung inklusive. */
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
    // Bei filterFromLeafRows zählt der Treffer eines Nachfahren; sonst nimmt
    // eine nicht passende Zeile ihren ganzen Teilbaum mit.
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

/** Datenknoten nach einer oder mehreren Spalten gruppieren. */
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

/** Facetten je filterbarer Spalte — jeweils ohne den eigenen Filter. */
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

/** Eine Seite aus der obersten Ebene schneiden (Teilbäume bleiben bei ihrem Elternteil). */
export function paginateNodes<R extends Row>(nodes: RowNode<R>[], page: number, pageSize: number): RowNode<R>[] {
  if (pageSize <= 0) return nodes
  const start = page * pageSize
  return nodes.slice(start, start + pageSize)
}

export interface FlattenOptions<R extends Row = Row> {
  isExpanded: (key: RowKey) => boolean
  /** Zeilen bekommen ein Detail-Panel (eigene Zeile unter der Datenzeile). */
  withDetail?: boolean
  /**
   * Für nachgeladene Ebenen: Zeile gilt als aufklappbar, obwohl (noch) keine
   * Kinder in den Daten stehen. Beim Nachladen weiß man vorher nicht, ob es
   * welche gibt — der Pfeil muss trotzdem von Anfang an da sein.
   */
  mayHaveChildren?: (node: RowNode<R>) => boolean
}

/**
 * Hierarchie zu einer flachen Renderliste machen: eingeklappte Teilbäume
 * fallen weg, aufgeklappte Detail-Panels kommen als eigene Zeile dazu.
 */
export function flattenNodes<R extends Row>(nodes: RowNode<R>[], options: FlattenOptions<R>): DisplayRow<R>[] {
  const out: DisplayRow<R>[] = []
  let dataIndex = 0

  /**
   * `lines` sind die Durchlauf-Spalten links des eigenen Winkels: je Eintrag
   * eine Spalte, in der eine senkrechte Linie durchläuft, weil der Vorfahre der
   * NÄCHSTEN Ebene noch ein Geschwister hat (siehe `DisplayRow.ancestorLines`).
   * Nach dem letzten Kind bleibt die Spalte leer.
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
      // Wurzeln erzeugen keine Durchlauf-Spalte (zwischen Wurzeln gibt es keine
      // Linie); ab Ebene 1 kommt je Ebene eine dazu.
      else if (hasChildren) {
        walk(node.children, node.depth === 0 ? [] : [...lines, !isLastChild])
      } else if (options.withDetail) out.push(detailRow())
    })
  }

  walk(nodes, [])
  return out
}

// ── Auswahl (Baum/Gruppen) ────────────────────────────────────────────

/** Alle Datenschlüssel eines Knotens inklusive Nachfahren. */
export function collectKeys<R extends Row>(node: RowNode<R>, into: RowKey[] = []): RowKey[] {
  if (node.kind === "data") into.push(node.key)
  for (const child of node.children) collectKeys(child, into)
  return into
}

export type SelectionState = "checked" | "indeterminate" | "unchecked"

/** Zustand der Checkbox eines Knotens (Elternteil spiegelt seine Kinder). */
export function selectionStateFor<R extends Row>(node: RowNode<R>, selected: Set<RowKey>): SelectionState {
  const keys = collectKeys(node)
  if (!keys.length) return "unchecked"
  const hits = keys.filter((key) => selected.has(key)).length
  if (hits === 0) return "unchecked"
  return hits === keys.length ? "checked" : "indeterminate"
}

// ── Flache Liste zu Baum ──────────────────────────────────────────────

export interface NestedTree<R extends Row = Row> {
  /** Zeilen der obersten Ebene, in Eingabereihenfolge. */
  roots: R[]
  /** Kinder je Zeilenschlüssel. */
  children: Map<RowKey, R[]>
}

/**
 * Aus einer FLACHEN Liste mit Eltern-Verweis (ViUR: `parententry`) die
 * Hierarchie bauen.
 *
 * Grundsatz: es geht nichts verloren. Zeilen ohne Elternwert sind Wurzeln;
 * Zeilen, deren Elternteil nicht in den Daten steckt (Waisen — etwa weil nur
 * eine Seite geladen ist), ebenfalls. Auch Zyklen (A → B → A, oder eine Zeile
 * als ihr eigener Elternteil) landen als Wurzel, statt die Liste zu sprengen
 * oder Zeilen verschwinden zu lassen.
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

  // Zyklen: alles, was zwar einen Elternteil hat, aber von keiner Wurzel aus
  // erreichbar ist, wird selbst zur Wurzel — sonst wäre es unsichtbar.
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
    // Kante zum (kreisenden) Elternteil kappen und als Wurzel führen.
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

// ── Position im Baum ──────────────────────────────────────────────────

export interface NodeLocation<R extends Row = Row> {
  node: RowNode<R>
  /** Schlüssel der Elternzeile; null auf der obersten Ebene. */
  parentKey: RowKey | null
  /** Geschwister einschließlich des Knotens selbst, in Anzeigereihenfolge. */
  siblings: RowNode<R>[]
  index: number
}

/** Knoten samt Elternteil und Geschwistern suchen. */
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
 * Liegt `candidateKey` im Teilbaum von `ancestorKey`? Verhindert, dass eine
 * Zeile in ihren eigenen Nachfahren gezogen wird — der Teilbaum hinge sonst
 * an sich selbst und wäre aus der Ansicht verschwunden.
 */
export function isDescendant<R extends Row>(nodes: RowNode<R>[], ancestorKey: RowKey, candidateKey: RowKey): boolean {
  const ancestor = locateNode(nodes, ancestorKey)
  if (!ancestor) return false
  const walk = (list: RowNode<R>[]): boolean => list.some((node) => node.key === candidateKey || walk(node.children))
  return walk(ancestor.node.children)
}

// ── Feste Reihenfolge (numerische Ordnungsspalte) ─────────────────────

export interface OrderValue {
  /** Neuer Wert für die Ordnungsspalte der verschobenen Zeile. */
  order: number
  /**
   * true, wenn die beiden Nachbarn NICHT unterscheidbar sind — praktisch immer
   * dann, wenn mehrere Datensätze denselben Ordnungswert tragen (frisch
   * angelegte Einträge mit Default 0 etwa). Die Mitte wäre dort wieder derselbe
   * Wert, die Zeile würde also nicht sichtbar wandern; stattdessen wird hinter
   * dem Block eingeordnet und die Anwendung kann neu durchnummerieren.
   *
   * Bei verteilten Fließkommawerten passiert das nicht: zwischen zwei Werten
   * liegen rund 50 Halbierungen, bevor die Genauigkeit ausgeht.
   */
  needsReindex: boolean
}

/**
 * Neuen Ordnungswert für eine Einfügeposition bestimmen — dieselbe Rechnung wie
 * im admin4: `(prev + next) / 2`, an den Rändern ±Schritt.
 *
 * `values` sind die Ordnungswerte der Zielliste OHNE die verschobene Zeile,
 * aufsteigend; `index` ist die Einfügeposition (0 = ganz vorn, values.length =
 * ganz hinten). Die Mitte zwischen den Nachbarn heißt: beim Verschieben muss
 * genau EIN Datensatz gespeichert werden, nicht die ganze Liste.
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
  // Gleiche (oder nicht unterscheidbare) Nachbarn: die Mitte träfe einen von
  // beiden — dann hinter dem Block einordnen, statt still nichts zu tun.
  const needsReindex = middle <= previous || middle >= next
  return { order: needsReindex ? previous + step : middle, needsReindex }
}
