# LostAndFound Backend

FastAPI backend for the campus lost-and-found frontend.

## Run Locally

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

The Vite frontend uses `http://localhost:8000` by default. Override it with:

```bash
VITE_API_URL=http://localhost:8000 pnpm dev
```

## API Surface

- `GET /health` checks service status.
- `POST /v1/auth/demo-session` creates a role-scoped bearer token for the demo UI.
- `GET /v1/items` searches and filters lost/found records.
- `POST /v1/items` creates a lost or found report.
- `POST /v1/claims` creates a verification claim.
- `PATCH /v1/claims/{claim_id}/stage` advances claims for staff/admin users.
- `GET /v1/map` returns campus zones, paths, and live pins for the 3D map.
- `POST /v1/cctv-requests` queues a security review request.

SQLite data is created at `backend/lost_found.sqlite3` on first startup. Set
`LOST_FOUND_DB=/path/to/file.sqlite3` to use a different database file.
