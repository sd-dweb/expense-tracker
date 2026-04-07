# Expense Tracker — GCP Deployment

Deploy the app to **Google Cloud Run** using Docker + Cloud Build.

---

## Prerequisites

| Tool | Install |
|------|---------|
| [gcloud CLI](https://cloud.google.com/sdk/docs/install) | `brew install --cask google-cloud-sdk` |
| [Docker](https://www.docker.com/products/docker-desktop) | Only needed for local testing |
| A **GCP project** with billing enabled | [console.cloud.google.com](https://console.cloud.google.com) |
| A **MongoDB Atlas** cluster | [mongodb.com/atlas](https://www.mongodb.com/atlas) |

---

## How to Use

### Complete workflow (start to finish)

**Step 1 — Clone & enter the project**
```bash
git clone <your-repo-url>
cd expense-tracker
```

**Step 2 — Run one-time setup** _(first deployment only)_
```bash
bash deployment/setup.sh
```
This enables GCP APIs, creates the Artifact Registry repo, and stores your secrets securely in Secret Manager.

**Step 3 — Deploy**
```bash
bash deployment/deploy.sh
```
The script builds the Docker image via Cloud Build, pushes it to Artifact Registry, and deploys it to Cloud Run. On the **first deploy** it automatically patches the `AUTH_URL` environment variable with the real Cloud Run URL.

**Step 4 — Open your app**

The final URL is printed at the end of the script. It looks like:
```
https://expense-tracker-<hash>-uc.a.run.app
```

---

### Re-deploying after code changes

```bash
# Latest tag (default)
bash deployment/deploy.sh

# Specific version tag
IMAGE_TAG=v1.2.0 bash deployment/deploy.sh
```

### Deploying to a different project or region

```bash
GCP_PROJECT_ID=my-other-project \
GCP_REGION=europe-west1 \
bash deployment/deploy.sh
```

---

## First-time Setup (run once)

```bash
# From the project root
bash deployment/setup.sh
```

This script will:
1. Authenticate you with Google Cloud (`gcloud auth login`)
2. Enable required APIs: Artifact Registry, Cloud Build, Cloud Run, Secret Manager
3. Create the Docker image repository in Artifact Registry
4. Securely store `MONGODB_URI` and `AUTH_SECRET` in **Secret Manager**

> **MongoDB URI format:**
> ```
> mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<AppName>
> ```
> Configure your Atlas network access using an IP allowlist limited to your
> Cloud Run egress IPs, or prefer private connectivity such as
> [VPC peering](https://www.mongodb.com/docs/atlas/security-vpc-peering/).
> Use `0.0.0.0/0` only as a temporary, last-resort troubleshooting step.

---


## What `deploy.sh` does

| Step | Action |
|------|--------|
| 1 | Configures `gcloud` project & region |
| 2 | Builds the Docker image via **Cloud Build** and pushes to Artifact Registry |
| 3 | Resolves the existing Cloud Run service URL for `AUTH_URL` |
| 4 | Deploys to **Cloud Run** with secrets from Secret Manager |
| auto | On the **first deploy**, patches `AUTH_URL` with the real Cloud Run URL |

---

## Environment Variables on Cloud Run

| Variable | Source | Description |
|----------|--------|-------------|
| `MONGODB_URI` | Secret Manager | MongoDB Atlas connection string |
| `AUTH_SECRET` | Secret Manager | NextAuth signing secret |
| `AUTH_URL` | Env var (set by script) | Public URL of the app |
| `NEXT_PUBLIC_APP_NAME` | Env var | Display name |
| `NODE_ENV` | Env var | `production` |

> Secrets are **never** stored in plain env vars or baked into the image.
> They are injected at runtime via `--set-secrets`.

---

## Useful Commands

```bash
# View running service
gcloud run services describe expense-tracker --region us-central1

# Stream logs
gcloud run services logs tail expense-tracker --region us-central1

# Rollback to previous revision
gcloud run services update-traffic expense-tracker \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# Update a secret value
echo -n "new-value" | gcloud secrets versions add MONGODB_URI --data-file=-
```

---

## How the Artifact Is Built & Launched

### Multi-stage Docker build

The `Dockerfile` at the project root uses three stages to produce a minimal, secure production image:

| Stage | Base image | What it does |
|-------|------------|--------------|
| `deps` | `node:20-alpine` | Runs `npm ci` to install all dependencies into a clean layer |
| `builder` | `node:20-alpine` | Copies the source + deps, then runs `npm run build` to produce the **Next.js standalone output** |
| `runner` | `node:20-alpine` | Copies only the runtime-required files (no source, no full `node_modules`) and defines the start command |

### The artifact: Next.js standalone build

`next.config.mjs` sets `output: 'standalone'`, which tells Next.js to emit a self-contained production bundle at `.next/standalone` during `npm run build`. This bundle:

- Contains `server.js` — a lightweight Node.js HTTP server (no `next start` or Next.js CLI needed at runtime)
- Includes only the minimal `node_modules` subset required at runtime
- Does **not** include static assets; those are copied separately

The final Docker image is laid out as:

```
/app/
├── server.js            ← Next.js standalone server entry point
├── node_modules/        ← Minimal runtime dependency subset
├── public/              ← Static public files (images, icons, etc.)
└── .next/
    └── static/          ← Compiled CSS / JS chunks, fonts, etc.
```

### How the artifact is launched

When Cloud Run starts a container instance it executes the `CMD` defined in the `Dockerfile`:

```dockerfile
CMD ["node", "server.js"]
```

`server.js` is run directly by Node.js (no Next.js CLI involved). It:

1. Reads `PORT` (set to `3000`) and `HOSTNAME` (set to `0.0.0.0`) from the environment
2. Starts an HTTP server that handles all Next.js routing: SSR pages, API routes, and static assets
3. Receives environment variables (`MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`) injected by Cloud Run from Secret Manager at container startup

### End-to-end deployment flow

```
Developer → bash deployment/deploy.sh
                │
                ├─ Step 1 — gcloud project & region configured
                │
                ├─ Step 2 — Cloud Build
                │     • Uploads source to GCS
                │     • Builds Docker image (3-stage Dockerfile)
                │         deps  → install node_modules
                │         builder → npm run build (.next/standalone)
                │         runner  → copy runtime files only
                │     • Pushes image to Artifact Registry
                │
                ├─ Step 3 — Resolve AUTH_URL from existing Cloud Run service
                │
                └─ Step 4 — Cloud Run deploy
                      • Pulls image from Artifact Registry
                      • Injects secrets: MONGODB_URI, AUTH_SECRET (from Secret Manager)
                      • Sets env vars: AUTH_URL, NODE_ENV=production, …
                      • Starts container  →  node server.js  →  listens on :3000
                      • Exposes public HTTPS endpoint
                      • On first deploy: patches AUTH_URL with the real Cloud Run URL
```

---

## File Reference

```
deployment/
  setup.sh    # One-time bootstrap: APIs, Artifact Registry repo, secrets
  deploy.sh   # Build + push + deploy (run for every release)
  README.md   # This file
```

