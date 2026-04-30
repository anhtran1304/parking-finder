#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [[ -f "${PROJECT_ROOT}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env"
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-${POSTGRES_PORT:-5432}}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-}}"
DB_USER="${DB_USER:-${POSTGRES_USER:-}}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}"

if [[ -z "${DB_NAME}" || -z "${DB_USER}" || -z "${DB_PASSWORD}" ]]; then
  echo "Missing DB credentials. Set POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD in .env or shell."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" <<'SQL'
INSERT INTO parking (name, location, total_slots, available_slots, updated_at)
VALUES
  ('District 1 Hub', ST_SetSRID(ST_MakePoint(106.70098, 10.77689), 4326), 120, 48, NOW()),
  ('Riverside Lot', ST_SetSRID(ST_MakePoint(106.70990, 10.77210), 4326), 90, 12, NOW()),
  ('Opera Corner', ST_SetSRID(ST_MakePoint(106.70340, 10.77920), 4326), 60, 5, NOW())
ON CONFLICT DO NOTHING;
SQL

echo "Seeded sample parking data."
