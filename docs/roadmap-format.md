# Roadmap import format

Repositories using this contract keep one roadmap across three files at the repository root. Use the following exact paths and matching `file` values.

| Path | `file` | Contents |
| --- | --- | --- |
| `roadmap/roadmap.json` | `roadmap` | Work to do, highest priority first |
| `roadmap/completed.json` | `completed` | Finished work, appended as items finish |
| `roadmap/cancelled.json` | `cancelled` | Dropped work, appended as items are dropped |

## Fields

Every file contains exactly these top-level fields.

| Field | Rule |
| --- | --- |
| `schema` | Literal string `name -roadmap/v1`, including the space before the hyphen |
| `file` | One of the values in the table above |
| `updatedAt` | ISO 8601 timestamp with an explicit UTC offset, such as `2026-10-14T09:30:00+11:00`. Set it in every changed file. |
| `project` | Object with required string fields `key`, `title`, and `status`. The key is permanent lowercase kebab-case, the title is the display name, and status is `active`, `paused`, or `complete`. Keep all three values identical across the files. An optional string `summary` belongs only in `roadmap.json`. |
| `items` | Array of up to 2,000 items per file. Use `[]` when creating a missing file with no entries. |

Use UTF-8 JSON with two-space indentation, without comments or trailing commas. Each item has the following fields only.

| Field | Rule |
| --- | --- |
| `id` | Required lowercase kebab-case string. Use letters and digits in segments separated by single hyphens. Unique across all three files and permanent once assigned. |
| `title` | Required short imperative string, up to 500 characters |
| `group` | Optional area label string |
| `notes` | Optional detail string, up to 20,000 characters |
| `completedAt` | Required only in `completed.json`. Use the same timestamp format as `updatedAt`. |
| `cancelledAt` | Required only in `cancelled.json`. Use the same timestamp format as `updatedAt`. |
| `reason` | Optional string only in `cancelled.json`, up to 20,000 characters. Supply a short reason when dropping an item. |

## Moves

An item belongs to exactly one file. Move its existing record and preserve its id and meaning. Titles and notes may change. Use new ids when splitting work or adding follow-up work, and never delete, rename, or reuse an existing id.

- **Finish a to-do item.** Move it to the end of `completed.json` and add `completedAt` in the same change as the finished work.
- **Drop a to-do item.** Move it to the end of `cancelled.json` and add `cancelledAt` and a short `reason`.
- **Revive a cancelled item.** Remove `cancelledAt` and `reason`, then insert the record back into `roadmap.json` at its current priority.
- **Correct a premature completion.** Move the same item back to `roadmap.json` at its current priority and remove `completedAt`. Use the to-do workflow if a reopened or revived item later needs a different disposition.

Refresh `updatedAt` in both files when moving an item. The [agent instructions](../AGENTS.md) apply this contract to this repository.

## Minimal examples

### `roadmap/roadmap.json`

```json
{
  "schema": "name -roadmap/v1",
  "file": "roadmap",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": {
    "key": "example-project",
    "title": "Example Project",
    "status": "active"
  },
  "items": [
    {
      "id": "validate-imports",
      "title": "Validate imports"
    }
  ]
}
```

### `roadmap/completed.json`

```json
{
  "schema": "name -roadmap/v1",
  "file": "completed",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": {
    "key": "example-project",
    "title": "Example Project",
    "status": "active"
  },
  "items": [
    {
      "id": "draft-product-brief",
      "title": "Draft the product brief",
      "completedAt": "2026-10-14T09:30:00+11:00"
    }
  ]
}
```

### `roadmap/cancelled.json`

```json
{
  "schema": "name -roadmap/v1",
  "file": "cancelled",
  "updatedAt": "2026-10-14T09:30:00+11:00",
  "project": {
    "key": "example-project",
    "title": "Example Project",
    "status": "active"
  },
  "items": [
    {
      "id": "publish-paper-guide",
      "title": "Publish a paper guide",
      "cancelledAt": "2026-10-14T09:30:00+11:00",
      "reason": "The web guide covers the same material."
    }
  ]
}
```
