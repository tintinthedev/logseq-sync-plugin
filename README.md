# GitHub Sync
Sync all Logseq pages to a GitHub repository with a single command.

# Prerequisites
- A GitHub Personal Access Token with repo scope. Generate one at GitHub Settings > Developer settings > Personal access tokens.
- An empty GitHub repository to receive the pages.

# Setup
1. After you install the plugin in your Logseq app, open the command palette (Ctrl+Shift+P) and run "Sync pages to GitHub".
<img width="1077" height="891" alt="image" src="https://github.com/user-attachments/assets/2d9c0ce2-75b5-4dd9-aa94-8b4dd367ed49" />

2. Enter your GitHub PAT and click Fetch Repos.
<img width="1077" height="891" alt="image" src="https://github.com/user-attachments/assets/bb81bb5c-3224-44ca-8f68-e45cb288100d" />

3. Select the target repository from the list. The plugin saves your selection.
<img width="1077" height="891" alt="image" src="https://github.com/user-attachments/assets/f9f39be5-f4c8-4a36-9e68-0640fc58e31a" />

# Syncing
Run "Sync pages to GitHub" from the command palette whenever you want to push your pages. The plugin stages all files in the pages/ folder, commits them, and pushes to the remote repository.

# Changing the remote repository for pages storage
1. Create a new empty repository on GitHub.
2. Open the plugin settings in Logseq.
3. Update the "Target Repository" field with the new repo, following the format `owner/repo name`.
4. Run the sync command again. The plugin pushes all existing commits to the new repository.

The plugin stores its own git data inside the pages/ folder, so it does not interfere with any existing git setup in your Logseq graph.
