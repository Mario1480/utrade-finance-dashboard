#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="finance.utrade.vip"
EMAIL=""
BRANCH="main"
REPO_URL="https://github.com/Mario1480/utrade-finance-dashboard.git"
PROJECT_DIR="/opt/utrade-finance-dashboard"
APP_PORT="3100"
COMPOSE_PROJECT_NAME="utrade_finance"
SKIP_CERTBOT=0
WITH_IMPORT=0

TARGET_USER="${SUDO_USER:-$USER}"
if [[ "$(id -u)" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log() {
  printf '[install-vps] %s\n' "$*"
}

die() {
  printf '[install-vps] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: deploy/install-vps.sh [options]

Options:
  --domain <domain>          Domain for finance app (default: finance.utrade.vip)
  --email <email>            Email for certbot (required when cert is missing)
  --branch <branch>          Git branch to deploy (default: main)
  --repo <repo-url>          Git repository URL
  --project-dir <path>       Target directory (default: /opt/utrade-finance-dashboard)
  --app-port <port>          Host loopback app port (default: 3100)
  --skip-certbot             Skip certbot issuance even if certificate is missing
  --with-import              Run import:sheet and backfill:community-months
  -h, --help                 Show this help
USAGE
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
}

run_as_target_user() {
  if [[ "$(id -u)" -eq 0 && "$TARGET_USER" != "root" ]]; then
    sudo -u "$TARGET_USER" -H "$@"
  else
    "$@"
  fi
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp

  tmp="$(mktemp)"
  awk -v key="$key" -v value="$value" -F= '
    BEGIN { updated = 0 }
    $1 == key { print key "=" value; updated = 1; next }
    { print $0 }
    END { if (!updated) print key "=" value }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
}

get_env_value() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | head -n1 | cut -d= -f2-
}

require_env_value() {
  local file="$1"
  local key="$2"
  local value

  value="$(get_env_value "$file" "$key")"
  if [[ -z "$value" ]]; then
    die "Missing required .env.vps value: $key"
  fi

  if [[ "$value" == *"replace-with"* || "$value" == *"<"* || "$value" == *"change-me"* ]]; then
    die "Placeholder detected in .env.vps for $key"
  fi
}

check_port_free() {
  local port="$1"
  if ss -ltn "sport = :${port}" | grep -q LISTEN; then
    die "Port ${port} is already in use. Choose a different --app-port."
  fi
}

check_nginx_port_owner() {
  local port="$1"
  local output

  output="$(${SUDO} ss -ltnp "sport = :${port}" 2>/dev/null || true)"

  if ! printf '%s\n' "$output" | grep -q LISTEN; then
    die "No listener found on port ${port}. Expected host nginx to be active."
  fi

  if ! printf '%s\n' "$output" | grep -qi nginx; then
    die "Port ${port} is not served by nginx. Resolve the conflict before install."
  fi

  log "Port ${port} is served by nginx"
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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --email)
      EMAIL="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --repo)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --project-dir)
      PROJECT_DIR="${2:-}"
      shift 2
      ;;
    --app-port)
      APP_PORT="${2:-}"
      shift 2
      ;;
    --skip-certbot)
      SKIP_CERTBOT=1
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

[[ -n "$DOMAIN" ]] || die "--domain must not be empty"
[[ -n "$BRANCH" ]] || die "--branch must not be empty"
[[ -n "$PROJECT_DIR" ]] || die "--project-dir must not be empty"
[[ "$APP_PORT" =~ ^[0-9]+$ ]] || die "--app-port must be numeric"

require_cmd git
require_cmd docker
require_cmd ss
require_cmd getent
require_cmd curl
require_cmd nginx
require_cmd certbot

if [[ -n "$SUDO" ]]; then
  require_cmd sudo
fi

if ! docker compose version >/dev/null 2>&1; then
  die "docker compose plugin is required"
fi

if docker info >/dev/null 2>&1; then
  DOCKER=(docker)
else
  DOCKER=(${SUDO} docker)
fi

log "Preflight: DNS check for ${DOMAIN}"
if ! getent hosts "$DOMAIN" >/dev/null 2>&1; then
  die "Domain does not resolve: ${DOMAIN}"
fi

log "Preflight: app port ${APP_PORT} must be free"
check_port_free "$APP_PORT"

log "Preflight: 80/443 must be handled by host nginx"
check_nginx_port_owner 80
check_nginx_port_owner 443

log "Info: existing potentially related containers"
"${DOCKER[@]}" ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}' | grep -Ei 'catalog|discord|gating|caddy|nginx|finance' || true

if [[ -d "$PROJECT_DIR/.git" ]]; then
  log "Updating existing repository in ${PROJECT_DIR}"
  run_as_target_user git -C "$PROJECT_DIR" fetch --all --prune
  run_as_target_user git -C "$PROJECT_DIR" checkout "$BRANCH"
  run_as_target_user git -C "$PROJECT_DIR" pull --ff-only origin "$BRANCH"
elif [[ -d "$PROJECT_DIR" && -n "$(ls -A "$PROJECT_DIR" 2>/dev/null || true)" ]]; then
  die "Project dir exists and is not an empty git repo: ${PROJECT_DIR}"
else
  log "Cloning repository into ${PROJECT_DIR}"
  ${SUDO} mkdir -p "$(dirname "$PROJECT_DIR")"
  ${SUDO} chown "$TARGET_USER:$TARGET_USER" "$(dirname "$PROJECT_DIR")" || true
  run_as_target_user git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"
[[ -f docker-compose.vps.yml ]] || die "docker-compose.vps.yml not found in ${PROJECT_DIR}"
[[ -f .env.vps.example ]] || die ".env.vps.example not found in ${PROJECT_DIR}"

ENV_FILE="$PROJECT_DIR/.env.vps"
if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating .env.vps from template"
  run_as_target_user cp "$PROJECT_DIR/.env.vps.example" "$ENV_FILE"
fi

set_env_value "$ENV_FILE" "APP_PORT" "$APP_PORT"
set_env_value "$ENV_FILE" "NODE_ENV" "production"

POSTGRES_DB="$(get_env_value "$ENV_FILE" "POSTGRES_DB")"
POSTGRES_USER="$(get_env_value "$ENV_FILE" "POSTGRES_USER")"
POSTGRES_PASSWORD="$(get_env_value "$ENV_FILE" "POSTGRES_PASSWORD")"

[[ -n "$POSTGRES_DB" ]] || die "POSTGRES_DB must be set in .env.vps"
[[ -n "$POSTGRES_USER" ]] || die "POSTGRES_USER must be set in .env.vps"
[[ -n "$POSTGRES_PASSWORD" ]] || die "POSTGRES_PASSWORD must be set in .env.vps"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
set_env_value "$ENV_FILE" "DATABASE_URL" "$DATABASE_URL"

for key in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL JWT_SECRET SUPERADMIN_EMAIL SUPERADMIN_PASSWORD NEXT_PUBLIC_APP_NAME; do
  require_env_value "$ENV_FILE" "$key"
done

JWT_SECRET_VALUE="$(get_env_value "$ENV_FILE" "JWT_SECRET")"
if [[ ${#JWT_SECRET_VALUE} -lt 32 ]]; then
  die "JWT_SECRET must have at least 32 characters"
fi

if ! run_as_target_user grep -q '^SUPERADMIN_EMAIL=.*@' "$ENV_FILE"; then
  die "SUPERADMIN_EMAIL must look like an email address"
fi

COMPOSE=("${DOCKER[@]}" compose --project-name "$COMPOSE_PROJECT_NAME" --env-file "$ENV_FILE" -f "$PROJECT_DIR/docker-compose.vps.yml")

log "Starting finance stack"
"${COMPOSE[@]}" up -d --build

log "Waiting for postgres readiness"
if ! wait_for_postgres "${COMPOSE[@]}"; then
  die "Postgres did not become ready in time"
fi

log "Applying Prisma migrations"
"${COMPOSE[@]}" exec -T app npx prisma migrate deploy

log "Running seed"
"${COMPOSE[@]}" exec -T app npm run seed

if [[ "$WITH_IMPORT" -eq 1 ]]; then
  log "Running Google Sheet import and month-status backfill"
  "${COMPOSE[@]}" exec -T app npm run import:sheet
  "${COMPOSE[@]}" exec -T app npm run backfill:community-months
fi

TEMPLATE_FILE="$PROJECT_DIR/deploy/nginx/finance.utrade.vip.conf.template"
SITE_AVAILABLE="/etc/nginx/sites-available/${DOMAIN}.conf"
SITE_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}.conf"

[[ -f "$TEMPLATE_FILE" ]] || die "Nginx template missing: ${TEMPLATE_FILE}"

log "Rendering nginx config for ${DOMAIN}"
TMP_FILE="$(mktemp)"
sed -e "s/__DOMAIN__/${DOMAIN}/g" -e "s/__APP_PORT__/${APP_PORT}/g" "$TEMPLATE_FILE" > "$TMP_FILE"

${SUDO} mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
${SUDO} cp "$TMP_FILE" "$SITE_AVAILABLE"
${SUDO} ln -sfn "$SITE_AVAILABLE" "$SITE_ENABLED"
rm -f "$TMP_FILE"

log "Validating and reloading nginx"
${SUDO} nginx -t
if command -v systemctl >/dev/null 2>&1; then
  ${SUDO} systemctl reload nginx
else
  ${SUDO} service nginx reload
fi

CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if [[ -f "$CERT_PATH" ]]; then
  log "Certificate already exists for ${DOMAIN}"
elif [[ "$SKIP_CERTBOT" -eq 1 ]]; then
  log "Skipping certbot step (--skip-certbot)"
else
  [[ -n "$EMAIL" ]] || die "--email is required for first certificate issuance"
  log "Issuing certificate with certbot"
  ${SUDO} certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive --redirect
fi

check_url "http://127.0.0.1:${APP_PORT}" "Local app endpoint"
check_url "https://${DOMAIN}/dashboard" "Public dashboard over HTTPS"

log "Container status"
"${COMPOSE[@]}" ps

log "Install completed"
printf 'Domain: https://%s\n' "$DOMAIN"
printf 'Admin:  https://%s/admin/login\n' "$DOMAIN"
printf 'Public: https://%s/dashboard\n' "$DOMAIN"
