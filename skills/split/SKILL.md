---
name: split
description: Splits a large branch into smaller chained branches, one per subject, each ready for a small PR/MR. The original branch stays untouched.
argument-hint: "[branch] [/<plugin>:<command> ...]"
---

# git:split

**Never** change or delete the original branch. It is the backup. Everything goes into new branches.

## Steps

1. The working tree must be clean (`git status`). If it is not, stop and ask the user to commit or stash.
2. Find the base: `git fetch origin` and `git merge-base origin/<default-branch> <branch>`. The default branch comes from `git symbolic-ref --short refs/remotes/origin/HEAD`.
3. Read what the branch changes: `git log --reverse --format='%h %s' <base>..<branch>` and `git diff --stat <base>...<branch>`.
4. Propose the parts, in dependency order (the base comes first):
   - each part has one subject only, can be reviewed alone and preferably has fewer than ~400 lines;
   - a refactor and a rename come before the feature that depends on them;
   - tests stay with the code that they test.
   Show the list (`<n>. <type>/<subject-kebab>`: the commits or files of each part) and wait for the confirmation.
5. Build each part from the previous one (the first one comes from the base):
   ```bash
   git switch -c <type>/<subject>-<n> <previous-part|base>
   ```
   - commits that are already atomic: `git cherry-pick <hash>...`;
   - a commit that mixes subjects: `git checkout <branch> -- <files>` and commit with the `git:commit` skill (Skill tool).
   A file that goes into more than one part: apply only the hunks of that part. Run `git diff <base> <branch> -- <file>` into a temporary file (`mktemp`), edit the patch and run `git apply`.
6. Check that the last part reproduces the original: `git diff <last-part> <branch>` must be empty. If it is not, show what is missing and fix it before you continue.
7. Run `git push -u origin <part>` for each part.
8. With a command in the arguments (`/git:mr`, for example), invoke that skill (Skill tool) for each part, in order, with `target:<previous-part>`. The first part targets the default branch. Ask it to cite the previous PR/MR under "References".
9. Return the chain (`part 1 ← part 2 ← ...`) and remind the user that the merge goes in order. After the merge of part 1, GitHub and GitLab retarget part 2 to the default branch by themselves if the branch of part 1 is removed.
