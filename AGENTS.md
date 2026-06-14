# logseq-github-sync

Logseq plugin: sync all `.md` pages to a remote GitHub repo via command palette.

## Docs

- Logseq plugin SDK: https://plugins-doc.logseq.com/

## Stack

- Node.js
- No build step; Logseq loads plugin directly from `src/index.html`
- **No browser DOM APIs** (`document.querySelector`, `createElement`, `addEventListener`, etc.) — only `logseq.*` APIs
- **All styles inline** in HTML template strings — `logseq.provideStyle` avoided (conflicts with Logseq's CSS scoping in this setup)

## Module layout (`src/`)

| File | Responsibility |
|------|---------------|
| `src/index.html` | Entry point; loads CDN script + JS files |
| `src/index.js` | Plugin entry; `logseq.ready`, register command palette |
| `src/settings.js` | Settings schema via `useSettingsSchema`; get/update PAT + repo |
| `src/ui.js` | Setup modal via `provideUI` + `provideModel`; GitHub repo fetch |
| `src/errors.js` | Error classes with polymorphic `handle()` |
| `src/sync.js` | Gather pages, build commit via `logseq.Git` API |

Apply: DRY, SRP, SOLID, no magic numbers, small functions, no single-file blob.

## User flow

1. **First run** (no PAT in settings) → user invokes command → `ui.js` shows modal via `provideUI` → user enters PAT → `ui.js` calls GitHub API via `fetch`, saves PAT to settings via `updatePat()` → repo picker shown → user picks repo → saved via `updateRepo()` → modal closes
2. **Subsequent runs** → `index.js` reads saved PAT + repo via `getSettings()` → `sync.js` runs automatically

## Git sync (`src/sync.js`)

Uses `logseq.Git` API — NOT raw Octokit or shell git:

- Set remote URL: `logseq.Git.execCommand(['remote', 'set-url', 'origin', 'https://<PAT>@github.com/<owner>/<repo>.git'])` (or `add` if first time)
- Stage: `logseq.Git.execCommand(['add', '.'])`
- Commit: `logseq.Git.execCommand(['commit', '-m', 'sync: auto-sync <timestamp>'])`
- Push: `logseq.Git.execCommand(['push', '-u', 'origin', 'master'])` — branch hard-coded as `master`
- List `.md` pages: `logseq.Editor.getPages()` / `logseq.App.getFiles()`

## Logseq plugin conventions

- Entry point declared in `package.json` `"main"` field
- Commands via `logseq.App.registerCommandPalette()`
- Settings schema via `logseq.useSettingsSchema()`; read/write via `logseq.settings` / `logseq.updateSettings`
- UI exclusively via `logseq.provideUI()` + `logseq.provideModel()`; event handlers via `data-on-click` / `data-on-input` attributes in templates
- No browser DOM APIs (`document.querySelector`, `createElement`, `addEventListener`, etc.)
- No `fs`/`path` (browser sandbox) — use Logseq APIs
- `"logseq"` key in `package.json` for plugin metadata (title, id)

## Settings module (`src/settings.js`)

- `logseq.useSettingsSchema([...])` called at module level — declares `pat` (string) and `repo` (string) in Logseq settings UI
- `getSettings()` → returns `{ pat, repo }`
- `updatePat(pat)` → persists token via `logseq.updateSettings`
- `updateRepo(repo)` → persists target repo via `logseq.updateSettings`

## UI module (`src/ui.js`)

- `showUI()` → registers model via `provideModel`, calls `render()` which injects modal via `provideUI`
- `hideUI()` → removes modal via `provideUI({ key, template: null, reset: true })`
- All styles are inline (no `provideStyle`) — style strings defined as constants for reuse
- Two screen steps: PAT form → repo picker (with search/filter via "Search" button)
- `fetchUserRepos(pat)` → GitHub API call, returns `['owner/repo', ...]` sorted
- PAT saved on successful fetch; repo saved when user selects

## Error handling

Every error scenario must produce a clear user-facing message via `logseq.UI.showMsg()`.
Never silently fail. Never expose raw error objects.

| Scenario | Handling |
|----------|----------|
| Empty PAT, user clicks Fetch | Show warning: "Enter a PAT first." |
| Invalid PAT (401) | Show error: "Invalid token. Check your GitHub PAT." |
| Network error | Show error: "Network error. Check your connection." |
| Rate limited (403) | Show error: "Rate limited by GitHub. Try again later." |
| GitHub unavailable (5xx) | Show error: "GitHub is unavailable. Try again later." |
| Malformed API response | Validate response shape; show error on mismatch |
| Command palette callback | Wrap in try/catch with user-facing message |
| Partial setup (PAT saved, no repo) | Jump directly to repo picker on next invocation |

Implementation rules:
- Wrap all user-facing operations in try/catch
- Differentiate HTTP status codes in API calls
- Validate inputs before actions
- Show messages with appropriate severity (`'error'`, `'warning'`, `'info'`)

## Git & secrets

- Never commit PAT or any credential
- Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
