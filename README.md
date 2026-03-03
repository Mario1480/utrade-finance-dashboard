# uTrade Finance Dashboard

Interne Finanzplattform als Ersatz fuer das Google Sheet.

## Features (MVP)

- Admin-Login mit Rollen: `SUPERADMIN`, `TEAM_USER`
- Erfassung und Freigabe-Workflow fuer:
  - Einnahmen
  - Ausgaben
  - NFT-Verkaufswerte
  - Burning-Eintraege
- Verwaltung von:
  - Teammitgliedern
  - Regeln (Allocation, NFT-Multipliers, Sale-Split)
  - Projektadressen
  - User-Accounts (Superadmin)
- Dashboard:
  - Monats-KPIs
  - Trendauswertung
  - NFT-Profitberechnung je Tier
  - Team-Auszahlungen
- Oeffentliches Community Dashboard:
  - `/dashboard` (ohne Login)
  - nur freigegebene/geschlossene Monate
  - NFT Pool + Tier-Aufteilung + Burning Tabellen/KPIs
- Public-ready API:
  - `/api/public/summary`
  - `/api/public/nft-profit-trend`
  - `/api/public/community-dashboard`

## Tech Stack

- Next.js (App Router)
- PostgreSQL
- Prisma ORM
- JWT Cookie Auth
- Zod Validation
- Vitest

## Schnellstart (Lokal)

1. `.env` anlegen:

```bash
cp .env.example .env
```

2. Abhaengigkeiten installieren:

```bash
npm install
```

3. Datenbank starten (lokal z.B. via Docker):

```bash
docker compose up -d postgres
```

4. Prisma Migration/Schema push:

```bash
npm run prisma:push
```

5. Seed (Superadmin + Default-Regeln):

```bash
npm run seed
```

6. Optional: Google Sheet Import:

```bash
npm run import:sheet
```

7. Stabilen lokalen Modus starten (empfohlen):

```bash
npm run local
```

Das baut die App und startet sie fest auf `http://localhost:3001`.

8. Alternativ Dev Server starten:

```bash
npm run dev
```

Login dann unter:

- Stabil: `http://localhost:3001/admin/login`
- Dev: `http://localhost:3000/admin/login` (oder naechster freier Port)

## Default Superadmin

Wird aus `.env` gelesen:

- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

## API Uebersicht

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`

### User Admin

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`

### Finance

- `GET/POST/PATCH /api/finance/income`
- `DELETE /api/finance/income/:id`
- `PATCH /api/finance/income/:id/status`
- `GET/POST/PATCH /api/finance/expenses`
- `DELETE /api/finance/expenses/:id`
- `PATCH /api/finance/expenses/:id/status`

### NFT / Burning / Addresses

- `GET/POST/PATCH /api/nft/sales`
- `GET/POST/PATCH /api/burning`
- `GET/POST /api/addresses`
- `PATCH /api/addresses/:id`
- `DELETE /api/addresses/:id`

### Rules

- `GET/POST /api/rules/allocation`
- `GET/POST /api/rules/nft-tier`
- `GET/POST /api/rules/team-members`
- `PATCH /api/rules/team-members/:id`
- `GET/POST /api/rules/sale-split`

### Dashboard

- `GET /api/dashboard/monthly?month=YYYY-MM`
- `GET /api/dashboard/trends?from=YYYY-MM&to=YYYY-MM`
- `GET /api/dashboard/month-options`

### Community Month Status (Admin)

- `GET /api/community/month-status`
- `PATCH /api/community/month-status/:month` mit `{ \"action\": \"close\" | \"open\" }`

### Public-ready

- `GET /api/public/summary`
- `GET /api/public/nft-profit-trend`
- `GET /api/public/community-dashboard`

## Docker (Standalone)

Wenn du lokal/isoliert den bisherigen Gesamtstack fahren willst:

```bash
docker compose up -d --build
```

Dieser Modus enthaelt auch den internen Caddy-Proxy und ist nicht fuer einen Shared-VPS mit bestehendem Host-Nginx gedacht.

## Shared VPS Deployment (Host Nginx + Certbot)

Zielumgebung: gleicher VPS wie `bot-catalog` und `Discord-Gating-Bot`, mit zentralem Host-Nginx und TLS via Certbot.

### Voraussetzungen

- DNS `finance.utrade.vip` zeigt auf den VPS.
- Docker + Docker Compose sind installiert.
- Host-Nginx und Certbot sind installiert und aktiv.
- Ports `80/443` werden auf dem Host durch Nginx bedient.

### Erstinstallation

```bash
chmod +x deploy/install-vps.sh
./deploy/install-vps.sh \
  --domain finance.utrade.vip \
  --email admin@utrade.vip
```

Optionaler Datenimport (Google Sheet + Community Backfill):

```bash
./deploy/install-vps.sh \
  --domain finance.utrade.vip \
  --email admin@utrade.vip \
  --with-import
```

Wichtige Defaults:

- Projektpfad: `/opt/utrade-finance-dashboard`
- Branch: `main`
- App-Port: `127.0.0.1:3100 -> container:3000`
- Compose-Projektname: `utrade_finance`

### Updates

```bash
chmod +x deploy/update-vps.sh
./deploy/update-vps.sh
```

Nuetzliche Optionen:

- `--skip-pull`
- `--skip-build`
- `--skip-migrate`
- `--skip-seed`
- `--skip-backup`
- `--allow-dirty`
- `--with-import`

### Rollback / Backup

Das Update-Skript erstellt standardmaessig vor dem Deploy ein DB-Backup:

- `./backups/utrade_finance_YYYYmmdd_HHMMSS.sql.gz`

Manueller Restore bleibt verfuegbar:

```bash
./deploy/restore.sh ./backups/<file>.sql.gz
```

### Konfliktvermeidung auf Shared VPS

- Kein Finance-Caddy im VPS-Compose (`docker-compose.vps.yml`).
- Keine Finance-Bindings auf `80/443`.
- Finance-Postgres ist nur intern erreichbar (kein Host-Port).
- Eigener App-Port `3100`, damit keine Kollision mit anderen Projekten.

## Tests

```bash
npm test
```

Enthalten:

- Unit Test fuer Berechnungslogik
- Integrationsnahe Tests fuer Validierung und Regelkonsistenz

## Hinweise

- Basiswaehrung ist USD/USDT.
- Nur `APPROVED` Eintraege zaehlen fuer Dashboard-Berechnungen.
- Team-User sehen/veraendern eigene Datensaetze, Superadmin moderiert global.
