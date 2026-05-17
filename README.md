# scribemd

A collaborative markdown workspace for writing and editing notes alongside Claude.

scribemd is a local-first markdown editor designed for people who think in
plain text and want an AI collaborator that actually understands the whole
document, not just the cursor line.

## How collaboration works

The repo holds both the **app** (Next.js + TypeScript) and your **notes**
(`notes/*.md`, version-controlled by git).

1. **You** run the webapp locally and edit notes in the browser.
2. **Claude** (or anyone) clones the same repo elsewhere, edits notes in
   `notes/`, commits, and pushes.
3. You click **Pull** in the top bar to fetch their changes and see them
   instantly. Edit, commit, push from the UI.

Because everything is plain `.md` in git, your notes are portable, diff-able,
and editable in any other tool.

## Quickstart

Requirements: Node 20+ and git.

```bash
git clone https://github.com/Pawel-608/scribemd.git
cd scribemd
npm install
npm run dev
```

Open <http://localhost:3000>.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS
- `simple-git` for git operations
- `react-markdown` + `remark-gfm` for live preview

## Project layout

```
app/
  api/              REST routes for files + git
  components/       Sidebar, Editor, GitBar, Toast
  lib/api.ts        Typed client
  page.tsx          Main UI
lib/
  notes.ts          Safe file IO under notes/
  git.ts            simple-git wrapper
notes/              Your markdown files
```

## License

MIT — see [LICENSE](LICENSE).
