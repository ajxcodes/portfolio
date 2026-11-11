#!/usr/bin/env bash
set -euo pipefail

SCRIPT_START=$(date +%s)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export DOCKER_HOST="${DOCKER_HOST:-unix:///run/user/$(id -u)/podman/podman.sock}"
export TESTCONTAINERS_RYUK_DISABLED="${TESTCONTAINERS_RYUK_DISABLED:-true}"
export DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
export DOTNET_USE_POLLING_FILE_WATCHER=1
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/home/ajxcodes/.cache/ms-playwright}"
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:5808}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:5808}"

# Ensure podman socket exists when using user socket
if [[ "$DOCKER_HOST" == unix:///run/user/*/podman/podman.sock ]]; then
  SOCK_PATH="${DOCKER_HOST#unix://}"
  if [[ ! -S "$SOCK_PATH" ]]; then
    mkdir -p "$(dirname "$SOCK_PATH")"
    if command -v systemctl >/dev/null 2>&1; then
      systemctl --user start podman.socket || true
    fi
  fi
fi

# Load DB env from the same source compose uses so psql matches the container.
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
DB_NAME="${DB_NAME:-portfolio}"
DB_USER="${DB_USER:-user}"
DB_PASSWORD="${DB_PASSWORD:-password}"

# Pick compose command.
COMPOSE_CMD=()
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
elif command -v podman-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(podman-compose)
else
  echo "ERROR: neither docker-compose nor podman-compose found" >&2
  exit 1
fi

OVERRIDE_FILE="$(mktemp -t verify-e2e-compose.XXXXXX.yml)"
TMP_RESP="$(mktemp -t verify-e2e-resp.XXXXXX.json)"
STACK_STARTED=0
VERIFY_RESULT=0

cleanup() {
  local exit_code=$?
  # Teardown must be non-fatal and must not change the script's verdict.
  if [[ $STACK_STARTED -eq 1 ]]; then
    echo "==> Tearing down podman stack (non-fatal)"
    set +e
    "${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" down --remove-orphans >/dev/null 2>&1
    # Best-effort removal of any stray named containers that can block the next run.
    if command -v podman >/dev/null 2>&1; then
      podman rm -f db api web minio geoip ollama >/dev/null 2>&1 || true
    fi
    set -e
  fi
  rm -f "$OVERRIDE_FILE" "$TMP_RESP"
  local elapsed=$(( $(date +%s) - SCRIPT_START ))
  echo "==> verify-e2e.sh wall-clock duration: ${elapsed}s"
  if [[ $VERIFY_RESULT -ne 0 ]]; then
    exit "$VERIFY_RESULT"
  fi
  exit $exit_code
}
trap cleanup EXIT

fail() {
  echo "ERROR: $*" >&2
  VERIFY_RESULT=1
  exit 1
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local timeout="${3:-120}"
  local start
  start=$(date +%s)
  until curl -fsS "$url" >/dev/null 2>&1; do
    if (( $(date +%s) - start >= timeout )); then
      echo "ERROR: timed out waiting for $name at $url" >&2
      return 1
    fi
    sleep 2
  done
  echo "Ready: $name ($url)"
}

sql() {
  local query="$1"
  "${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" exec -T db \
    psql -U "$DB_USER" -d "$DB_NAME" -tAc "$query"
}

# --- Collision detection: fixed container names / host ports from compose ---
CONTAINER_NAMES=(db api web minio geoip)
PORTS=(5432 5808 3000 9000 8080)

if command -v podman >/dev/null 2>&1; then
  for name in "${CONTAINER_NAMES[@]}"; do
    state=$(podman ps -a --filter "name=^${name}$" --format '{{.Names}} {{.Status}}' 2>/dev/null || true)
    if [[ -n "$state" ]]; then
      fail "pre-existing container blocks bring-up: '$state'. Remove it (e.g. 'podman rm -f ${name}') or stop the conflicting stack before running this script."
    fi
  done
fi

for port in "${PORTS[@]}"; do
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :${port} )" 2>/dev/null | grep -q ":${port}"; then
      fail "host port ${port} is already bound. Free the port or stop the conflicting service before running this script."
    fi
  elif command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      fail "host port ${port} is already bound. Free the port or stop the conflicting service before running this script."
    fi
  fi
done

# --- Compose override: inotify env vars must reach the API container ---
cat > "$OVERRIDE_FILE" <<'YAML'
services:
  api:
    environment:
      - DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
      - DOTNET_USE_POLLING_FILE_WATCHER=1
YAML

# --- Build images only if missing/stale (reuse cached images to stay within budget) ---
build_if_missing() {
  local service="$1"
  shift
  local dockerfile_path=""
  if [[ "$service" == "web" ]]; then
    dockerfile_path="apps/web/Dockerfile"
  fi

  if command -v podman >/dev/null 2>&1; then
    local found_image=""
    for image in "$@"; do
      if podman image exists "$image" >/dev/null 2>&1; then
        found_image="$image"
        break
      fi
    done

    if [[ -n "$found_image" ]]; then
      if [[ -n "$dockerfile_path" && -f "$dockerfile_path" ]]; then
        local image_created dockerfile_mtime
        image_created=$(podman image inspect --format '{{.Created}}' "$found_image" 2>/dev/null | head -n1 || true)
        dockerfile_mtime=$(date -r "$dockerfile_path" +%s 2>/dev/null || echo 0)
        local image_epoch=0
        if [[ -n "$image_created" ]]; then
          image_epoch=$(date -d "$image_created" +%s 2>/dev/null || echo 0)
        fi
        if [[ "$dockerfile_mtime" -gt "$image_epoch" ]]; then
          echo "==> Rebuilding stale image for service: $service ($dockerfile_path newer than $found_image)"
          "${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" build "$service"
          return 0
        fi
      fi
      echo "==> Reusing existing image: $found_image ($service)"
      return 0
    fi

    echo "==> Building missing image for service: $service"
    "${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" build "$service"
  else
    echo "==> Building service (podman not available to check cache): $service"
    "${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" build "$service"
  fi
}

echo "==> Ensuring container images are available"
build_if_missing "api" "localhost/portfolio-114-api:latest" "portfolio-114-api:latest" "localhost/portfolio-114_api:latest"
build_if_missing "web" "localhost/portfolio-114-web:latest" "portfolio-114-web:latest" "localhost/portfolio-114_web:latest"

echo "==> Bringing up podman stack (db, minio, geoip, api, web)"
"${COMPOSE_CMD[@]}" -f docker-compose.yml -f "$OVERRIDE_FILE" up -d db minio geoip api web
STACK_STARTED=1

# Allow enough time for startup but keep overall script within 300s gate budget.
wait_for_http "http://127.0.0.1:5808/api/projects" "API" 120 || fail "API did not become ready"
wait_for_http "http://127.0.0.1:3000" "Web" 120 || fail "Web did not become ready"

echo "==> Seeding database"
node apps/web/e2e/seed.js || fail "database seeding failed"

echo "==> Running Playwright suite against running container"
# Do not force CI=true: playwright.config.ts uses reuseExistingServer=!process.env.CI,
# and we need it to reuse the already-running container on localhost:3000.
CI= pnpm --dir apps/web exec playwright test || fail "Playwright suite failed"

echo "==> Live project CRUD proof (AC18)"
PROFILE_ID="$(sql "SELECT \"Id\" FROM \"ResumeProfiles\" LIMIT 1;" | tr -d '[:space:]')"
if [[ -z "$PROFILE_ID" ]]; then
  fail "could not determine ResumeProfileId from DB"
fi

UNIQ="$(date +%s%N)"
SHARED_TAG="shared-live-tag-${UNIQ}"

CREATE_PAYLOAD=$(cat <<JSON
{
  "title": "Live CRUD Project ${UNIQ}",
  "slug": "live-crud-project-${UNIQ}",
  "summary": "Live CRUD proof",
  "content": "# Live CRUD\n\nProof content",
  "visible": true,
  "canonicalUrl": null,
  "resumeProfileId": "${PROFILE_ID}",
  "tags": ["${SHARED_TAG}", "live"],
  "projectLinks": [
    {"type":"homepage","url":"https://live.example.com/home","label":"Home"},
    {"type":"github","url":"https://live.example.com/repo","label":"Repo"},
    {"type":"store","url":"https://live.example.com/store","label":"Store"}
  ]
}
JSON
)

CREATE_STATUS=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -X POST "$API_BASE_URL/api/projects" -H "Content-Type: application/json" -d "$CREATE_PAYLOAD")
if [[ "$CREATE_STATUS" != "201" ]]; then
  echo "Response body:" >&2; cat "$TMP_RESP" >&2 || true
  fail "create project expected 201, got $CREATE_STATUS"
fi
PROJECT_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(j.id);" "$TMP_RESP")
echo "Created project: $PROJECT_ID"

# Create a blog post with the same tag name to prove content-type separation
BLOG_PAYLOAD=$(cat <<JSON
{
  "title": "Live Shared Tag Blog ${UNIQ}",
  "slug": "live-shared-tag-blog-${UNIQ}",
  "summary": "Shared tag blog",
  "content": "Shared tag content",
  "visible": true,
  "canonicalUrl": null,
  "resumeProfileId": "${PROFILE_ID}",
  "tags": ["${SHARED_TAG}"]
}
JSON
)
BLOG_STATUS=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -X POST "$API_BASE_URL/api/blog/posts" -H "Content-Type: application/json" -d "$BLOG_PAYLOAD")
if [[ "$BLOG_STATUS" != "201" ]]; then
  echo "Response body:" >&2; cat "$TMP_RESP" >&2 || true
  fail "create blog post expected 201, got $BLOG_STATUS"
fi
BLOG_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(j.id);" "$TMP_RESP")

UPDATE_PAYLOAD=$(cat <<JSON
{
  "title": "Live CRUD Project ${UNIQ} Updated",
  "slug": "live-crud-project-${UNIQ}",
  "summary": "Live CRUD proof updated",
  "content": "# Live CRUD\n\nUpdated proof content",
  "visible": true,
  "canonicalUrl": null,
  "resumeProfileId": "${PROFILE_ID}",
  "tags": ["${SHARED_TAG}", "updated"],
  "projectLinks": [
    {"type":"github","url":"https://live.example.com/repo-v2","label":"Repo v2"},
    {"type":"docs","url":"https://live.example.com/docs","label":"Docs"}
  ]
}
JSON
)

PUT_STATUS=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -X PUT "$API_BASE_URL/api/projects/${PROJECT_ID}" -H "Content-Type: application/json" -d "$UPDATE_PAYLOAD")
echo "PUT /api/projects/${PROJECT_ID} status: ${PUT_STATUS}"
if [[ "$PUT_STATUS" != "200" ]]; then
  echo "Response body:" >&2; cat "$TMP_RESP" >&2 || true
  fail "update project expected 200, got $PUT_STATUS"
fi

LINK_COUNT=$(sql "SELECT COUNT(*) FROM \"ProjectLinks\" WHERE \"ProjectId\"='${PROJECT_ID}';" | tr -d '[:space:]')
TAG_ASSIGN_COUNT=$(sql "SELECT COUNT(*) FROM \"ContentTagAssignments\" WHERE \"ContentItemId\"='${PROJECT_ID}';" | tr -d '[:space:]')
OLD_LINK_COUNT=$(sql "SELECT COUNT(*) FROM \"ProjectLinks\" WHERE \"ProjectId\"='${PROJECT_ID}' AND \"Url\" IN ('https://live.example.com/home','https://live.example.com/store');" | tr -d '[:space:]')
SHARED_TAG_ROWS=$(sql "SELECT COUNT(*) FROM \"ContentTags\" WHERE \"Name\"='${SHARED_TAG}';" | tr -d '[:space:]')
SHARED_TAG_TYPES=$(sql "SELECT STRING_AGG(\"ContentType\"::text, ',' ORDER BY \"ContentType\"::text) FROM \"ContentTags\" WHERE \"Name\"='${SHARED_TAG}';" | tr -d '[:space:]')

echo "ProjectLinks count: ${LINK_COUNT} (expected 2)"
echo "ContentTagAssignments count: ${TAG_ASSIGN_COUNT} (expected 2)"
echo "Orphaned old link rows: ${OLD_LINK_COUNT} (expected 0)"
echo "Shared tag rows: ${SHARED_TAG_ROWS} (expected 2, types ${SHARED_TAG_TYPES})"

if [[ "$LINK_COUNT" != "2" || "$TAG_ASSIGN_COUNT" != "2" || "$OLD_LINK_COUNT" != "0" || "$SHARED_TAG_ROWS" != "2" ]]; then
  fail "live CRUD DB assertions failed"
fi

DELETE_STATUS=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" -X DELETE "$API_BASE_URL/api/projects/${PROJECT_ID}")
echo "DELETE /api/projects/${PROJECT_ID} status: ${DELETE_STATUS}"
if [[ "$DELETE_STATUS" != "204" ]]; then
  echo "Response body:" >&2; cat "$TMP_RESP" >&2 || true
  fail "delete project expected 204, got $DELETE_STATUS"
fi

GET_STATUS=$(curl -sS -o "$TMP_RESP" -w "%{http_code}" "$API_BASE_URL/api/projects/${PROJECT_ID}")
echo "GET /api/projects/${PROJECT_ID} after delete status: ${GET_STATUS} (expected 404)"
if [[ "$GET_STATUS" != "404" ]]; then
  echo "Response body:" >&2; cat "$TMP_RESP" >&2 || true
  fail "get deleted project expected 404, got $GET_STATUS"
fi

# Cleanup blog post created for tag-separation proof (best-effort)
curl -sS -o /dev/null -X DELETE "$API_BASE_URL/api/blog/posts/${BLOG_ID}" || true

echo "==> verify-e2e.sh completed successfully"
