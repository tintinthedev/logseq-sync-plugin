const MODAL_KEY = 'github-sync-setup'
const API_URL = 'https://api.github.com/user/repos?sort=created&direction=desc'

let state = {
  step: 'pat',
  pat: '',
  searchQuery: '',
  repoCache: [],
}

let loadingCanceled = false

function showUI() {
  loadingCanceled = false
  state.step = getSettings().pat ? 'repo' : 'pat'

  logseq.provideModel({
    onPatChange(event) {
      state.pat = event.value
    },
    async onPatSubmit() {
      if (!state.pat) {
        logseq.UI.showMsg('Enter a PAT first.', 'warning')
        return
      }

      try {
        state.repoCache = await fetchUserRepos(state.pat)
        updatePat(state.pat)
        state.step = 'repo'
        render()
      } catch (err) {
        state.step = 'pat'
        handleError(err)
      }
    },
    onSearchChange(event) {
      state.searchQuery = event.value
    },
    onApplySearch() {
      render()
    },
    onRepoSelect(event) {
      const repo = event.dataset.repo
      if (!repo) return

      updateRepo(repo)
      logseq.UI.showMsg(`Repository selected: ${repo}`, 'info')
      hideUI()
    },
    onCancel() {
      loadingCanceled = true
      hideUI()
    },
  })

  renderAsync()
}

async function renderAsync() {
  render()

  if (state.step === 'pat' || state.repoCache.length > 0) return

  try {
    state.repoCache = await fetchUserRepos(getSettings().pat)
    state.step = 'repo'
  } catch (err) {
    state.step = 'pat'
    handleError(err)
    if (!loadingCanceled) render()
    return
  }

  if (loadingCanceled) return

  render()
}

function handleError(err) {
  if (err instanceof SyncError) {
    err.handle()
  } else {
    logseq.UI.showMsg('Something went wrong. Try again.', 'error')
  }
}

function hideUI() {
  logseq.provideUI({ key: MODAL_KEY, template: null, reset: true })
}

function templateFor(step) {
  if (step === 'pat') return patFormTemplate()
  if (state.repoCache.length === 0) return loadingTemplate()
  return repoPickerTemplate()
}

function render() {
  logseq.provideUI({
    key: MODAL_KEY,
    path: '#app-container',
    template: templateFor(state.step),
    reset: true,
  })
}

const overlayStyle = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999'
const modalStyle = 'background:var(--ls-primary-background-color);color:var(--ls-primary-text-color);padding:24px;border-radius:8px;min-width:400px;max-width:500px'
const inputStyle = 'width:100%;padding:8px 12px;margin-bottom:12px;border:1px solid var(--ls-border-color);border-radius:4px;background:var(--ls-tertiary-background-color);color:var(--ls-primary-text-color);box-sizing:border-box'
const btnBase = 'display:block;width:100%;padding:10px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:600;box-sizing:border-box;margin-bottom:8px'
const btnPrimaryStyle = btnBase + ';background:#268bd2;color:#fff'
const btnDangerStyle = btnBase + ';background:#dc3545;color:#fff'
const repoListStyle = 'max-height:300px;overflow-y:auto;border:1px solid var(--ls-border-color);border-radius:4px;margin:8px 0'
const repoItemStyle = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--ls-border-color)'
const emptyStyle = 'padding:12px;color:var(--ls-secondary-text-color);text-align:center'

function patFormTemplate() {
  return `
    <div style="${overlayStyle}">
      <div style="${modalStyle}">
        <h3 style="margin:0 0 8px">GitHub Sync Setup</h3>
        <p style="margin:0 0 16px;color:var(--ls-secondary-text-color)">Enter your GitHub Personal Access Token (repo scope)</p>
        <input
          data-on-input="onPatChange"
          type="password"
          placeholder="ghp_..."
          style="${inputStyle}"
        />
        <button data-on-click="onPatSubmit" style="${btnPrimaryStyle}">
          Fetch Repos
        </button>
        <button data-on-click="onCancel" style="${btnDangerStyle}">
          Cancel
        </button>
      </div>
    </div>`
}

function loadingTemplate() {
  return `
    <div style="${overlayStyle}">
      <div style="${modalStyle}">
        <p style="${emptyStyle}">Loading repos...</p>
        <button data-on-click="onCancel" style="${btnDangerStyle}">Cancel</button>
      </div>
    </div>`
}

function repoPickerTemplate() {
  const query = state.searchQuery.toLowerCase()
  const filtered = query
    ? state.repoCache.filter(r => r.toLowerCase().includes(query))
    : state.repoCache

  const items = filtered
    .map(
      r =>
        `<div data-on-click="onRepoSelect" data-repo="${r}" style="${repoItemStyle}">${r}</div>`,
    )
    .join('')

  return `
    <div style="${overlayStyle}">
      <div style="${modalStyle}">
        <h3 style="margin:0 0 8px">Select Repository</h3>
        <input
          data-on-input="onSearchChange"
          type="text"
          placeholder="Search repos..."
          value="${state.searchQuery}"
          style="${inputStyle}"
        />
        <button data-on-click="onApplySearch" style="${btnPrimaryStyle}">
          Search
        </button>
        <div style="${repoListStyle}">
          ${items || `<p style="${emptyStyle}">No repos found</p>`}
        </div>
        <button data-on-click="onCancel" style="${btnDangerStyle}">
          Cancel
        </button>
      </div>
    </div>`
}

async function fetchUserRepos(pat) {
  let res

  try {
    res = await fetch(API_URL, { headers: { Authorization: `Bearer ${pat}` } })
  } catch {
    throw new NetworkError()
  }

  if (res.status === 401) throw new InvalidPatError()
  if (res.status === 403) throw new RateLimitedError()
  if (res.status >= 500) throw new ServerError()
  if (!res.ok) throw new SyncError('Something went wrong. Try again.')

  let data

  try {
    data = await res.json()
  } catch {
    throw new MalformedResponseError()
  }

  if (!Array.isArray(data)) throw new MalformedResponseError()

  return data.map(validateRepoShape).sort()
}

function validateRepoShape(r) {
  if (!r.owner || !r.owner.login || !r.name) {
    throw new MalformedResponseError()
  }
  return `${r.owner.login}/${r.name}`
}
