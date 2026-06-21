# Self-Hosting Guide — SME Dashboard

This guide covers running the SME Dashboard on a local Windows machine and making it accessible to other devices on the same LAN. It uses Docker Compose to run the Next.js application and a SQL Server 2022 database, with an optional Caddy reverse proxy for HTTPS.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Configure a Static IP](#3-configure-a-static-ip)
4. [Clone the Repository](#4-clone-the-repository)
5. [Generate Secrets](#5-generate-secrets)
6. [Configure `.env.local`](#6-configure-envlocal)
7. [Run Database Migrations](#7-run-database-migrations)
8. [Build and Start the Stack](#8-build-and-start-the-stack)
9. [Seed the Database](#9-seed-the-database)
10. [Open Windows Firewall Ports](#10-open-windows-firewall-ports)
11. [Verify from Another Device](#11-verify-from-another-device)
12. [Enable HTTPS (Recommended)](#12-enable-https-recommended)
13. [Day-to-Day Operations](#13-day-to-day-operations)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Architecture Overview

```
Other devices on LAN
        │
        ▼ :443 (HTTPS) or :3000 (HTTP)
┌─────────────────────────────────────────┐
│            Host Windows PC              │
│  Static IP: 192.168.0.88               │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │         Docker Compose           │   │
│  │                                  │   │
│  │  ┌────────┐    ┌──────────────┐  │   │
│  │  │ Caddy  │───▶│  app :3000   │  │   │
│  │  │ :443   │    │  (Next.js)   │  │   │
│  │  └────────┘    └──────┬───────┘  │   │
│  │                       │          │   │
│  │               ┌───────▼───────┐  │   │
│  │               │  db :1433     │  │   │
│  │               │ (SQL Server)  │  │   │
│  │               └───────────────┘  │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- **app** — Next.js 16 (standalone output), runs on port 3000 inside Docker
- **db** — SQL Server 2022 Developer Edition, data persisted in a named Docker volume
- **caddy** — Caddy v2 reverse proxy, terminates TLS and forwards to the app _(optional but recommended)_

---

## 2. Prerequisites

Install the following on the host machine before starting.

| Tool | Purpose | Download |
|---|---|---|
| Docker Desktop | Runs all containers | https://docs.docker.com/desktop/install/windows-install/ |
| Node.js 20 LTS | Runs Prisma migrations locally | https://nodejs.org |
| Git | Cloning the repository | https://git-scm.com |
| mkcert _(optional)_ | Generates locally-trusted TLS certs for HTTPS | `choco install mkcert` or https://github.com/FiloSottile/mkcert |

After installing Docker Desktop, make sure it is running before continuing. Verify with:

```powershell
docker version
docker compose version
```

---

## 3. Configure a Static IP

The host machine needs a fixed IP so other devices can always reach it at the same address. You can skip this if your router assigns a static DHCP lease to the host, but setting it on the OS level is more reliable.

**Control Panel → Network and Internet → Network Connections → right-click your adapter → Properties → Internet Protocol Version 4 (TCP/IPv4) → Properties**

Fill in:

| Field | Value |
|---|---|
| IP address | `192.168.0.88` _(or another unused address in your subnet)_ |
| Subnet mask | `255.255.255.0` |
| Default gateway | Your router's IP, e.g. `192.168.0.1` |
| Preferred DNS server | `8.8.8.8` |
| Alternate DNS server | `8.8.4.4` |

Click OK, then close. You do not need to restart the machine.

> **How to find your router's IP:** Open Command Prompt and run `ipconfig`. The **Default Gateway** value next to your active adapter is your router's IP.

---

## 4. Clone the Repository

```powershell
git clone https://github.com/intern-btn/sme-dashboard.git
cd sme-dashboard
git checkout feat/self-hosted-mssql
```

Install Node.js dependencies (needed to run Prisma migrations locally):

```powershell
npm install
```

---

## 5. Generate Secrets

Three secret values must be generated before you configure the environment. Run each command in PowerShell or any terminal with Node.js available.

**NEXTAUTH_SECRET** — a random 32-byte base64 string:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**TOTP_ENCRYPTION_KEY** — a random 32-byte hex string (64 hex characters):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**TOTP_UNLOCK_SECRET** — a random 32-byte base64url string:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copy each output value. You will use them in the next step.

---

## 6. Configure `.env.local`

Copy the example file and fill it in:

```powershell
copy .env.example .env.local
```

Open `.env.local` in a text editor and set all values:

```env
# ── Storage ──────────────────────────────────────────────────────────────────
# Keep local for self-hosting. BLOB_* values are only needed on Vercel.
STORAGE_PROVIDER=local
DATA_DIR=./data
BLOB_READ_WRITE_TOKEN=
BLOB_BASE_URL=
NEXT_PUBLIC_USE_DIRECT_UPLOAD=false

# ── Database ─────────────────────────────────────────────────────────────────
# The app container connects to the 'db' service by its Docker Compose service name.
# Replace YOUR_SA_PASSWORD with a strong password (min 8 chars, upper, lower, digit, symbol).
DATABASE_URL="sqlserver://db:1433;database=sme_dashboard;user=sa;password=YOUR_SA_PASSWORD;trustServerCertificate=true"

# SA password for the SQL Server container — must exactly match the password above.
SA_PASSWORD=YOUR_SA_PASSWORD

# ── Seeding ───────────────────────────────────────────────────────────────────
# Password set for the default admin account during first-time seeding.
ADMIN_PASSWORD=changeme

# ── NextAuth ─────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET=<paste NEXTAUTH_SECRET from step 5>

# Use your static IP. Change to https://192.168.0.88 if you set up HTTPS (step 12).
NEXTAUTH_URL=http://192.168.0.88:3000

# ── TOTP 2FA ──────────────────────────────────────────────────────────────────
TOTP_ENCRYPTION_KEY=<paste TOTP_ENCRYPTION_KEY from step 5>
TOTP_UNLOCK_SECRET=<paste TOTP_UNLOCK_SECRET from step 5>
```

> **Password policy:** SQL Server enforces Windows password complexity. Use at least 8 characters with uppercase, lowercase, a digit, and a symbol — e.g. `SuperPass99!`.

> **Important:** `.env.local` is in `.gitignore` and will never be committed. Do not share this file.

---

## 7. Run Database Migrations

Migrations must be applied against the running SQL Server container before the app starts. The flow is:

1. Start only the database container
2. Run migrations from the host against `localhost:1433`
3. Stop the database container (it will be restarted with the full stack in the next step)

**Start only the database:**

```powershell
docker compose up db -d
```

Wait about 30 seconds for SQL Server to finish initializing, then verify it is healthy:

```powershell
docker compose ps
```

The `db` service should show `healthy`.

**Apply migrations** — override `DATABASE_URL` to point at `localhost` instead of the Docker-internal `db` hostname:

```powershell
$env:DATABASE_URL = "sqlserver://localhost:1433;database=sme_dashboard;user=sa;password=YOUR_SA_PASSWORD;trustServerCertificate=true"
npx prisma migrate deploy
```

Replace `YOUR_SA_PASSWORD` with the same password you set in `.env.local`.

You should see output ending with:

```
All migrations have been successfully applied.
```

**Stop the database:**

```powershell
docker compose down
```

---

## 8. Build and Start the Stack

Build the Docker image and start all services:

```powershell
docker compose up --build -d
```

The first build takes a few minutes. Subsequent builds are faster. To watch logs while starting:

```powershell
docker compose logs -f
```

Wait until you see output from the `app` service such as:

```
app  | ▲ Next.js 16.x.x
app  | - Local:        http://localhost:3000
app  | ✓ Ready in Xs
```

Check that all services are running:

```powershell
docker compose ps
```

Expected output:

```
NAME                 STATUS              PORTS
sme-dashboard-db-1   running (healthy)   0.0.0.0:1433->1433/tcp
sme-dashboard-app-1  running             0.0.0.0:3000->3000/tcp
```

---

## 9. Seed the Database

Run this once after the first deployment to create the default admin user and initial data:

```powershell
docker compose exec app node --experimental-vm-modules prisma/seed.js
```

The seed creates an admin account. The username is `admin` and the password is whatever you set as `ADMIN_PASSWORD` in `.env.local`.

To also seed sample memo data:

```powershell
docker compose exec app node --experimental-vm-modules prisma/seed-memos.js
```

> **Only run seeds once.** Running them again will attempt to create duplicate records and will fail or produce duplicate data.

---

## 10. Open Windows Firewall Ports

Other devices on the LAN cannot reach the app until you add inbound firewall rules. Open PowerShell **as Administrator** and run:

```powershell
# Allow port 3000 (HTTP — required for basic access)
New-NetFirewallRule -DisplayName "SME Dashboard HTTP 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Allow port 443 (HTTPS — only needed if you set up Caddy in step 12)
New-NetFirewallRule -DisplayName "SME Dashboard HTTPS 443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

# Allow port 80 (HTTP redirect — only needed if you set up Caddy in step 12)
New-NetFirewallRule -DisplayName "SME Dashboard HTTP 80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
```

---

## 11. Verify from Another Device

Open a browser on any device connected to the same network and go to:

```
http://192.168.0.88:3000
```

You should see the login page. Log in with `admin` and the password you set in `ADMIN_PASSWORD`.

---

## 12. Enable HTTPS (Recommended)

Running over HTTP means the browser will not store `Secure`-flagged cookies, and some security features are degraded. For a prototype environment, HTTPS with a locally-trusted certificate is the right approach.

### 12.1 Install mkcert and generate a certificate

```powershell
# Install mkcert (requires Chocolatey: https://chocolatey.org)
choco install mkcert

# Install the local CA into the Windows trust store
mkcert -install

# Create the certs folder inside the project
mkdir certs

# Generate a certificate for your static IP
mkcert -cert-file certs\cert.pem -key-file certs\key.pem 192.168.0.88
```

### 12.2 Create a Caddyfile

Create a file named `Caddyfile` in the project root:

```
https://192.168.0.88 {
  tls /certs/cert.pem /certs/key.pem
  reverse_proxy app:3000
}
```

### 12.3 Update `.env.local`

Change `NEXTAUTH_URL` to use HTTPS without a port number:

```env
NEXTAUTH_URL=https://192.168.0.88
```

### 12.4 Update `docker-compose.yml`

The Caddy service is already defined in `docker-compose.yml`. No changes needed — just ensure the `certs/` folder exists with the generated certificate files.

### 12.5 Rebuild and restart

```powershell
docker compose up --build -d
```

The app is now accessible at `https://192.168.0.88`.

### 12.6 Trust the certificate on other devices

mkcert creates a root CA on the host machine. Other devices need to trust this CA before they will accept the certificate without warnings.

Find the root CA file:

```powershell
mkcert -CAROOT
```

This prints a folder path. Inside it you will find `rootCA.pem`. Copy this file to each device and install it:

| Device | How to install |
|---|---|
| Windows | Double-click `rootCA.pem` → Install Certificate → Local Machine → Trusted Root Certification Authorities |
| macOS | Double-click `rootCA.pem` → add to Keychain → set to Always Trust |
| Android | Settings → Security → Install certificate → CA certificate → select the file |
| iOS / iPadOS | AirDrop or email the file → tap to install → Settings → General → About → Certificate Trust Settings → enable the mkcert certificate |

---

## 13. Day-to-Day Operations

### Start the stack

```powershell
docker compose up -d
```

### Stop the stack

```powershell
docker compose down
```

### View live logs

```powershell
docker compose logs -f
```

### View logs for a specific service

```powershell
docker compose logs -f app
docker compose logs -f db
```

### Restart a single service

```powershell
docker compose restart app
```

### Pull new code and redeploy

```powershell
git pull
docker compose up --build -d
```

### Apply new migrations after a code update

```powershell
# Run migrations against localhost with the db container running
$env:DATABASE_URL = "sqlserver://localhost:1433;database=sme_dashboard;user=sa;password=YOUR_SA_PASSWORD;trustServerCertificate=true"
npx prisma migrate deploy

# Then rebuild and restart the app
docker compose up --build -d
```

### Backup the database

SQL Server data is stored in the Docker volume `sme-dashboard_mssql_data`. To create a SQL backup file:

```powershell
docker compose exec db /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "YOUR_SA_PASSWORD" -No `
  -Q "BACKUP DATABASE sme_dashboard TO DISK = '/var/opt/mssql/backup/sme_dashboard.bak' WITH FORMAT"
```

Then copy it out of the container:

```powershell
docker compose cp db:/var/opt/mssql/backup/sme_dashboard.bak ./sme_dashboard.bak
```

---

## 14. Troubleshooting

### The `db` service never becomes healthy

SQL Server takes 20–40 seconds to fully initialize on first run. Watch its logs:

```powershell
docker compose logs -f db
```

If you see `Password validation failed` or `too short`, your `SA_PASSWORD` in `.env.local` does not meet SQL Server's complexity requirements (minimum 8 characters, must include uppercase, lowercase, digit, and symbol).

### Cannot reach the app from another device

1. Confirm the host machine's IP is still `192.168.0.88`:
   ```powershell
   ipconfig
   ```
2. Confirm the firewall rules exist:
   ```powershell
   Get-NetFirewallRule -DisplayName "SME Dashboard*" | Select-Object DisplayName, Enabled
   ```
3. Confirm the containers are running:
   ```powershell
   docker compose ps
   ```
4. Confirm Docker Desktop is not in a paused or suspended state.

### TOTP codes are always rejected

TOTP codes are time-based and valid for 30 seconds. If the host machine's clock is drifted by more than 30 seconds, all codes will fail. Sync the clock:

```powershell
w32tm /resync /force
```

### Login works but TOTP enrollment or unlock fails

This happens when `NEXTAUTH_URL` uses `http://` but you are running in production mode, causing a cookie name mismatch. Make sure `NEXTAUTH_URL` starts with `https://` if Caddy is set up, or confirm the URL exactly matches how you access the app in the browser.

### Migration fails with `Can't reach database server at 'db:1433'`

The migration command must use `localhost:1433`, not `db:1433`. The hostname `db` only resolves inside the Docker network. Explicitly set `DATABASE_URL` with `localhost` before running migrations:

```powershell
$env:DATABASE_URL = "sqlserver://localhost:1433;database=sme_dashboard;user=sa;password=YOUR_SA_PASSWORD;trustServerCertificate=true"
npx prisma migrate deploy
```

### The `app` container exits immediately after starting

Check the logs:

```powershell
docker compose logs app
```

Common causes:
- `DATABASE_URL` is wrong or the `db` container is not healthy yet — the `depends_on: condition: service_healthy` check in `docker-compose.yml` should prevent this, but if `db` repeatedly fails its healthcheck, `app` will not start.
- A required environment variable is missing in `.env.local`.

### Port 3000 or 443 is already in use

Find what is using the port:

```powershell
netstat -ano | findstr :3000
```

Stop the conflicting process or change the host port in `docker-compose.yml` (e.g. `"3001:3000"`).

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQL Server connection string. For Docker runtime use `db` as host; for local migrations use `localhost`. |
| `SA_PASSWORD` | Yes | SQL Server SA account password. Must match the password in `DATABASE_URL`. Read by the `db` container on first start to set the SA password. |
| `ADMIN_PASSWORD` | Yes (seed) | Password for the default admin account created during seeding. Not used after the seed runs. |
| `NEXTAUTH_SECRET` | Yes | Random secret used to sign NextAuth JWT tokens. Changing this invalidates all existing sessions. |
| `NEXTAUTH_URL` | Yes | Full base URL of the app as seen by clients. Must use `https://` if Caddy is set up, `http://` otherwise. |
| `TOTP_ENCRYPTION_KEY` | Yes | 64-character hex string (32 bytes). Used to encrypt TOTP secrets at rest. Changing this invalidates all enrolled TOTP devices. |
| `TOTP_UNLOCK_SECRET` | Yes | Base64url string (32 bytes). Used to sign confidential data unlock tokens. Changing this revokes all active unlock sessions. |
| `STORAGE_PROVIDER` | Yes | `local` for self-hosted file storage, `vercel` for Vercel Blob. Always use `local` when self-hosting. |
| `DATA_DIR` | No | Directory for local file storage relative to the project root. Defaults to `./data`. |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token. Leave empty when `STORAGE_PROVIDER=local`. |
| `NEXT_PUBLIC_USE_DIRECT_UPLOAD` | No | Set to `false` for self-hosted. Only `true` on Vercel to bypass the 4.5 MB request body limit. |
