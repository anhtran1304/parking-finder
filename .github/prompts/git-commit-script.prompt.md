---
mode: ask
description: Generate full git commit script + commit messages from current workspace changes
---

# Git Commit Script Generator

Goal: generate a ready-to-run Bash script that commits changes in logical groups, with Conventional Commit messages.

## Input
- Ticket/focus: {{ticket_or_scope}}
- Desired number of commits (optional): {{target_commit_count}}
- Test command to run before/after commits: {{test_command}}
- Files/paths that must not be added: {{exclude_paths}}

If input is missing, use defaults:
- target_commit_count: 2
- test_command:
  - `cd backend`
  - `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
  - `export PATH="$JAVA_HOME/bin:$PATH"`
  - `mvn test`
- exclude_paths:
  - `.env`
  - `**/node_modules/**`
  - `.ai/auth-learning-roadmap.md`

## Processing requirements
1. Automatically inspect current changes using:
   - `git status --short`
   - `git diff --name-only`
2. Group files into clear commit units (feature/fix/docs/test/chore).
3. Propose concise but meaningful Conventional Commit messages.
4. Return a ready-to-run Bash script that uses `set -euo pipefail`.
5. The script must include:
   - Print status before committing
   - `git add` by logical group
   - `git commit` with complete `-m` messages
   - Run test command before final commit (or after each commit if needed)
   - Print final `git status --short`
6. Do not use dangerous commands (`git reset --hard`, `git checkout --`, accidental file deletion).
7. Do not add files listed in `exclude_paths` unless the user explicitly requests it.

## Required output format
1. **Commit plan**
   - List commits in order
   - For each commit: purpose + file list
2. **Ready-to-run script**
   - One single `bash` code block that can be copied and run directly
3. **Short notes (if needed)**
   - If any file is ambiguous, ask the user for one-line confirmation

## Expected quality
- The script must be copy-paste runnable.
- Commit messages should be technical English and clearly reflect ticket scope.
- For large changes, prefer multiple meaningful small commits over one large commit.
