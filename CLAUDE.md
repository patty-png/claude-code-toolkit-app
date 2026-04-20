# Claude Code Toolkit App — Claude Config

> Deployed cloud version of the Claude Code Toolkit directory.
> The static single-file version lives at `../claude-code-toolkit/` and is frozen at v18.

## Primary reference

Read **`ARCHITECTURE.md`** before touching anything. It is the source of truth for:
- Stack decisions + why each was chosen
- Full DB schema (Postgres DDL)
- File structure
- Phase-by-phase implementation plan with "Done when" gates
- Environment variables

Do not deviate from ARCHITECTURE.md without asking first.

## Rules of engagement

1. **Execute phases in order.** Phase N must pass its "Done when" gate before Phase N+1 begins.
2. **Commit per phase** using the conventional commit messages specified in ARCHITECTURE.md.
3. **Tag each phase** (`git tag -a phase-N -m "..."`) after commit, push tags.
4. **Port UI from v18 verbatim in Phase 3** — don't redesign. The editorial feel, Claude brand colors, Fraunces + Plex typography, and terminal landing are all in v18's `index.html` at `../claude-code-toolkit/index.html`. Copy, don't reinterpret.
5. **Server components by default.** Only use `'use client'` when you need interactivity (search input, terminal animation, copy button, dialogs).
6. **No shadcn/ui.** Build primitives in `src/components/ui/` to keep the editorial aesthetic.
7. **Never commit `.env.local`.** It's gitignored — verify before every push.
8. **Always paste content inline.** When the user needs to copy/paste something (SQL, config, env vars), paste the full content in chat. Never tell them to "open file X and copy the contents" — it's slower and breaks flow.

## 🚨 FORBIDDEN COMMANDS

**Never run these on this repo — they destroy history or overwrite user work:**

```bash
git push --force            # rewrites remote history, loses commits from other sources
git push -f                 # same thing, shorthand
git reset --hard origin/X   # throws away all local changes irreversibly
git reset --hard <sha>      # same, on any target
git checkout -- .           # discards every unstaged edit in the working tree
git restore .               # same as above
git clean -fd               # deletes untracked files + directories (e.g. .env.local gone)
git branch -D master        # force-delete current branch
git rebase -i               # interactive — hangs in non-interactive shells and rewrites history
git commit --amend          # rewrites the last commit; bad on pushed commits
```

**Why this matters:** this repo is in active development with no branch protection. One destructive command can erase hours of work or push broken code live on Vercel within 30 seconds.

**If you think you need one of these:** stop and ask the user first. There's almost always a non-destructive alternative:
- Instead of `--force`: use `git revert <sha>` to make a new commit that undoes changes
- Instead of `reset --hard`: use `git stash` to save work, or `git checkout <file>` for specific files
- Instead of `--amend` on pushed commits: make a new commit with a `fixup:` prefix

## Brand palette (Claude Code official)

```
--paper: #f0eee6    --ink: #141413       --accent: #cc785c
--paper-2: #e8e4d8  --ink-2: #2b2926     --accent-ink: #a0583f
--paper-3: #ddd6c5  --muted: #7a736b     --accent-soft: #e8c5b6
--rule: #d4ccbc     --term-bg: #181715   --term-accent: #e89b7d
```

## Coding style

- TypeScript strict mode, no `any` unless justified with comment
- Server actions over API routes when possible (less boilerplate)
- Zod schemas for every form + server action input
- `next/image` for all images (never raw `<img>`)
- `next/font` for Fraunces + IBM Plex Sans + JetBrains Mono — declare once in root layout
- Tailwind for layout + spacing; CSS vars for brand colors only
- File naming: `PascalCase.tsx` for components, `kebab-case.ts` for utilities

## Directory context

| Path | Purpose |
|---|---|
| `../claude-code-toolkit/` | Frozen v18 static version — reference only |
| `../claude-code-toolkit-app/` | This repo — the deployed full-stack version |

## Workflow

1. User switches to Sonnet 4.6 when ready to implement
2. Read current phase in ARCHITECTURE.md
3. Implement each step in order
4. Commit, tag, push at phase end
5. Verify "Done when" condition before advancing

## When in doubt

- Unclear schema decision? → re-read ARCHITECTURE.md DB section
- Unclear UI pattern? → copy from `../claude-code-toolkit/index.html`
- Unclear stack choice? → "Stack Decisions" table in ARCHITECTURE.md
- Everything else? → ask user before improvising
