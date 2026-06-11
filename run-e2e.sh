#!/bin/bash
set -e

# Change to script directory's parent (project root)
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

# Detect container runtime and compose tool
if command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo "Error: docker is installed but neither 'docker compose' nor 'docker-compose' found."
        exit 1
    fi
elif command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
    if command -v podman-compose &> /dev/null; then
        COMPOSE_CMD="podman-compose"
    else
        echo "Error: podman is installed but 'podman-compose' not found."
        exit 1
    fi
else
    echo "Error: Neither docker nor podman is installed."
    exit 1
fi

echo "Using container runtime: $CONTAINER_CMD"
echo "Using compose tool: $COMPOSE_CMD"

echo "=== Starting E2E Services (Postgres + GeoIP + API + MinIO) ==="
$COMPOSE_CMD -f docker-compose.e2e.yml up --build -d

echo "=== Waiting for API to be ready ==="
echo "Polling API on host port 5809..."
API_READY=false
for i in $(seq 1 40); do
  # Use -s only (no -f) so curl exits 0 on any HTTP response, not just 2xx.
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5809/api/resume/active 2>/dev/null || true)
  if [ "$HTTP_CODE" != "000" ] && [ -n "$HTTP_CODE" ]; then
    echo "API is ready after $i attempts (HTTP $HTTP_CODE)."
    API_READY=true
    break
  fi
  echo "  attempt $i: not reachable yet (got $HTTP_CODE), waiting 5s..."
  sleep 5
done

if [ "$API_READY" = false ]; then
  echo "API did not become ready in time. Dumping logs:"
  $COMPOSE_CMD -f docker-compose.e2e.yml logs api
  echo "=== Tearing Down E2E Services ==="
  $COMPOSE_CMD -f docker-compose.e2e.yml down --volumes
  exit 1
fi

echo "=== Seeding Database for E2E Tests ==="
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5809 node apps/web/e2e/seed.js

echo "=== Running Playwright Tests ==="
export NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5809
export NEXT_PUBLIC_GEOIP_SERVICE_URL=http://127.0.0.1:8081/json/

cd apps/web

if pnpm run test:e2e; then
  echo "=== Playwright Tests Passed ==="
  TEST_RESULT=0
else
  echo "=== Playwright Tests Failed ==="
  TEST_RESULT=1
fi

cd "$PROJECT_ROOT"

if [ $TEST_RESULT -ne 0 ]; then
  echo "=== Saving API Logs on Failure ==="
  $COMPOSE_CMD -f docker-compose.e2e.yml logs api > e2e-api-logs.txt
  echo "API logs dumped to $(pwd)/e2e-api-logs.txt"
fi

echo "=== Tearing Down E2E Services ==="
$COMPOSE_CMD -f docker-compose.e2e.yml down --volumes

echo "=== Generating Run Summary ==="
# Generate and display the summary, but don't fail the script if it errors out
node .github/scripts/generate-summary.js || echo "Warning: Failed to generate summary."

exit $TEST_RESULT
