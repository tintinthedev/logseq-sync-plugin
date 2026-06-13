# logseq-github-sync

Logseq plugin: sync all `.md` pages to a remote GitHub repo via command palette.

## Docs

- Logseq plugin SDK: https://plugins-doc.logseq.com/

## Stack

- Node.js, CommonJS (`"type": "commonjs"`)
- `@logseq/libs` — plugin SDK
- No build step; Logseq loads plugin directly from `index.js`

## Module layout (`src/`)

| File | Responsibility |
|------|---------------|
| `src/index.js` | Plugin entry, register command palette command |
| `src/settings.js` | Persist/retrieve PAT + target repo via `logseq.updateSettings` / `logseq.settings` |
| `src/github.js` | GitHub API: list user repos (via `fetch`), validate PAT |
| `src/sync.js` | Gather pages, build commit via `logseq.Git` API |
| `src/ui.js` | First-run modal: PAT input, repo picker |

Apply: DRY, SRP, SOLID, no magic numbers, small functions, no single-file blob.

## User flow

1. **First run** (no PAT in settings) → `ui.js` shows modal → user enters PAT → `github.js` fetches repo list via `fetch('https://api.github.com/user/repos')` → user picks repo → `settings.js` persists both
2. **Subsequent runs** → `settings.js` reads saved PAT + repo → `sync.js` runs automatically

## Git sync (`src/sync.js`)

Uses `logseq.Git` API — NOT raw Octokit or shell git:

- Set remote URL: `logseq.Git.exec('remote', 'set-url', 'origin', 'https://<PAT>@github.com/<owner>/<repo>.git')` (or `add` if first time)
- Stage: `logseq.Git.exec('add', '.')`
- Commit: `logseq.Git.exec('commit', '-m', 'sync: auto-sync <timestamp>')`
- Push: `logseq.Git.exec('push', '-u', 'origin', 'master')` — branch hard-coded as `master`
- List `.md` pages: `logseq.Editor.getPages()` / `logseq.App.getFiles()`

## Logseq plugin conventions

- Entry point declared in `package.json` `"main"` field
- Commands via `logseq.App.registerCommandPalette()`
- Settings via `logseq.updateSettings` / `logseq.settings`
- No `fs`/`path` (browser sandbox) — use Logseq APIs
- `"logseq"` key in `package.json` for plugin metadata (title, icon, id)

## Git & secrets

- Never commit PAT or any credential
- Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
