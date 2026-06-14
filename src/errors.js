class SyncError extends Error {
  handle() {
    logseq.UI.showMsg(this.message, 'error')
  }
}

class InvalidPatError extends SyncError {
  constructor() {
    super('Invalid token. Check your GitHub PAT.')
  }

  handle() {
    updatePat('')
    super.handle()
  }
}

class RateLimitedError extends SyncError {
  constructor() {
    super('Rate limited by GitHub. Try again later.')
  }
}

class NetworkError extends SyncError {
  constructor() {
    super('Network error. Check your connection.')
  }
}

class ServerError extends SyncError {
  constructor() {
    super('GitHub is unavailable. Try again later.')
  }
}

class MalformedResponseError extends SyncError {
  constructor() {
    super('Unexpected response from GitHub. Try again.')
  }
}
