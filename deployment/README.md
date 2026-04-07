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

## File Reference

```
deployment/
  setup.sh    # One-time bootstrap: APIs, Artifact Registry repo, secrets
  deploy.sh   # Build + push + deploy (run for every release)
  README.md   # This file
```

