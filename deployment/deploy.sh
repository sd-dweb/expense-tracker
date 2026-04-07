#!/usr/bin/env bash
# deploy.sh - Build and deploy Expense Tracker to Google Cloud Run
# Usage:
#   bash deployment/deploy.sh
#   IMAGE_TAG=v1.2.0 bash deployment/deploy.sh
#
# Optional env overrides:
#   GCP_PROJECT_ID, GCP_REGION, GCP_REPO_NAME, GCP_SERVICE_NAME
#   IMAGE_TAG, MIN_INSTANCES, MAX_INSTANCES, CLOUD_RUN_MEMORY, CLOUD_RUN_CPU
#   MONGODB_URI  — pass directly to skip Secret Manager lookup
#                  e.g. MONGODB_URI="mongodb+srv://..." bash deployment/deploy.sh
set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve project root (parent of deployment/)
# Works correctly no matter which directory the script is called from.
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="${GCP_REPO_NAME:-expense-tracker-repo}"
SERVICE_NAME="${GCP_SERVICE_NAME:-expense-tracker}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
MAX_INSTANCES="${MAX_INSTANCES:-1}"
MEMORY="${CLOUD_RUN_MEMORY:-512Mi}"
CPU="${CLOUD_RUN_CPU:-1}"
MONGODB_URI="${MONGODB_URI:-}"   # Optional: supply directly to bypass Secret Manager

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
step()  { echo -e "\n${CYAN}== $* ==${NC}"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------------------
command -v gcloud &>/dev/null \
  || error "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"

if [[ -z "${PROJECT_ID}" ]]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi
if [[ -z "${PROJECT_ID}" ]]; then
  read -rp "Enter your GCP Project ID: " PROJECT_ID
  [[ -z "${PROJECT_ID}" ]] && error "Project ID cannot be empty."
fi

IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"
IMAGE_FULL="${IMAGE_BASE}:${IMAGE_TAG}"

# ---------------------------------------------------------------------------
# Summary and confirmation
# ---------------------------------------------------------------------------
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Expense Tracker  -  GCP Cloud Run Deploy  ${NC}"
echo -e "${CYAN}============================================${NC}"
info "Project   : ${PROJECT_ID}"
info "Region    : ${REGION}"
info "Service   : ${SERVICE_NAME}"
info "Image     : ${IMAGE_FULL}"
info "Resources : ${MEMORY} RAM  |  ${CPU} vCPU"
info "Instances : min=${MIN_INSTANCES}  max=${MAX_INSTANCES}"
if [[ -n "${MONGODB_URI}" ]]; then
  info "MONGODB_URI: supplied directly (bypassing Secret Manager)"
else
  info "MONGODB_URI: pulled from Secret Manager at runtime"
fi
echo ""

read -rp "Proceed with deployment? [Y/n] " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { warn "Deployment cancelled."; exit 0; }

# ---------------------------------------------------------------------------
# Step 1 - Configure gcloud
# ---------------------------------------------------------------------------
step "Step 1/4 - Configuring gcloud"
gcloud config set project "${PROJECT_ID}"
gcloud config set run/region "${REGION}"
info "Active project: ${PROJECT_ID}  |  region: ${REGION}"

# Ensure both Cloud Build SA and Compute Engine SA can push to Artifact Registry.
# Newer GCP projects route Artifact Registry pushes through the Compute SA;
# granting only the Cloud Build SA causes the uploadArtifacts permission error.
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/artifactregistry.writer" \
  --condition=None --quiet 2>/dev/null || true

info "Artifact Registry write permission confirmed for Cloud Build SA and Compute SA."

# Ensure the Artifact Registry repository exists before trying to push.
if ! gcloud artifacts repositories describe "${REPO_NAME}" \
     --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null 2>&1; then
  info "Artifact Registry repo '${REPO_NAME}' not found — creating it now..."
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for expense tracker" \
    --project="${PROJECT_ID}"
  info "Repository created."
else
  info "Artifact Registry repo '${REPO_NAME}' already exists."
fi

# Configure the local Docker credential helper so 'docker push' (if used outside
# Cloud Build) authenticates correctly against Artifact Registry.
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ---------------------------------------------------------------------------
# Step 2 - Build and push image via Cloud Build
# ---------------------------------------------------------------------------
step "Step 2/4 - Building and pushing Docker image"
gcloud builds submit \
  --tag "${IMAGE_FULL}" \
  --project "${PROJECT_ID}" \
  "${PROJECT_ROOT}"

if [[ "${IMAGE_TAG}" != "latest" ]]; then
  info "Tagging image as latest too..."
  gcloud artifacts docker tags add "${IMAGE_FULL}" "${IMAGE_BASE}:latest"
fi

# ---------------------------------------------------------------------------
# Step 3 - Resolve AUTH_URL (auto-patched on first deploy)
# ---------------------------------------------------------------------------
step "Step 3/4 - Resolving service URL"

EXISTING_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" --format "value(status.url)" 2>/dev/null || true)"

if [[ -n "${EXISTING_URL}" ]]; then
  AUTH_URL="${EXISTING_URL}"
  info "Existing service URL: ${AUTH_URL}"
else
  warn "No existing service. AUTH_URL will be patched after first deploy."
  AUTH_URL="https://placeholder.run.app"
fi

# ---------------------------------------------------------------------------
# Step 4 - Deploy to Cloud Run
# Secrets are pulled from Secret Manager (configured once by setup.sh).
# ---------------------------------------------------------------------------
step "Step 4/4 - Deploying to Cloud Run"

# Build a single --set-secrets flag and an optional extra env-var for MONGODB_URI.
# --set-secrets replaces ALL secret bindings, so AUTH_SECRET + MONGODB_URI (when
# using Secret Manager) must be combined in one flag.
if [[ -n "${MONGODB_URI}" ]]; then
  SECRETS_FLAG="--set-secrets=AUTH_SECRET=AUTH_SECRET:latest"
  MONGODB_ENV_FLAG="--set-env-vars=MONGODB_URI=${MONGODB_URI}"
  info "Using MONGODB_URI supplied directly as env var."
else
  SECRETS_FLAG="--set-secrets=AUTH_SECRET=AUTH_SECRET:latest,MONGODB_URI=MONGODB_URI:latest"
  MONGODB_ENV_FLAG=""
  info "Using MONGODB_URI from Secret Manager."
fi

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_FULL}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --min-instances "${MIN_INSTANCES}" \
  --max-instances "${MAX_INSTANCES}" \
  ${SECRETS_FLAG} \
  ${MONGODB_ENV_FLAG} \
  --set-env-vars="AUTH_URL=${AUTH_URL},AUTH_TRUST_HOST=true,NEXT_PUBLIC_APP_NAME=Expense Tracker,NODE_ENV=production"

# ---------------------------------------------------------------------------
# Retrieve final URL and patch AUTH_URL on first deploy
# ---------------------------------------------------------------------------
FINAL_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" --format "value(status.url)")"

info "Service deployed successfully!"
info "URL: ${FINAL_URL}"

if [[ "${AUTH_URL}" == "https://placeholder.run.app" ]]; then
  warn "First deployment - patching AUTH_URL to ${FINAL_URL}"
  gcloud run services update "${SERVICE_NAME}" \
    --region "${REGION}" \
    --update-env-vars "AUTH_URL=${FINAL_URL}"
  info "AUTH_URL patched. NextAuth redirects will work correctly."
fi

echo ""
info "Open your app: ${FINAL_URL}"
