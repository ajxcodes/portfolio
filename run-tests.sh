#!/bin/bash
set -e

# Change to script directory's parent (project root)
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

RUN_BE=false
RUN_FE=false
RUN_BE_MUTATIONS=false
RUN_FE_MUTATIONS=false
RUN_E2E=false
SILENT=false

# Parse arguments
if [ "$#" -eq 0 ]; then
  RUN_BE=true
  RUN_FE=true
  RUN_E2E=true
fi

for arg in "$@"; do
  case $arg in
    --be) RUN_BE=true ;;
    --fe) RUN_FE=true ;;
    --be-mutations) RUN_BE_MUTATIONS=true ;;
    --fe-mutations) RUN_FE_MUTATIONS=true ;;
    --e2e) RUN_E2E=true ;;
    --all) RUN_BE=true; RUN_FE=true; RUN_E2E=true ;;
    --all-mutations) RUN_BE_MUTATIONS=true; RUN_FE_MUTATIONS=true ;;
    --silent|-s) SILENT=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [ "$RUN_BE" = false ] && [ "$RUN_FE" = false ] && [ "$RUN_E2E" = false ] && [ "$RUN_BE_MUTATIONS" = false ] && [ "$RUN_FE_MUTATIONS" = false ]; then
  RUN_BE=true
  RUN_FE=true
  RUN_E2E=true
fi

# Helper for silent output
run_cmd() {
  if [ "$SILENT" = true ]; then
    "$@" > /dev/null 2>&1
  else
    "$@"
  fi
}

TEST_RESULT=0

if [ "$RUN_BE" = true ]; then
  echo "=== Running Backend Tests ==="
  cd "$PROJECT_ROOT/apps/api/src/Portfolio.Tests"
  if run_cmd dotnet test --logger "trx;LogFileName=test-results.trx" /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura /p:CoverletOutput=coverage.cobertura.xml; then
    echo "=== Backend Tests Passed ==="
  else
    echo "=== Backend Tests Failed ==="
    TEST_RESULT=1
  fi
  cd "$PROJECT_ROOT"
fi

if [ "$RUN_BE_MUTATIONS" = true ]; then
  echo "=== Running Backend Mutation Tests ==="
  cd "$PROJECT_ROOT/apps/api/src/Portfolio.Tests"
  run_cmd dotnet tool restore
  run_cmd dotnet stryker || echo "Warning: Mutation tests failed or encountered an error."
  cd "$PROJECT_ROOT"
fi

if [ "$RUN_FE" = true ]; then
  echo "=== Running Frontend Tests ==="
  cd "$PROJECT_ROOT/apps/web"
  if run_cmd pnpm exec jest --coverage --json --outputFile=jest-results.json; then
    echo "=== Frontend Tests Passed ==="
  else
    echo "=== Frontend Tests Failed ==="
    TEST_RESULT=1
  fi
  cd "$PROJECT_ROOT"
fi

if [ "$RUN_FE_MUTATIONS" = true ]; then
  echo "=== Running Frontend Mutation Tests ==="
  cd "$PROJECT_ROOT/apps/web"
  run_cmd pnpm exec stryker run || echo "Warning: Frontend Mutation tests failed or encountered an error."
  cd "$PROJECT_ROOT"
fi

if [ "$RUN_E2E" = true ]; then
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
  run_cmd $COMPOSE_CMD -f docker-compose.e2e.yml up --build -d

  echo "=== Waiting for API to be ready ==="
  echo "Polling API on host port 5809..."
  API_READY=false
  for i in $(seq 1 40); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5809/api/resume/active 2>/dev/null || true)
    if [ "$HTTP_CODE" != "000" ] && [ -n "$HTTP_CODE" ]; then
      echo "API is ready after $i attempts (HTTP $HTTP_CODE)."
      API_READY=true
      break
    fi
    [ "$SILENT" = false ] && echo "  attempt $i: not reachable yet (got $HTTP_CODE), waiting 5s..."
    sleep 5
  done

  if [ "$API_READY" = false ]; then
    echo "API did not become ready in time. Dumping logs:"
    $COMPOSE_CMD -f docker-compose.e2e.yml logs api
    echo "=== Tearing Down E2E Services ==="
    run_cmd $COMPOSE_CMD -f docker-compose.e2e.yml down --volumes
    exit 1
  fi

  echo "=== Seeding Database for E2E Tests ==="
  NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5809 run_cmd node apps/web/e2e/seed.js

  echo "=== Running Playwright Tests ==="
  export NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5809
  export NEXT_PUBLIC_GEOIP_SERVICE_URL=http://127.0.0.1:8081/json/

  cd apps/web

  if run_cmd pnpm run test:e2e; then
    echo "=== Playwright Tests Passed ==="
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
  run_cmd $COMPOSE_CMD -f docker-compose.e2e.yml down --volumes
fi

echo "=== Generating Run Summary ==="
# Generate and display the summary, but don't fail the script if it errors out
node .github/scripts/generate-summary.js || echo "Warning: Failed to generate summary."

exit $TEST_RESULT
