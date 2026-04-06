#!/usr/bin/env bash
# =============================================================================
# setup.sh  —  One-time Google Cloud project bootstrap
# Run this ONCE before your first deployment.
# Usage: bash deployment/setup.sh
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="expense-tracker-repo"

# ── Helpers ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Validate ──────────────────────────────────────────────────────────────────
command -v gcloud &>/dev/null || error "gcloud CLI not found. Install it: https://cloud.google.com/sdk/docs/install"

if [[ -z "$PROJECT_ID" ]]; then
  read -rp "Enter your GCP Project ID: " PROJECT_ID
  [[ -z "$PROJECT_ID" ]] && error "Project ID cannot be empty."
fi

info "Using project: $PROJECT_ID  |  region: $REGION"

# ── Authenticate & set project ────────────────────────────────────────────────
info "Authenticating with Google Cloud..."
gcloud auth login --quiet

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

# ── Enable required APIs ──────────────────────────────────────────────────────
info "Enabling required APIs (this may take a minute)..."
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com

# ── Grant required IAM permissions ───────────────────────────────────────────
info "Configuring IAM permissions for Cloud Build..."

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Cloud Build SA: read/write build source in GCS + run builds
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/storage.admin" \
  --condition=None --quiet

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/cloudbuild.builds.builder" \
  --condition=None --quiet

# Cloud Build SA: deploy to Cloud Run
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.admin" \
  --condition=None --quiet

# Compute Engine SA: full storage access for Cloud Build source bucket
# (storage.objectAdmin alone is insufficient — Cloud Build needs storage.objects.get
#  which requires roles/storage.admin at the project level)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/storage.admin" \
  --condition=None --quiet

info "IAM permissions configured."

# ── Create Artifact Registry repository ──────────────────────────────────────
if gcloud artifacts repositories describe "$REPO_NAME" \
     --location="$REGION" &>/dev/null 2>&1; then
  warn "Artifact Registry repo '$REPO_NAME' already exists — skipping."
else
  info "Creating Artifact Registry repository: $REPO_NAME"
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for expense tracker"
fi

# ── Store secrets in Secret Manager ──────────────────────────────────────────
info "Setting up secrets in Secret Manager..."

store_secret() {
  local name="$1"
  local prompt="$2"
  local value="${3:-}"

  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null 2>&1; then
    warn "Secret '$name' already exists — skipping."
    return
  fi

  if [[ -z "$value" ]]; then
    read -rsp "$prompt: " value
    echo
  fi

  echo -n "$value" | gcloud secrets create "$name" \
    --data-file=- \
    --replication-policy=automatic \
    --project="$PROJECT_ID"
  info "Secret '$name' created."
}

store_secret "MONGODB_URI"  "Enter your MongoDB URI" "${MONGODB_URI:-}"
store_secret "AUTH_SECRET"  "Enter AUTH_SECRET (or press Enter to generate)" "$(openssl rand -base64 32)"

echo ""
info "✅  Setup complete!"
info "   Project  : $PROJECT_ID"
info "   Region   : $REGION"
info "   Repo     : $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME"
info ""
info "Next step → run:  bash deployment/deploy.sh"
