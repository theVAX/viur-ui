// Öffentliche Oberfläche des DataTable-Widgets.
export { default as DataTable } from "./DataTable.vue"
export { default as ColumnFilterPanel } from "./ColumnFilterPanel.vue"
export * from "./types"
export {
  aggregate,
  aggregateColumn,
  compareValues,
  computeFacets,
  defaultText,
  findColumn,
  firstValueOf,
  getPath,
  isEmptyFilter,
  isEmptyValue,
  matchesFilter,
  nextSortState,
  resolveColumns,
  rowMatchesFilters,
  rowMatchesSearch,
  sortRows,
} from "./columns"
export {
  buildRows,
  collectKeys,
  flattenNodes,
  isDescendant,
  locateNode,
  nestByParent,
  orderValueFor,
  paginateNodes,
  selectionStateFor,
  type BuildRowsOptions,
  type BuiltRows,
  type ChildRowsAccessor,
  type NestedTree,
  type NodeLocation,
  type OrderValue,
  type SelectionState,
} from "./rows"
export { useColumnLayout, type ColumnLayout, type LayoutColumn } from "./useColumnLayout"
export { useGridNavigation } from "./useGridNavigation"
export { useVirtualRows } from "./useVirtualRows"
export {
  badgesForBone,
  boneFamily,
  boneText,
  columnsFromStructure,
  selectToneMap,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  type BoneDescription,
  type BoneStructure,
  type ColumnsFromStructureOptions,
} from "./viurColumns"
// ViurDataTable ist (wie ViurBrowser) ein JS-SFC — seine Typen liegen in
// ViurDataTable.d.vue.ts (Import: ".../DataTable/ViurDataTable.d.vue", wie
// bei ViForm).
// @ts-expect-error — JS-SFC ohne eingebettetes Typing
export { default as ViurDataTable } from "./ViurDataTable.vue"
