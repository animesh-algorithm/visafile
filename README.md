# DS-160 MVP

End-to-end loop from [spec.md](../spec.md): schema-driven intake → API → worker → live CAPTCHA/corrections → confirmation PDF.

Root `src/`, `fixtures/`, and `schema/` are **not modified**.

## Quick start (no Docker) — `LOCAL_STACK=true`

```bash
cd mvp
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

- UI: http://localhost:5173  
- WS test: http://localhost:3001/test-ws.html  
- PDFs: local store at `data/pdf-store/` (`PDF_STORAGE=local`)

## Redis + BullMQ + Postgres + MinIO (`LOCAL_STACK=false`)

Requires Docker on your `PATH`. See [scripts/prove-redis-path.md](scripts/prove-redis-path.md).

```bash
docker compose up -d
# set LOCAL_STACK=false and PDF_STORAGE=s3 (+ S3_* vars) in .env
npm run db:migrate
npm run dev:api
npm run dev:worker   # separate process — needed for restart test
npm run dev:frontend
```

Worker restart during `awaiting_captcha`: BullMQ lock is 15m; if the worker process dies, the job is marked **failed** with a clear error (not left hanging).

## Environment

| Variable | Purpose |
|----------|---------|
| `LOCAL_STACK` | `true` = SQLite + in-process queue (default) |
| `DATABASE_URL` | Postgres URL when `LOCAL_STACK=false` |
| `REDIS_URL` | Redis URL when `LOCAL_STACK=false` |
| `PDF_STORAGE` | `local` or `s3` |
| `PDF_LOCAL_DIR` | Local PDF directory |
| `S3_ENDPOINT` | MinIO endpoint, e.g. `http://127.0.0.1:9000` |
| `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Object storage credentials |

## Layout

```
mvp/
  shared/schema/   JSON Schema (FE + BE source of truth)
  shared/storage/  PdfStorage interface (local | S3/MinIO)
  frontend/        Schema-driven form + correction UI
  api/             Fastify + WebSocket
  worker/          BullMQ or in-process queue
  docker-compose.yml  redis, postgres, minio
```

## About the creator

Created by [Animesh Sharma](https://animesh.cc). For product design and development work, visit [Hire Animesh](https://hire.animesh.cc).
