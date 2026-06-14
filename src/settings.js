logseq.useSettingsSchema([
  {
    key: 'pat',
    type: 'string',
    title: 'GitHub PAT',
    description: 'GitHub Personal Access Token with repo scope',
    default: '',
  },
  {
    key: 'repo',
    type: 'string',
    title: 'Target Repository',
    description: 'Format: owner/repo',
    default: '',
  },
])

function getSettings() {
  const { pat, repo } = logseq.settings ?? {}
  return { pat, repo }
}

function updatePat(pat) {
  logseq.updateSettings({ pat })
}

function updateRepo(repo) {
  logseq.updateSettings({ repo })
}
