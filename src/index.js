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
          await syncPages(settings.pat, settings.repo)
        }
      } catch (err) {
        console.error(err)
        logseq.UI.showMsg('Something went wrong. Check the plugin console.', 'error')
      }
    },
  )
}).catch(console.error)
