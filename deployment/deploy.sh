#!/usr/bin/env bash
# deploy.sh - Build and deploy Expense Tracker to Google Cloud Run
# Usage:
#   bash deployment/deploy.sh
#   IMAGE_TAG=v1.2.0 bash deployment/deploy.sh
#
# Optional env overrides:
#   GCP_PROJECT_ID, GCP_REGION, GCP_REPO_NAME, GCP_SERVICE_NAME
#   IMAGE_TAG, MIN_INSTANCES, MAX_INSTANCES, CLOUD_RUN_MEMORY, CLOUD_RUN_CPU
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
echo ""

read -rp "Proceed with deployment? [y/N] " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { warn "Deployment cancelled."; exit 0; }

# ---------------------------------------------------------------------------
# Step 1 - Configure gcloud
# ---------------------------------------------------------------------------
step "Step 1/4 - Configuring gcloud"
gcloud config set project "${PROJECT_ID}"
gcloud config set run/region "${REGION}"
info "Active project: ${PROJECT_ID}  |  region: ${REGION}"

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

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_FULL}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --min-instances "${MIN_INSTANCES}" \
  --max-instances "${MAX_INSTANCES}" \
  --set-secrets="MONGODB_URI=MONGODB_URI:latest" \
  --set-secrets="AUTH_SECRET=AUTH_SECRET:latest" \
  --set-env-vars="AUTH_URL=${AUTH_URL}" \
  --set-env-vars="NEXT_PUBLIC_APP_NAME=Expense Tracker" \
  --set-env-vars="NODE_ENV=production"

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
