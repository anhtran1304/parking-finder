#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"

cd "${DOCKER_DIR}"
docker compose up -d db redis

echo "Waiting for Postgres to be healthy..."
docker compose ps

echo "Database and Redis are up."
