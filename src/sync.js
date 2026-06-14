const BRANCH = 'master'

async function execGit(args, errorMessage) {
  const result = await logseq.Git.execCommand(args)
  if (result.exitCode !== 0) {
    console.error(result.stderr)
    throw new Error(errorMessage || result.stderr?.trim() || `git ${args[0]} failed`)
  }
  return result
}

function gitFlags(gitDir, pagesDir) {
  return ['--git-dir', gitDir, '--work-tree', pagesDir]
}

async function syncPages(pat, repo) {
  try {
    logseq.UI.showMsg(`Syncing to ${repo}...`, 'info')

    const graph = await logseq.App.getCurrentGraph()
    const pagesDir = `${graph.path}/pages`
    const gitDir = `${pagesDir}/.git`

    await ensureRepoInitialized(gitDir, pagesDir)
    await ensureRemoteConfigured(gitDir, pagesDir, pat, repo)
    await stagePages(gitDir, pagesDir)

    if (await hasStagedChanges(gitDir, pagesDir)) {
      await commit(gitDir, pagesDir)
    }

    await push(gitDir, pagesDir)
    logseq.UI.showMsg('Synced to GitHub successfully!', 'success')
  } catch (err) {
    console.error(err)
    logseq.UI.showMsg(err.message || 'Sync failed.', 'error')
  }
}

async function ensureRepoInitialized(gitDir, pagesDir) {
  const result = await logseq.Git.execCommand([...gitFlags(gitDir, pagesDir), 'rev-parse', '--git-dir'])

  if (result.exitCode !== 0) {
    await execGit(['init', '--initial-branch', BRANCH, pagesDir], 'Failed to initialize git repository.')
  }
}

function buildRemoteUrl(pat, repo) {
  return `https://${pat}@github.com/${repo}.git`
}

async function ensureRemoteConfigured(gitDir, pagesDir, pat, repo) {
  const remoteUrl = buildRemoteUrl(pat, repo)
  const hasRemote = await logseq.Git.execCommand([...gitFlags(gitDir, pagesDir), 'remote', 'get-url', 'origin'])

  if (hasRemote.exitCode === 0) {
    await execGit([...gitFlags(gitDir, pagesDir), 'remote', 'set-url', 'origin', remoteUrl], 'Failed to configure remote repository.')
  } else {
    await execGit([...gitFlags(gitDir, pagesDir), 'remote', 'add', 'origin', remoteUrl], 'Failed to configure remote repository.')
  }
}

async function stagePages(gitDir, pagesDir) {
  await execGit([...gitFlags(gitDir, pagesDir), 'add', '.'], 'Failed to stage files.')
}

async function hasStagedChanges(gitDir, pagesDir) {
  const result = await execGit([...gitFlags(gitDir, pagesDir), 'status', '--porcelain'], 'Failed to check for changes.')
  return result.stdout.trim().length > 0
}

async function commit(gitDir, pagesDir) {
  const timestamp = new Date().toISOString()
  await execGit([...gitFlags(gitDir, pagesDir), 'commit', '-m', `sync: auto-sync ${timestamp}`], 'Failed to commit changes.')
}

async function push(gitDir, pagesDir) {
  const head = await logseq.Git.execCommand([...gitFlags(gitDir, pagesDir), 'rev-parse', '--verify', 'HEAD'])
  if (head.exitCode !== 0) return

  await execGit([...gitFlags(gitDir, pagesDir), 'push', '-u', 'origin', BRANCH], 'Failed to push to remote. Check your connection and PAT.')
}
