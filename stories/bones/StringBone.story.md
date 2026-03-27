# StringBone

Einzeiliges Textfeld für einfache Zeichenketten. Wird für Titel, Namen, kurze Beschreibungen und ähnliche Felder verwendet. Unterstützt Mehrsprachigkeit via Language-Tabs.

## Structure

| Feld | Typ | Beschreibung |
|---|---|---|
| `type` | `'str'` | Bone-Typ-Kennung |
| `descr` | `string` | Bezeichnung, die im Label angezeigt wird |
| `required` | `boolean` | Pflichtfeld — Fehler wenn leer |
| `readonly` | `boolean` | Nur-Lesen — Eingabe deaktiviert |
| `multiple` | `boolean` | Mehrfachwerte — zeigt Liste mit Add-Button |
| `languages` | `string[] \| null` | Sprachcodes für Mehrsprachigkeit, z.B. `['de', 'en']`. `null` = einsprachig |
| `params` | `object` | Zusatzparameter, z.B. `{ tooltip: 'Hinweistext' }` |

## Beispiel

```js
{
  title: {
    type: 'str',
    descr: 'Titel',
    required: false,
    readonly: false,
    multiple: false,
    languages: null,
    params: {}
  }
}
```

### Mehrsprachig

```js
{
  title: {
    type: 'str',
    descr: 'Titel',
    languages: ['de', 'en'],
    required: false,
    readonly: false,
    multiple: false,
    params: {}
  }
}
```

Skel-Wert bei Mehrsprachigkeit:

```js
{ title: { de: 'Deutscher Text', en: 'English text' } }
```

## Events

| Event | Payload | Beschreibung |
|---|---|---|
| `change-internal` | `{ name: string, value: any, lang: string\|null, index: number\|null, valid: boolean }` | Jede Wertänderung; auch bei readonly (valid=false) |
| `change` | komponentenabhängig | Nach internem State-Update |
| `handleClick` | komponentenabhängig | Klick-Interaktionen |
