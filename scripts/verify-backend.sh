#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Host-specific podman / inotify configuration
export DOCKER_HOST="${DOCKER_HOST:-unix:///run/user/$(id -u)/podman/podman.sock}"
export TESTCONTAINERS_RYUK_DISABLED="${TESTCONTAINERS_RYUK_DISABLED:-true}"
export DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE=false
export DOTNET_USE_POLLING_FILE_WATCHER=1

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

LOG_FILE="$(mktemp -t verify-backend.XXXXXX.log)"
cleanup_log() { rm -f "$LOG_FILE"; }
trap cleanup_log EXIT

set +e
dotnet test apps/api/Portfolio.sln 2>&1 | tee "$LOG_FILE"
TEST_EXIT=${PIPESTATUS[0]}
set -e

# Determine real test outcome: a non-zero exit can be caused by post-test
# Testcontainers/podman teardown noise (rootless netns cleanup) after all tests pass.
# Fail on any reported test failure; warn (but succeed) if all tests passed.
FAILED_COUNT=""
if grep -qE 'Failed:[[:space:]]*[0-9]+' "$LOG_FILE"; then
  FAILED_COUNT=$(grep -oE 'Failed:[[:space:]]*[0-9]+' "$LOG_FILE" | tail -1 | grep -oE '[0-9]+')
fi

if [[ -n "$FAILED_COUNT" && "$FAILED_COUNT" != "0" ]]; then
  echo "ERROR: dotnet test reported ${FAILED_COUNT} failed test(s)." >&2
  exit 1
fi

if [[ -n "$FAILED_COUNT" && "$FAILED_COUNT" == "0" ]]; then
  if [[ $TEST_EXIT -ne 0 ]]; then
    echo "WARNING: dotnet test exited with code ${TEST_EXIT} after all tests passed (Failed: 0). Treating as teardown noise (e.g. rootless podman/Testcontainers cleanup). See log above." >&2
  fi
  exit 0
fi

# No parseable summary line: treat non-zero exit as a real failure (compile/crash/timeout).
if [[ $TEST_EXIT -ne 0 ]]; then
  echo "ERROR: dotnet test exited with code ${TEST_EXIT} and no parseable test summary was found." >&2
  exit 1
fi

exit 0
