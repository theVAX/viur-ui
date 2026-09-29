import { describe, it, expect } from "vitest"
import {
  buildModuleTree,
  flattenModuleTree,
  findModule,
  visibleModuleTree,
  hasModuleAccess,
  handlerType,
  normalizeModulePath,
} from "../../src/request/configStore.js"

const GROUPS = {
  shop: { name: "Shop", icon: "cart", sortIndex: 1 },
  content: { name: "Content", sortIndex: 2 },
  reports: { name: "Reports", moduleGroup: "shop" }, // nested group
  empty: { name: "Empty" }, // no children → hidden
}

const MODULES = {
  user: { name: "Users", handler: "list.user", icon: "person", sortIndex: 10 },
  file: { name: "Files", handler: "tree.simple.file", moduleGroup: "content" },
  page: { name: "Pages", handler: "tree.node.page", moduleGroup: "content", display: "hidden" },
  settings: { name: "Settings", handler: "singleton.settings" },
  "shop.order": {
    name: "Orders",
    handler: "list.grouped.order",
    moduleGroup: "shop",
    context: { shop: "main" },
    views: [
      { name: "Paid", group: "paid", filter: { paid: 1 }, context: { paid: true } },
      { name: "Open", group: "open", filter: { paid: 0 }, sortIndex: 1 },
    ],
  },
  "shop.stats": { name: "Stats", handler: "list.stats", moduleGroup: "reports" },
  orphan: { name: "Orphan", handler: "list.orphan", moduleGroup: "does-not-exist" },
  zeta: { name: "Zeta", handler: "list.zeta" },
  alpha: { name: "Alpha", handler: "list.alpha" },
}

const byKey = (tree) => flattenModuleTree(tree)

describe("helpers", () => {
  it("normalizeModulePath accepts slashes", () => {
    expect(normalizeModulePath("shop/order")).toBe("shop.order")
  })

  it("handlerType classifies handlers", () => {
    expect(handlerType("list.user")).toBe("list")
    expect(handlerType("list")).toBe("list")
    expect(handlerType("tree.simple.file")).toBe("tree")
    expect(handlerType("tree.node.page")).toBe("hierarchy")
    expect(handlerType("singleton.settings")).toBe("singleton")
    expect(handlerType(null)).toBeNull()
    expect(handlerType("custom")).toBeNull()
  })

  it("hasModuleAccess: root, module flags, group flags, base module name", () => {
    expect(hasModuleAccess(["root"], "anything")).toBe(true)
    expect(hasModuleAccess(["user-edit"], "user")).toBe(true)
    expect(hasModuleAccess(["user-view"], "user")).toBe(false)
    expect(hasModuleAccess(["user-view"], "user", { showWithViewAccess: true })).toBe(true)
    expect(hasModuleAccess(["order-paid-add"], "shop.order", { group: "paid" })).toBe(true)
    expect(hasModuleAccess(["order-add"], "shop.order", { group: "paid" })).toBe(false)
    expect(hasModuleAccess(["shop.order-delete"], "shop.order")).toBe(true)
    expect(hasModuleAccess(["order-delete"], "shop.order")).toBe(true)
    expect(hasModuleAccess([], "user")).toBe(false)
  })
})

describe("buildModuleTree", () => {
  it("places modules below their group and keeps unknown groups at top level", () => {
    const tree = buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["root"] })
    const lookup = byKey(tree)

    // alphabetical: "Orders" before "Reports"
    expect(lookup["group:shop"].children.map((c) => c.key)).toEqual(["shop.order", "group:reports"])
    expect(lookup["group:content"].children.map((c) => c.key)).toEqual(["file", "page"])
    expect(lookup["group:reports"].parent).toBe("group:shop")
    expect(lookup["shop.stats"].parent).toBe("group:reports")
    expect(lookup["orphan"].parent).toBeNull()
    expect(tree.map((n) => n.key)).toContain("orphan")
  })

  it("sorts by explicit sortIndex first, then alphabetically", () => {
    const tree = buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["root"] })
    expect(tree.map((n) => n.key)).toEqual([
      "group:shop", // 1
      "group:content", // 2
      "user", // 10
      "alpha",
      "group:empty",
      "orphan",
      "settings",
      "zeta",
    ])
  })

  it("turns views into child nodes inheriting the module info", () => {
    const tree = buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["root"] })
    const order = byKey(tree)["shop.order"]
    expect(order.children.map((c) => c.key)).toEqual(["shop.order#1", "shop.order#0"]) // "Open" has sortIndex 1
    const paid = order.children.find((c) => c.key === "shop.order#0")
    expect(paid.type).toBe("view")
    expect(paid.view).toBe(0)
    expect(paid.module).toBe("shop.order")
    expect(paid.parent).toBe("shop.order")
    expect(paid.group).toBe("paid")
    expect(paid.handler).toBe("list.grouped.order")
    expect(paid.info.filter).toEqual({ paid: 1 })
    expect(paid.info.context).toEqual({ shop: "main", paid: true })
    expect(paid.info.views).toBeUndefined()
    // the module's own info is untouched
    expect(MODULES["shop.order"].views).toHaveLength(2)
  })

  it("derives hasAccess and visibility from the access flags", () => {
    const tree = buildModuleTree({
      modules: MODULES,
      groups: GROUPS,
      access: ["user-edit", "order-paid-view", "order-open-add"],
    })
    const lookup = byKey(tree)

    expect(lookup["user"].hasAccess).toBe(true)
    expect(lookup["user"].visible).toBe(true)
    expect(lookup["settings"].hasAccess).toBe(false)
    expect(lookup["settings"].visible).toBe(false)

    // grouped views: only the -open- rights grant, -view alone does not
    expect(lookup["shop.order#0"].hasAccess).toBe(false)
    expect(lookup["shop.order#1"].hasAccess).toBe(true)
    // module itself has no plain right, but a visible child keeps it visible
    expect(lookup["shop.order"].hasAccess).toBe(false)
    expect(lookup["shop.order"].visible).toBe(true)
    expect(lookup["group:shop"].visible).toBe(true)

    // content: file inaccessible, page hidden → group hidden
    expect(lookup["group:content"].visible).toBe(false)
    expect(lookup["group:reports"].visible).toBe(false)
    expect(lookup["group:empty"].visible).toBe(false)
  })

  it("display hidden / group are respected", () => {
    const tree = buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["root"] })
    const lookup = byKey(tree)
    expect(lookup["page"].display).toBe("hidden")
    expect(lookup["page"].visible).toBe(false)
    expect(lookup["page"].hasAccess).toBe(true) // still usable (e.g. relational bone)

    const withGroupDisplay = buildModuleTree({
      modules: { x: { name: "X", handler: "list.x", display: "group", views: [{ name: "V" }] } },
      access: ["root"],
    })
    expect(withGroupDisplay[0].hasAccess).toBe(false)
    expect(withGroupDisplay[0].visible).toBe(true) // because of the visible view
  })

  it("visibleModuleTree prunes hidden nodes", () => {
    const tree = buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["user-edit"] })
    const visible = visibleModuleTree(tree)
    expect(visible.map((n) => n.key)).toEqual(["user"])
    expect(visible[0].children).toEqual([])
  })

  it("handles empty input", () => {
    expect(buildModuleTree()).toEqual([])
    expect(buildModuleTree({ modules: null, groups: null })).toEqual([])
  })
})

describe("findModule", () => {
  const lookup = byKey(buildModuleTree({ modules: MODULES, groups: GROUPS, access: ["root"] }))

  it("finds modules by dotted or slashed path", () => {
    expect(findModule(lookup, "shop.order").name).toBe("Orders")
    expect(findModule(lookup, "shop/order").name).toBe("Orders")
    expect(findModule(lookup, "nope")).toBeNull()
    expect(findModule(lookup, null)).toBeNull()
  })

  it("finds views by index, numeric string, group or name", () => {
    expect(findModule(lookup, "shop.order", 0).name).toBe("Paid")
    expect(findModule(lookup, "shop.order", "1").name).toBe("Open")
    expect(findModule(lookup, "shop.order", "open").name).toBe("Open")
    expect(findModule(lookup, "shop.order", "Paid").group).toBe("paid")
    expect(findModule(lookup, "shop.order", 5)).toBeNull()
    expect(findModule(lookup, "user", "x")).toBeNull()
  })
})

// viur-shop registers its modules as NESTED modules of an instance (attribute
// `shop` in the main app): core keys them "shop.cart", "shop.order", … in
// /vi/config, every one carries `moduleGroup: "viur-shop"` and the access
// rights are prefixed with the sub module's own moduleName ("cart-add").
describe("nested modules (viur-shop)", () => {
  const SHOP_MODULES = {
    "shop.address": { name: "Address", handler: "list.address", moduleGroup: "viur-shop" },
    "shop.cart": { name: "Cart", handler: "tree.node.cart", moduleGroup: "viur-shop", icon: "cart3" },
    "shop.order": { name: "Order", handler: "list.order", moduleGroup: "viur-shop", icon: "cart-check" },
    "shop.pp_paypal": { name: "PayPal", handler: "list.paypal", moduleGroup: "viur-shop", display: "hidden" },
    // a second shop instance
    "b2b.order": { name: "B2B Order", handler: "list.order", moduleGroup: "b2b-shop" },
  }
  const SHOP_GROUPS = { "viur-shop": { name: "Shop", icon: "shop" }, "b2b-shop": { name: "B2B" } }

  it("places nested modules below the shop group and keeps their dotted keys", () => {
    const tree = buildModuleTree({ modules: SHOP_MODULES, groups: SHOP_GROUPS, access: ["root"] })
    const lookup = flattenModuleTree(tree)
    expect(lookup["group:viur-shop"].children.map((c) => c.key)).toEqual([
      "shop.address",
      "shop.cart",
      "shop.order",
      "shop.pp_paypal",
    ])
    expect(lookup["shop.cart"].baseModule).toBe("cart")
    expect(lookup["shop.cart"].handlerType).toBe("hierarchy")
    expect(lookup["group:b2b-shop"].children.map((c) => c.key)).toEqual(["b2b.order"])
  })

  it("grants access via the sub module's own right prefix (cart-add, order-edit)", () => {
    const tree = buildModuleTree({ modules: SHOP_MODULES, groups: SHOP_GROUPS, access: ["cart-add", "order-edit"] })
    const lookup = flattenModuleTree(tree)
    expect(lookup["shop.cart"].hasAccess).toBe(true)
    expect(lookup["shop.order"].hasAccess).toBe(true)
    // the same right also unlocks the other instance's order module — that is
    // how core prefixes rights (moduleName only), not a viur-ui decision
    expect(lookup["b2b.order"].hasAccess).toBe(true)
    expect(lookup["shop.address"].hasAccess).toBe(false)
    expect(visibleModuleTree(tree).map((n) => n.key)).toEqual(["group:b2b-shop", "group:viur-shop"])
  })

  it("is found with dotted and slashed paths", () => {
    const lookup = flattenModuleTree(buildModuleTree({ modules: SHOP_MODULES, groups: SHOP_GROUPS, access: ["root"] }))
    expect(findModule(lookup, "shop.order").icon).toBe("cart-check")
    expect(findModule(lookup, "shop/order").icon).toBe("cart-check")
  })

  it("falls back to top level when the referenced group is not configured", () => {
    const tree = buildModuleTree({ modules: SHOP_MODULES, groups: {}, access: ["root"] })
    expect(tree.map((n) => n.key)).toEqual(["shop.address", "b2b.order", "shop.cart", "shop.order", "shop.pp_paypal"])
  })
})
