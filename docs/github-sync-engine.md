# GitHub Sync Engine v1

GitHub Sync Engine v1 is reusable repository synchronization infrastructure. It mirrors the current branch from this repository to a configured target GitHub repository when new commits arrive.

The current target is configured as `codywoods8899/mevrelbank` in `.github/sync-config.json`.

## Architecture

The engine is implemented by `.github/workflows/sync-engine.yml` and configured by `.github/sync-config.json`.

At a high level, each run does the following:

1. Starts on `push` or manual `workflow_dispatch`.
2. Skips runs created by `github-actions[bot]` or by commits that contain a skip marker.
3. Checks out this repository with complete history using `actions/checkout@v4` and `fetch-depth: 0`.
4. Reads `.github/sync-config.json` for the target owner, target repository, and default branch.
5. Determines the current branch and source `HEAD` SHA.
6. Clones the target repository into a temporary directory using `SYNC_PAT`.
7. Fetches all target branches and resolves the target branch SHA if it exists.
8. Compares the source branch `HEAD` SHA to the target branch `HEAD` SHA.
9. Exits successfully without pushing when both SHAs match.
10. Pushes only the current branch to the target repository when the SHAs differ or when the branch does not exist in the target.

The workflow intentionally does not push tags, does not mirror all branches, and does not write application files.

## Configuration

Configuration lives in `.github/sync-config.json`:

```json
{
  "targetOwner": "codywoods8899",
  "targetRepo": "mevrelbank",
  "defaultBranch": "main"
}
```

### How to change the target repository

Update `.github/sync-config.json`:

- `targetOwner`: GitHub owner or organization for the target repository.
- `targetRepo`: Target repository name.
- `defaultBranch`: Fallback branch used when GitHub does not provide a branch name.

No workflow YAML changes should be required for normal target changes.

## Required secrets

The workflow requires the repository secret `SYNC_PAT`.

`SYNC_PAT` must be a GitHub personal access token that can push to the configured target repository. The workflow deliberately does not use `GITHUB_TOKEN` for cross-repository writes.

Minimum expected access:

- Read access to the target repository.
- Write access to the target repository contents.

## Loop prevention

The engine uses several safeguards to prevent synchronization loops:

1. **Actor guard**: the job does not run when `github.actor` is `github-actions[bot]`.
2. **Commit message markers**: commits containing `[skip-sync]` or `[sync skip]` are ignored.
3. **SHA comparison**: the engine compares the source branch `HEAD` SHA against the target branch `HEAD` SHA and exits without pushing when they already match.
4. **Branch-only push**: the engine pushes only `HEAD:refs/heads/<current-branch>`, avoiding tag updates or unrelated branches.
5. **Read-only default token permissions**: the workflow grants `contents: read` to `GITHUB_TOKEN`; cross-repository writes require `SYNC_PAT` explicitly.

These safeguards make the workflow safe to reuse later, including in repositories that may have their own automation.

## How to disable synchronization

Use one of these options:

1. Disable the **GitHub Sync Engine v1** workflow in GitHub Actions.
2. Remove or rename the `SYNC_PAT` secret. Runs will fail before any push can occur.
3. Add `[skip-sync]` or `[sync skip]` to a commit message when a specific commit should not synchronize.
4. Remove the `push` trigger from `.github/workflows/sync-engine.yml` if manual-only operation is desired.

## Logging

Every run logs:

- Source repository.
- Target repository.
- Current branch.
- Current source SHA.
- Target SHA, or that the target branch is missing.
- Whether synchronization occurred.
- The reason synchronization was skipped when no push is needed.

The final summary step runs with `if: always()` so that diagnostics are printed even when an earlier step fails.

## Troubleshooting

### `SYNC_PAT secret is required`

Create a repository secret named `SYNC_PAT`. The token must have permission to read and push to the target repository.

### `sync-config.json must define targetOwner, targetRepo, and defaultBranch`

Verify `.github/sync-config.json` exists and contains all required keys with non-empty string values.

### Target branch does not exist

This is supported. The engine will create the same branch name in the target repository by pushing `HEAD:refs/heads/<current-branch>`.

### Source and target already contain the same HEAD commit

This is a successful no-op. No synchronization is needed.

### Push rejected

Common causes include:

- `SYNC_PAT` does not have write access to the target repository.
- Branch protection rules in the target repository block direct pushes.
- The target branch contains commits that are not ancestors of the source branch.

Resolve the permission, branch protection, or history divergence issue, then rerun the workflow.
