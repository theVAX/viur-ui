// --------------------------------------------------------------------------- //
// Envelope normalization — v1 → v2                                            //
// --------------------------------------------------------------------------- //
//
// viur-ui works PRIMARILY on the viur-actions "envelope v2" response shape
// (see sources/viur-actions/src/viur/actions/envelope.py). To also keep
// supporting the classic v1 ViUR JSON protocol (`values` / `skellist` /
// `structure` / `errors` / `action`), we normalize every response UP to the
// canonical v2 envelope at the `.json()`/parse boundary.
//
// This is the exact inverse of vi-vue-utils, which normalizes v2 DOWN to v1.
// There, v1 is canonical and v2 responses are adapted; here, v2 is canonical
// and v1 responses are adapted.
//
// The normalization is transparent for bodies that are already v2 (they carry
// the JSON number `version: 2`) and for non-ViUR payloads (skey arrays, the
// version-agnostic `getStructure` map, custom endpoints) — those pass through
// unchanged.
//
// By default the request layer hits the unversioned `/json/…` endpoint, which
// the server aliases to the newest wire format (envelope v2). A specific
// version can be pinned via the separate `version` parameter (`2`/`"v2"` for
// v2, `1`/`"v1"` for classic v1) — see `create_url` in request.js. Either way,
// this module guarantees viur-ui consumes a v2-shaped body.

/**
 * Canonical v2 envelope field set (see viur-actions envelope.py):
 *   version, action, status, step, step_status, steps, follow,
 *   datatype, module, structure, data, errors
 * plus a list-only `meta: { cursor, orders }`.
 */

/**
 * True if `data` is an already-parsed viur-actions envelope-v2 body.
 * The wire carries `version` as the JSON number `2`; we also tolerate the
 * string `"2"` defensively.
 * @param {*} data
 * @returns {boolean}
 */
export function isEnvelopeV2(data) {
  return (
    !!data && typeof data === "object" && !Array.isArray(data) && (data["version"] === 2 || data["version"] === "2")
  )
}

/**
 * Map a classic v1 `action` string (+ errors) to a v2 `(action, status)` pair.
 * Inverse of vi-vue-utils' `v1ActionString`.
 *
 * - `addSuccess` / `editSuccess` / `cloneSuccess` / `deleteSuccess` → the plain
 *   verb with `status: "success"`.
 * - `view` / `list` → the verb with `status: "success"` (a completed read).
 * - any other verb (`add` / `edit` / `clone` / custom): `status: "rejected"`
 *   when the response carries errors, else `status: "init"` (a freshly rendered
 *   or in-flight form).
 *
 * @param {string|undefined} action v1 action string
 * @param {Array|undefined} errors v1 errors array
 * @returns {{ action: string, status: string }}
 */
function v2ActionStatus(action, errors) {
  switch (action) {
    case "addSuccess":
      return { action: "add", status: "success" }
    case "editSuccess":
      return { action: "edit", status: "success" }
    case "cloneSuccess":
      return { action: "clone", status: "success" }
    case "deleteSuccess":
      return { action: "delete", status: "success" }
  }

  if (action === "view" || action === "list") {
    return { action, status: "success" }
  }

  const status = Array.isArray(errors) && errors.length > 0 ? "rejected" : "init"
  return { action: action ?? null, status }
}

/**
 * Normalize a parsed response body to the canonical v2 envelope shape.
 *
 * - Bodies already in v2 pass through (only `errors`/`meta` are defensively
 *   ensured).
 * - Classic v1 bodies (carrying `skellist`, `values`, or a v1 `action`) are
 *   lifted to v2: `data` (from `skellist`/`values`), `datatype`, `structure`,
 *   `errors`, `follow`, `(action, status)` and — for lists — `meta`. The
 *   original v1 fields are kept alongside, so the result is a superset and the
 *   transform is idempotent.
 * - Everything else (arrays, primitives, non-ViUR objects such as the skey list
 *   or the `getStructure` map) passes through unchanged.
 *
 * @param {*} data parsed response body
 * @returns {*} v2-shaped body (or the input unchanged)
 */
export function normalizeEnvelope(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return data
  }

  if (isEnvelopeV2(data)) {
    const out = { ...data }
    out["version"] = 2
    out["errors"] = data["errors"] || []
    if (data["datatype"] === "list" && !data["meta"]) {
      out["meta"] = { cursor: data["cursor"] ?? null, orders: data["orders"] || [] }
    }
    return out
  }

  const isList = Array.isArray(data["skellist"])
  const isEntity = "values" in data
  const hasV1Action = typeof data["action"] === "string"

  // Not a ViUR structured response (skey, getStructure map, custom payload):
  // leave untouched.
  if (!isList && !isEntity && !hasV1Action) {
    return data
  }

  const out = { ...data }
  out["version"] = 2
  const { action, status } = v2ActionStatus(data["action"], data["errors"])
  out["action"] = action
  out["status"] = status
  out["errors"] = data["errors"] || []
  out["follow"] = data["follow"] ?? data["next_url"] ?? null
  out["structure"] = data["structure"] ?? null

  if (isList) {
    out["datatype"] = "list"
    out["data"] = data["skellist"]
    out["meta"] = { cursor: data["cursor"] ?? null, orders: data["orders"] || [] }
  } else {
    out["datatype"] = "entity"
    out["data"] = isEntity ? data["values"] : (data["data"] ?? null)
  }

  return out
}
