# PR-Pipeline & Commit-Hooks — Quick Reference

Praktischer Leitfaden für Entwickler, die im viur-ui Repo arbeiten. Alles, was du nach `git clone` wissen musst.

**Design-Doc:** `docs/specs/2026-04-16-pr-pipeline-design.md`
**Implementation-Plan:** `docs/plans/2026-04-16-pr-pipeline.md`

---

## 1. Nach `git clone` — Einmal-Setup

```bash
git clone git@github.com:akelch/viur-ui.git
cd viur-ui
git checkout develop

# Node-Version (empfohlen: nvm)
nvm use                           # liest .nvmrc → Node 24

# Deps installieren (Root UND example/ sind beide Pflicht)
npm install                       # triggert automatisch 'lefthook install'
npm install --prefix example      # Peer-Deps für histoire.legacy (CKEditor, codemirror, webawesome, ...)

# Für lokale Playwright-Läufe einmalig nötig:
npx playwright install chromium
```

Nach `npm install` sind die Git-Hooks automatisch aktiv (via `prepare` Script in `package.json`).

---

## 2. Commit-Hooks (Lefthook)

### Was passiert beim `git commit`

Auf jeden Commit laufen — **parallel, nur auf staged Files** — zwei Jobs:

| Job | Glob | Command |
|---|---|---|
| `eslint` | `*.{js,vue}` | `npx eslint --fix {staged_files}` |
| `prettier` | `*.{js,vue,json,md,yml,yaml}` | `npx prettier --write {staged_files}` |

Beide mit `stage_fixed: true` — gefixte Dateien werden automatisch neu gestaged und landen im Commit. Du merkst davon nichts, solange alles fixbar ist.

### Wann der Hook blockiert

Wenn ESLint einen nicht-fixbaren Verstoß findet (z. B. `no-restricted-syntax`, `vue/`-Regeln), schlägt der Hook fehl und der Commit wird **abgebrochen**. Du fixst die Meldung manuell und committest erneut.

### Hook manuell testen

```bash
# Dry-Run: staged Files gegen den Hook laufen lassen (ohne wirklichen Commit)
git add <file>
npx lefthook run pre-commit
```

### Hook bewusst umgehen (Notfall)

```bash
git commit --no-verify -m "..."
```

**CI fängt trotzdem.** Das ist kein echter Bypass — der `lint`-Job in GitHub Actions prüft später.

---

## 3. Tägliche Kommandos

### Linting & Formatting

```bash
npm run lint           # ESLint über das ganze Repo (inkl. Prettier via Plugin)
npm run format:check   # Nur Prettier-Check, keine Fixes
```

**Zum Fixen lokal:**
```bash
npx eslint . --fix
npx prettier --write .
```

### Tests

```bash
npm run test:run       # Vitest Unit-Tests (einmalig)
npm run test           # Vitest Watch-Mode (Dev)
npm run test:contract  # Playwright Contract-Tests (Histoire startet automatisch)
```

### Bone-Coverage-Gate

```bash
node scripts/check-bone-coverage.js
```

Ausgabe bei Erfolg: `Bone coverage check passed (17 bones verified).`

---

## 4. CI-Pipeline (GitHub Actions)

Workflow: `.github/workflows/pr.yml`
**Trigger:** `pull_request` gegen `develop`
**Concurrency:** Neuer Push cancelt vorherigen Run

### Vier parallele Jobs

| Job | Dauer | Blockierend? | Zweck |
|---|---|---|---|
| `Lint` | ~20 s | `continue-on-error: true` ¹ | ESLint inkl. Prettier |
| `Unit Tests` | ~30 s | `continue-on-error: true` ² | Vitest |
| `Bone Coverage Gate` | ~2 s | **ja** | Strukturcheck: jeder Bone hat Story + Spec |
| `Contract Tests (Playwright)` | ~3–5 min | `continue-on-error: true` ³ | Playwright gegen Histoire |

¹ Bis Backlog-Task #9 (241 bestehende Lint-Errors) durch ist.
² Bis Backlog-Task #10 (3 failing Request-Tests) durch ist.
³ Bis Backlog-Task #11 (17 legacy-Panel Contract-Failures) durch ist.

**Effektiv blockt aktuell nur der Coverage-Gate.** Nach Backlog-Abarbeitung werden die `continue-on-error`-Einträge entfernt und die Pipeline wird voll blockierend.

---

## 5. Neuen Bone hinzufügen

Der Coverage-Gate erzwingt: jeder echte Bone hat eine Story **und** einen Contract-Spec.

```
src/forms/bones/blobBone.vue              → Component
stories/bones/BlobBone.story.vue          → Histoire-Story (PascalCase)
tests/contract/bone-widgets/blob-bone.spec.ts  → Playwright-Spec (kebab-case)
```

**Namens-Konventionen sind fix:**
- File `<name>Bone.vue` (camelCase)
- Story `<Name>Bone.story.vue` (PascalCase)
- Spec `<name>-bone.spec.ts` (kebab-case)

Fehlt eines der beiden Artefakte → CI-Job rot → PR blockt.

### Ausnahmen (Whitelist)

Nicht-eigenständige Bones werden in `scripts/check-bone-coverage.js` in der `WHITELIST`-Konstante geführt. Aktuell:

- `bone.vue` — abstrakter Basis-Wrapper
- `filterBone.vue` — Filter-spezifisch, separate Test-Strategie
- `jsonBone.vue` — TODO, Story + Spec noch nicht geschrieben

**Die Whitelist zu erweitern ist eine bewusste Team-Entscheidung** — immer im PR-Body begründen.

---

## 6. Branch-Strategie

- **Integration:** `develop`
- **Release/Stable:** `main`
- Feature-Branches zweigen von `develop` ab, PRs gehen gegen `develop`

---

## 7. Troubleshooting

### Lokale Playwright-Tests schlagen fehl

Meistens eine dieser drei Ursachen:

1. **Browser fehlt:** `npx playwright install chromium`
2. **`example/` Deps fehlen:** `npm install --prefix example` (ohne die bricht Histoire beim Laden von `@viur/webawesome/...`)
3. **Histoire läuft bereits:** `playwright.config.ts` setzt `reuseExistingServer: !process.env.CI` — falls schon ein Dev-Server auf Port 6007 läuft, wird der benutzt

### Vitest will Playwright-Specs laufen

Sollte nicht passieren — `vitest.config.js` hat `exclude: ['tests/contract/**']`. Falls doch, prüfe ob die Zeile weg ist.

### Lefthook läuft nicht beim Commit

```bash
npx lefthook install    # reinstalliert den Git-Hook-Stub
cat .git/hooks/pre-commit   # sollte lefthook erwähnen
```

### Coverage-Gate failed für einen Bone, den ich gar nicht angefasst habe

Wahrscheinlich wurde eine Story- oder Spec-Datei umbenannt/verschoben. Check mit:

```bash
ls stories/bones/ tests/contract/bone-widgets/
```

Beide Listen müssen symmetrisch sein (PascalCase ↔ kebab-case).

---

## 8. Technical Debt (Stand April 2026)

Drei Punkte sind per Backlog-Task dokumentiert und lassen die CI derzeit nicht voll blockieren:

| # | Beschreibung | Wieviele |
|---|---|---|
| 9 | ESLint-Errors (`no-restricted-syntax`, `vue/`) | 241 errors, 386 warnings |
| 10 | Failing Vitest-Tests in `tests/request/request.test.js` | 3 Tests |
| 11 | Failing Contract-Tests auf dem `[legacy]`-Panel | 17 Tests (alle „initial mount change-Event") |

Sobald ein Punkt abgeschlossen ist: `continue-on-error: true` aus dem entsprechenden Job in `.github/workflows/pr.yml` entfernen. Dann blockt der Job hart.

---

## 9. Was NICHT automatisch passiert

- **Branch Protection** auf GitHub ist Repo-Admin-Aufgabe — muss einmalig eingerichtet werden, Required Status Check: mindestens `Bone Coverage Gate`
- **Auto-Fix in CI** — bewusste Entscheidung: CI verifiziert, mutiert nicht. Formatting lokal via Lefthook, nie per CI-Bot-Commit
- **Release-Workflow** (Tagging, npm publish) — eigener `release.yml` später, nicht Teil der PR-Pipeline
