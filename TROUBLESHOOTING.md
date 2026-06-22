# Self-Hosting Troubleshooting Findings

This document records all findings, issues, and decisions made during the self-hosting setup of the SME Dashboard on a local Windows machine.

---

## 1. Database Migration Issues

### Problem: Authentication failed (P1000)
Running `npx prisma migrate deploy` failed with:
```
Error: P1000: Authentication failed against database server
```

**Root cause:** `.env.local` had `DB_SA_PASSWORD` but SQL Server Docker container requires the variable to be named `SA_PASSWORD`. The container started without setting the SA password, causing authentication to fail.

**Fix:** Added `SA_PASSWORD=Superadmin123!` to `.env.local` alongside the existing `DB_SA_PASSWORD`.

---

### Problem: Migration failed with object already exists (P3018)
```
Error: P3018 — There is already an object named 'User' in the database.
Database error code: 2714
```

**Root cause:** A previous migration attempt partially ran (created the `User` table) before failing on auth. Prisma marked the migration as failed and refused to retry.

**Fix:** Drop and recreate the database directly via the container:
```powershell
docker exec sme-dashboard-db-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Superadmin123!" -Q "DROP DATABASE sme_dashboard" -No
docker exec sme-dashboard-db-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Superadmin123!" -Q "CREATE DATABASE sme_dashboard" -No
```

---

### Problem: Prisma client not generated
```
Error: Cannot find module 'src/generated/prisma/client.ts'
```

**Root cause:** `prisma generate` had not been run. The generated client didn't exist.

**Fix:**
```powershell
npx prisma generate
npm run db:seed
```

---

## 2. Docker Compose Issues

### Problem: Caddyfile mount failed — not a directory
```
mount src=.../Caddyfile ... not a directory
```

**Root cause:** `Caddyfile` didn't exist in the project root. Docker auto-created an empty **directory** named `Caddyfile` instead of a file, then failed trying to mount a directory as a file.

**Fix:** Removed the auto-created directory and decided to drop Caddy entirely for the time being (see HTTPS section below).

---

### Problem: Docker build failed — DNS resolution error
```
dial tcp: lookup registry-1.docker.io: no such host
```

**Root cause:** Network adapter was switched during setup. Docker Desktop cached the old network config and couldn't resolve external hostnames.

**Fix:** Docker Desktop → Settings → Docker Engine → add explicit DNS:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
Then Apply & Restart.

---

## 3. HTTPS Implementation Attempt (Abandoned)

### Approach
Used `mkcert` to generate a locally-trusted TLS certificate and Caddy as a reverse proxy for HTTPS termination.

### Issues encountered

| Issue | Root cause |
|---|---|
| `ERR_SSL_PROTOCOL_ERROR` | Caddy matched certs via SNI — but browsers don't send SNI for IP addresses (RFC 6066), so no cert was selected and TLS handshake failed |
| TLS handshake EOF in Caddy logs | mkcert root CA was not installed (requires admin), so Chrome rejected the cert and closed the connection |
| `ERR_CONNECTION_REFUSED` | Docker port forwarding glitch after multiple Caddy restarts |

### Key debug finding
Caddy debug logs revealed the TLS connection policy:
```json
"tls_connection_policies": [{"match": {"sni": ["192.168.117.100"]}, ...}]
```
Browsers connecting to an IP address don't send SNI, so the policy never matched.

**Fix attempt:** Changed Caddyfile from `https://192.168.117.100` to `https://:443` to remove SNI matching. TLS handshake error persisted because the mkcert CA was not trusted system-wide.

### Resolution
HTTPS implementation was abandoned for the prototype. Reverted to plain HTTP on port 3000. Caddy and all cert files removed from the project.

**When to revisit HTTPS:**
- Run `mkcert -install` as Administrator to install the root CA system-wide
- Distribute `rootCA.pem` from `C:\Users\ade19392\AppData\Local\mkcert\` to all client devices
- Re-add Caddy to `docker-compose.yml` with the Caddyfile pointing to `https://:443`
- Update `NEXTAUTH_URL` to `https://<IP>`

---

## 4. LAN Accessibility Issues

### Problem: Other devices could not connect
Devices on the same network got `ERR_CONNECTION_TIMED_OUT` when trying to reach the dashboard.

### Investigation findings

**Step 1 — Firewall rules looked correct:**
All `SME Dashboard` and Docker rules were `Allow`, `Inbound`, `Profile: Any`. Yet connections still timed out.

**Step 2 — Disabling the firewall entirely worked:**
When running `Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False`, other devices could connect. Re-enabling it broke connectivity again.

**Step 3 — GPO is managing the firewall:**
```
netsh advfirewall show privateprofile
```
Output revealed:
```
LocalFirewallRules    N/A (GPO-store only)
LocalConSecRules      N/A (GPO-store only)
Firewall Policy       BlockInbound,AllowOutbound
```

**Root cause confirmed:** IT's Group Policy has set `Apply local firewall rules = No`. This means **every local firewall rule we created was silently ignored** the entire time. Only rules pushed via GPO are enforced. The default policy is `BlockInbound`, so all inbound connections are blocked.

**Why it worked initially:** GPO refreshes every ~90 minutes when connected to the corporate network. The policy was applied (or refreshed) at some point during the troubleshooting session. Before the refresh, local rules were still respected and connections worked. After the GPO refresh, all local rules were silently disabled.

### Network adapter confusion
The machine has two active WiFi adapters:

| Adapter | Hardware | IP | Notes |
|---|---|---|---|
| Wi-Fi | Intel Dual Band Wireless-AC 3165 (built-in) | 192.168.117.100 | Connected to AP without AP isolation |
| Wi-Fi 2 | D-Link DWA-X1850 AX1800 USB (dongle) | 192.168.117.248 | Internet access, connected to AP with AP isolation |

Both need to remain active — D-Link for internet, Intel for LAN device access.

### AP isolation
The D-Link adapter's access point has **client/AP isolation** enabled, blocking device-to-device traffic. The router admin panel (`192.168.112.1`) is inaccessible — managed by IT. This is a separate issue from the GPO firewall problem.

---

## 5. Current State

| Component | Status |
|---|---|
| Docker Compose | Running — `db`, `app` |
| Database | Healthy, migrated, seeded |
| App | Accessible on host at `http://192.168.117.248:3000` |
| LAN access from other devices | Blocked by GPO firewall |
| HTTPS | Not implemented |

---

## 6. Recommended Next Steps

### Option A — Ask IT
Request IT to push a GPO rule allowing inbound TCP port 3000 for `com.docker.backend.exe`. This is the cleanest fix for LAN access without changing architecture.

### Option B — Tailscale (Recommended for broader access)
Install Tailscale on the host and all client devices. Traffic routes peer-to-peer through Tailscale's encrypted tunnel, bypassing both the GPO inbound firewall and AP isolation entirely. Free for up to 3 users.

### Option C — Cloudflare Tunnel (Recommended for broader access without client install)
Run `cloudflared` on the host. Creates an outbound-only tunnel to Cloudflare — no inbound ports needed, no firewall changes required. Provides a public URL with a trusted HTTPS cert. Suitable for broader team access without requiring each user to install anything.

---

## 7. Environment Reference

| Variable | Value |
|---|---|
| Host OS | Windows (corporate managed, SOC monitored) |
| Docker backend | `com.docker.backend` (PID varies) |
| App port | 3000 |
| Database port | 1433 |
| Host IP (D-Link) | `192.168.117.248` |
| Host IP (Intel) | `192.168.117.100` |
| Gateway | `192.168.112.1` |
| `NEXTAUTH_URL` | `http://192.168.117.248:3000` |
| `SA_PASSWORD` | See `.env.local` |
