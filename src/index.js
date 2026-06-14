logseq.ready(async () => {
  logseq.App.registerCommandPalette(
    {
      key: 'sync-to-github',
      label: 'Sync pages to GitHub',
    },
    async () => {
      try {
        const settings = getSettings()
        if (!settings.pat || !settings.repo) {
          showUI()
        } else {
          logseq.UI.showMsg('Sync coming soon', 'info')
        }
      } catch {
        logseq.UI.showMsg('Something went wrong. Check the plugin console.', 'error')
      }
    },
  )
}).catch(console.error)
