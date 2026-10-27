---
name: release
description: Creates the next version from the semantic commits since the last tag (semver), writes the changelog, and creates the annotated tag and the release on GitHub or GitLab.
argument-hint: "[major|minor|patch|vX.Y.Z] [rc]"
disable-model-invocation: true
---

# git:release

## Steps

1. Be on the default branch, up to date and clean: `git switch <default> && git pull --ff-only`, with an empty `git status`.
2. Last tag: `git describe --tags --abbrev=0`. With no tag at all, the first version is `v0.1.0` and the changelog covers the whole history.
3. Commits since the tag: `git log --format='%h%x09%s%x09%b%x1e' <tag>..HEAD`. With no commits, stop: there is nothing to release.
4. Version (the argument wins, if given):
   - **major**: `!` after the type or the scope (`feat!:`), or `BREAKING CHANGE:` in the body;
   - **minor**: any `feat`;
   - **patch**: the rest.
   Before `1.0.0`, a breaking change raises the minor. With `rc`, use the suffix `-rc.<n>`, and count the rc tags that already exist for the same version.
5. Write the changelog in the language of the project. Group the entries and describe the effect for the user. Do not copy the commit title:

```markdown
## vX.Y.Z (YYYY-MM-DD)

### ⚠️ Breaking changes
- what changes and what to do to migrate

### New features
- ... (`feat`)

### Fixes
- ... (`fix`)

### Improvements
- ... (`perf`, `refactor` with a visible effect)
```

   Omit an empty group. `chore`, `docs`, `style`, `test`, `ci` and `build` stay out, unless they change something for the user. Cite the ticket or the issue when the scope is a number.
6. Show the version and the changelog, and wait for the confirmation.
7. Create the annotated tag with the changelog and push **only the tag**. The `protected-branch-push` hook allows `refs/tags/`:
   ```bash
   git tag -a vX.Y.Z -F - <<'EOF'
   <changelog>
   EOF
   git push origin refs/tags/vX.Y.Z
   ```
8. Create the release on the forge. Load the `git:forge` skill (Skill tool) to find the forge and the tool:
   - GitHub: `gh release create vX.Y.Z --notes-file <changelog>` (with `--prerelease` for rc);
   - GitLab: `create_release` through the MCP, or `glab release create vX.Y.Z --notes-file <changelog>`;
   - no tool: ask the user for permission to install the CLI. Then install it, and check that it works. If it cannot work (for example, a login that needs a browser), hand the user the link to create the release by hand (`<repo url>/releases/new?tag=vX.Y.Z` on GitHub, `<project url>/-/releases/new?tag_name=vX.Y.Z` on GitLab) and the changelog to paste.
9. Return the version and the link of the release (or of the tag).

If the repo has a `CHANGELOG.md`, update it **before**, in a regular PR/MR (`/git:commit /git:mr`). The tag comes after the merge.
