---
covers: [src.forms.utils.loadStep, src.forms.utils.back, src.request.envelope.v1SelectionFollow]
status: accepted
---

## Seam

`<ViForm multistep module="..." action="..." />` runs a server-driven flow
(login chains, wizards). The server decides the sequence; the client only
follows:

- render: `loadStep(url?)` GETs the entry URL (from `module`/`action`) or a
  step URL and applies the envelope (`step`, `steps`, `status`,
  `step_status`, `follow`).
- next: `submitStep()` flushes nested forms, POSTs to `state.postUrl` (the
  envelope's `follow`), then `status: "success"` -> `emit("success", data)`,
  `"rejected"` -> stay, otherwise GET the new `follow` and
  `emit("step-change", { step, steps })`.
- back: `back()` GETs `steps[previousKey].url` (or `.endpoint`).

UI hooks are slots, all optional: `steps` (progress bar; built-in one only
with `showSteps`), `actions` (`next`, `back`, `isFirstStep`, `isLastStep`,
`loading`, labels), `list` (a step whose `datatype` is `"list"`; no form is
rendered). Button texts: `nextLabel` / `submitLabel` / `backLabel`, default
i18n `form.next|submit|back`. `LoginScreen` is the reference consumer.

v1 servers send no `follow`: a step is posted back to the URL it was
rendered from, and for selection actions `v1SelectionFollow` takes the
chosen select value as target if it is one of the offered URLs.

## Rules

- Never build step URLs on the client or keep a client-side step history.
  Targets come from `follow` and `steps[...].url`; `back` re-renders from
  the server session.
- Advance with `submitStep` (or the slot's `next`/`submit`), not with your
  own `sendData` + `loadStep` chain; it would skip the nested flush and the
  `success` / `step-change` events.

## Traps

- `multistep` without both `module` and `action` silently falls back to the
  normal paths (`structure` or `fetchData`).
- The entry step is a GET (`loadStep`), the single-step form renders with a
  POST (`fetchData`).
- `isFirstStep` / `isLastStep` come from the key order of `steps`. Without a
  `steps` map the built-in bar never shows "Submit" and never shows "Back".
- `submitStep` swallows every error and resolves `undefined`. Errors show
  only through `state.errors` and the `failed` event.
- `submitStep` takes no arguments and a `list` step has no structure, so
  `next` posts an empty body. To send the picked item call
  `form.sendData(form.state.postUrl, { key })` yourself.
- `back` is a silent no-op on the first step or when the previous step has
  no `url`/`endpoint`.
- `values` is applied to every GET-rendered step, so a key matching a bone
  of a later step prefills that step too.
- `postUrl` only changes when the envelope carries `follow`; on v1 it keeps
  the last URL.

## See also

- `docs/adr/forms/utils.md` - `sendData`, `applyResponseState`, errors.
- `docs/adr/request.md` - envelope normalization (v1 -> v2).
