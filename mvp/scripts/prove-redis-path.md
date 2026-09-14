# Prove Redis + BullMQ + Postgres path

```bash
cd mvp
docker compose up -d

# .env must have:
#   LOCAL_STACK=false
#   PDF_STORAGE=s3
#   S3_ENDPOINT=http://127.0.0.1:9000
#   S3_BUCKET=ds160-pdfs
#   S3_ACCESS_KEY=minioadmin
#   S3_SECRET_KEY=minioadmin

npm run db:migrate
# Run as separate processes (important for restart test):
npm run dev:api
npm run dev:worker
npm run dev:frontend
```

## Verified on this machine (2026-08-09)

| Check | Result |
|-------|--------|
| `docker compose up` (redis, postgres, minio) | OK |
| `GET /health` → `localStack: false` | OK |
| Postgres `jobs` table | OK |
| BullMQ worker `ready (Redis/BullMQ)` | OK |
| Job reaches `awaiting_captcha` via Redis path | OK |
| Worker kill → restart marks orphan `failed` with clear error | OK |
| MinIO put/get (`s3://ds160-pdfs/confirmations/…`) | OK |
| Full CEAC submit → `completed` + PDF download | Manual — needs live CAPTCHA |

### Worker restart behavior

1. Job paused at `awaiting_captcha`.
2. Worker process killed.
3. On next `npm run dev:worker` start, leftover BullMQ + open DB jobs are cleared with:
   `Cleared on worker start (earlier job discarded). Re-submit the job.`
4. Graceful SIGTERM also marks the active job failed immediately.

Jobs do **not** silently hang after a worker restart.
