#!/usr/bin/env bash
set -Eeuo pipefail

BRANCH="main"
PROJECT_DIR="/opt/utrade-finance-dashboard"
COMPOSE_PROJECT_NAME="utrade_finance"
SKIP_PULL=0
SKIP_BUILD=0
SKIP_MIGRATE=0
SKIP_SEED=0
SKIP_BACKUP=0
ALLOW_DIRTY=0
WITH_IMPORT=0
LAST_BACKUP_FILE=""

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log() {
  printf '[update-vps] %s\n' "$*"
}

die() {
  printf '[update-vps] ERROR: %s\n' "$*" >&2
  exit 1
}

on_error() {
  local line="$1"
  printf '[update-vps] ERROR: command failed around line %s\n' "$line" >&2
  if [[ -n "$LAST_BACKUP_FILE" ]]; then
    printf '[update-vps] Last backup file: %s\n' "$LAST_BACKUP_FILE" >&2
  fi
}

usage() {
  cat <<'USAGE'
Usage: deploy/update-vps.sh [options]

Options:
  --branch <branch>       Git branch to deploy (default: main)
  --project-dir <path>    Repo directory (default: /opt/utrade-finance-dashboard)
  --skip-pull             Skip git fetch/pull
  --skip-build            Skip docker image build
  --skip-migrate          Skip prisma migrate deploy
  --skip-seed             Skip npm run seed
  --skip-backup           Skip postgres backup
  --allow-dirty           Allow running with local git changes
  --with-import           Run import:sheet and backfill:community-months
  -h, --help              Show this help
USAGE
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
}

get_env_value() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | head -n1 | cut -d= -f2-
}

check_url() {
  local url="$1"
  local label="$2"
  local attempts=20
  local i

  for ((i=1; i<=attempts; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "Check ok: ${label}"
      return 0
    fi
    sleep 2
  done

  die "Check failed: ${label} (${url})"
}

wait_for_postgres() {
  local compose_cmd=("$@")
  local db_user="$POSTGRES_USER"
  local db_name="$POSTGRES_DB"
  local attempts=40
  local i

  for ((i=1; i<=attempts; i++)); do
    if "${compose_cmd[@]}" exec -T postgres pg_isready -U "$db_user" -d "$db_name" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --project-dir)
      PROJECT_DIR="${2:-}"
      shift 2
      ;;
    --skip-pull)
      SKIP_PULL=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --skip-migrate)
      SKIP_MIGRATE=1
      shift
      ;;
    --skip-seed)
      SKIP_SEED=1
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    --with-import)
      WITH_IMPORT=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

trap 'on_error "$LINENO"' ERR

require_cmd git
require_cmd docker
require_cmd gzip
require_cmd curl

if [[ -n "$SUDO" ]]; then
  require_cmd sudo
fi

if ! docker compose version >/dev/null 2>&1; then
  die "docker compose plugin is required"
fi

[[ -d "$PROJECT_DIR/.git" ]] || die "No git repository found in ${PROJECT_DIR}"
[[ -f "$PROJECT_DIR/.env.vps" ]] || die "Missing ${PROJECT_DIR}/.env.vps"
[[ -f "$PROJECT_DIR/docker-compose.vps.yml" ]] || die "Missing ${PROJECT_DIR}/docker-compose.vps.yml"

cd "$PROJECT_DIR"

if [[ "$ALLOW_DIRTY" -ne 1 ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "Repository has local changes. Commit/stash or use --allow-dirty"
  fi
fi

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
else
  DOCKER=(${SUDO} docker)
fi

ENV_FILE="$PROJECT_DIR/.env.vps"
APP_PORT="$(get_env_value "$ENV_FILE" "APP_PORT")"
POSTGRES_USER="$(get_env_value "$ENV_FILE" "POSTGRES_USER")"
POSTGRES_DB="$(get_env_value "$ENV_FILE" "POSTGRES_DB")"

[[ -n "$APP_PORT" ]] || APP_PORT="3100"
[[ -n "$POSTGRES_USER" ]] || die "POSTGRES_USER missing in .env.vps"
[[ -n "$POSTGRES_DB" ]] || die "POSTGRES_DB missing in .env.vps"

COMPOSE=("${DOCKER[@]}" compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" -f "$PROJECT_DIR/docker-compose.vps.yml")

if [[ "$SKIP_BACKUP" -ne 1 ]]; then
  mkdir -p "$PROJECT_DIR/backups"
  TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
  LAST_BACKUP_FILE="$PROJECT_DIR/backups/utrade_finance_${TIMESTAMP}.sql.gz"

  log "Creating postgres backup: ${LAST_BACKUP_FILE}"
  "${COMPOSE[@]}" exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$LAST_BACKUP_FILE"
fi

if [[ "$SKIP_PULL" -ne 1 ]]; then
  log "Fetching latest git state"
  git fetch --all --prune

  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    log "Switching branch ${CURRENT_BRANCH} -> ${BRANCH}"
    git checkout "$BRANCH"
  fi

  log "Pulling origin/${BRANCH}"
  git pull --ff-only origin "$BRANCH"
fi

log "Starting containers"
if [[ "$SKIP_BUILD" -eq 1 ]]; then
  "${COMPOSE[@]}" up -d
else
  "${COMPOSE[@]}" up -d --build
fi

log "Waiting for postgres readiness"
wait_for_postgres "${COMPOSE[@]}" || die "Postgres did not become ready in time"

if [[ "$SKIP_MIGRATE" -ne 1 ]]; then
  log "Applying prisma migrate deploy"
  "${COMPOSE[@]}" exec -T app npx prisma migrate deploy
fi

if [[ "$SKIP_SEED" -ne 1 ]]; then
  log "Running seed"
  "${COMPOSE[@]}" exec -T app npm run seed
fi

if [[ "$WITH_IMPORT" -eq 1 ]]; then
  log "Running import and backfill"
  "${COMPOSE[@]}" exec -T app npm run import:sheet
  "${COMPOSE[@]}" exec -T app npm run backfill:community-months
fi

check_url "http://127.0.0.1:${APP_PORT}" "Local app endpoint"
check_url "http://127.0.0.1:${APP_PORT}/dashboard" "Local public dashboard"

log "Container status"
"${COMPOSE[@]}" ps

log "Update completed successfully"
if [[ -n "$LAST_BACKUP_FILE" ]]; then
  printf 'Backup: %s\n' "$LAST_BACKUP_FILE"
fi
