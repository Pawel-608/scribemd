# scribemd

A permissionless markdown workspace for writing alongside Claude (or anyone).

Click "Create" → get a unique URL → share it with a collaborator. Anyone with
the URL can read and edit the notes in that workspace. No login, no signup —
the URL itself is the access credential.

## How it works

- **One click creates a workspace.** The server generates a UUID and an empty
  `data/<uuid>/` directory. You're redirected to `/w/<uuid>`.
- **The URL is the only credential.** Anyone with it can read, write, and
  delete markdown files in that workspace. Treat it like a password.
- **Share with Claude.** Paste the URL into a Claude conversation and ask it
  to read/edit the notes via the JSON API (see below). Or share it with a
  human collaborator the same way.

## Quickstart

Requirements: Node 20+.

```bash
git clone https://github.com/Pawel-608/scribemd.git
cd scribemd
npm install
npm run dev
```

Open <http://localhost:3000> and click **Create new workspace**.

## API

All endpoints are JSON. Workspace IDs are v4 UUIDs.

| Method | Path                                       | Body                  | Returns |
|--------|--------------------------------------------|-----------------------|---------|
| POST   | `/api/workspaces`                          | —                     | `{ id }` |
| GET    | `/api/workspaces/:id/files`                | —                     | `{ files: string[] }` |
| GET    | `/api/workspaces/:id/files/:path`          | —                     | `{ path, content }` |
| PUT    | `/api/workspaces/:id/files/:path`          | `{ content: string }` | `{ ok: true }` |
| DELETE | `/api/workspaces/:id/files/:path`          | —                     | `{ ok: true }` |

`:path` may include `/` for subdirectories. Only `.md` files are accepted.

Example — create a workspace and write a note:

```bash
ID=$(curl -s -X POST http://localhost:3000/api/workspaces | jq -r .id)
curl -X PUT "http://localhost:3000/api/workspaces/$ID/files/hello.md" \
  -H 'content-type: application/json' \
  -d '{"content":"# Hi from curl"}'
open "http://localhost:3000/w/$ID"
```

## Storage

Workspaces are stored as plain directories under `./data/<uuid>/`. Override
the location with `SCRIBEMD_DATA_DIR=/path/to/storage`. The directory is
gitignored — your notes are not in the repo.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- `react-markdown` + `remark-gfm` for live preview

## Caveats

- No auth, no rate limiting — fine for local/trusted deployments, not the
  public internet without a reverse proxy that adds those.
- No conflict resolution: last writer wins.
- No history beyond the filesystem. Wrap `data/` in your own git repo or
  backup if you need it.

## License

MIT — see [LICENSE](LICENSE).
