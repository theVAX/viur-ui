---
covers: [src.forms.bones.widgets.phoneBone]
status: accepted
---

## Seam

Widget for exactly `str.phone` (ViUR `PhoneBone`). Lazy-loaded via
`defineAsyncComponent`, because `libphonenumber-js` and
`country_information.json` are large. The preselected dial code comes from
`bonestructure.default_country_code` (top level, not `params`), fallback `+49`.

## Rules

- Keep it async, same reason as `jsonBone`.
- Validation is the server's job: the widget ignores the `test` regex the
  ViUR `PhoneBone` sends in its structure.

## Traps

- A stored value that `libphonenumber-js` cannot parse breaks the widget:
  `parsePhoneNumber` returns `undefined` and `.formatNational()` /
  `.countryCallingCode` are called on it. A national number without `+`
  (`"089 1234567"`) already fails in `getCode` on mount.
- Input of 4 characters or less emits nothing. Shortening the number to a
  bare dial code keeps the previous value in the form.
- The dial-code `wa-select` is not disabled when `readonly`.
- The init emit sends the raw incoming value, the first `change` the
  `AsYouType`-formatted one.

## See also

- `docs/adr/forms/bones.md` - registry, lazy loading and widget contract.
