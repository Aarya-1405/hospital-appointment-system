# Hospital Appointment System — Monitoring

Prometheus + Grafana monitoring for the Aarogya Care Hospital API.

---

## Architecture and data flow

```
React Client (port 5173)
        │
        ▼
Express API (hospital-server:5000)
        │  emits /metrics (Prometheus text format)
        ▼
Prometheus (hospital-prometheus:9090)
        │  stores time-series data, evaluates PromQL
        ▼
Grafana   (hospital-grafana:3000)
        │  visualises dashboards provisioned from this repository
        ▼
Browser (http://localhost:3002, container port 3000)
```

All four containers share the Docker bridge network **hospital-net**.
Prometheus scrapes the Express `/metrics` endpoint every 15 seconds.
Grafana reads from Prometheus over the Docker-internal address
`http://hospital-prometheus:9090`.

---

## Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Docker Desktop | 4.x | `docker --version` |
| Docker Compose v2 | bundled with Docker Desktop | `docker compose version` |
| Git | any | `git --version` |

> **Note:** The application and monitoring stacks are fully containerised.
> Node.js does not need to be installed on the host to run the containers.
> Node.js is only required if you want to run the backend tests locally
> (`npm test` inside `server/`).

---

## Starting the application

> **Always start the application stack first.** The monitoring stack joins
> the `hospital-net` network, which is created by the application Compose file.
> If Prometheus starts before the network exists, it will fail.

From the repository root:

```powershell
# 1. Create the .env file (required once — never commit it)
#    On Windows PowerShell:
$env:JWT_SECRET = [System.Web.Security.Membership]::GeneratePassword(40,5)
"JWT_SECRET=$env:JWT_SECRET" | Out-File -Encoding utf8 .env

# 2. Build images and start MongoDB + Express + React
docker compose up -d --build

# 3. Seed sample data (first time only, safe to re-run)
docker compose exec server npm run seed
```

Wait for the `hospital-mongo` healthcheck to pass (about 30 seconds) and the
server to print `API running at http://localhost:5000`.

```powershell
# Verify the API is healthy
Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing | Select-Object StatusCode
# Expected: 200

# Verify the metrics endpoint is live
Invoke-WebRequest http://localhost:5000/metrics -UseBasicParsing | Select-Object StatusCode
# Expected: 200
```

---

## Starting monitoring

```powershell
# From the repository root
docker compose -f monitoring/docker-compose.yml up -d
```

Prometheus and Grafana start in seconds (no build step — they use published images).

---

## Stopping monitoring

```powershell
# Stop containers but KEEP persistent data (Prometheus TSDB, Grafana state)
docker compose -f monitoring/docker-compose.yml stop

# Stop AND remove containers (data volumes are preserved)
docker compose -f monitoring/docker-compose.yml down

# Stop AND remove containers AND delete all monitoring data
docker compose -f monitoring/docker-compose.yml down -v
```

To stop the whole application stack:

```powershell
docker compose down          # keeps mongo-data volume
docker compose down -v       # also wipes the database
```

---

## Browser URLs

| Service | URL | Notes |
|---|---|---|
| React frontend | http://localhost:5173 | |
| Express API health | http://localhost:5000/api/health | JSON `{"ok":true}` |
| Prometheus metrics | http://localhost:5000/metrics | Raw Prometheus text |
| Prometheus UI | http://localhost:9090 | Query, targets, alerts |
| Grafana | http://localhost:3002 | Dashboards |

---

## Grafana login

Default credentials: **admin / admin**

> [!IMPORTANT]
> Grafana will prompt you to change the password on first login.
> Set a strong password. Do not use "admin" in a shared or deployed environment.
> The password is stored in the `grafana-data` Docker volume, not in this repository.

To override the default password before starting Grafana, set `GRAFANA_PASSWORD`
in your root `.env` file:

```
GRAFANA_PASSWORD=your-strong-password-here
```

Then pass the file when starting monitoring:

```powershell
docker compose -f monitoring/docker-compose.yml --env-file .env up -d
```

---

## Prometheus targets

1. Open http://localhost:9090/targets
2. You should see two targets: **prometheus** (self-scrape) and **hospital-server**.
3. Both should show state **UP** after 15–30 seconds.

If `hospital-server` shows **DOWN**:
- Confirm the Express container is running: `docker ps`
- Confirm the metrics endpoint responds: `docker exec hospital-server wget -qO- http://localhost:5000/metrics | head`
- Confirm both containers are on the same network: `docker network inspect hospital-net`

---

## Verifying /metrics manually

```powershell
# From host:
Invoke-WebRequest http://localhost:5000/metrics -UseBasicParsing | Select-Object -ExpandProperty Content | Select-String "http_requests_total"

# From inside the Prometheus container:
docker exec hospital-prometheus wget -qO- http://hospital-server:5000/metrics | Select-String "http_requests_total"
```

---

## Example PromQL queries

Paste these in the Prometheus expression browser (http://localhost:9090/graph)
or in Grafana's Explore panel (select the Prometheus data source).

```promql
# Is the API server up?
up{job="hospital-server"}

# Total HTTP requests per second (last 5 min)
sum(rate(http_requests_total{job="hospital-server"}[5m])) by (method, route)

# 4xx error rate
sum(rate(http_requests_total{job="hospital-server", status_code=~"4.."}[5m]))

# 5xx error rate
sum(rate(http_requests_total{job="hospital-server", status_code=~"5.."}[5m]))

# p95 request latency (last 5 min)
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="hospital-server"}[5m])) by (le))

# Heap memory used
nodejs_heap_size_used_bytes{job="hospital-server"}

# CPU usage rate (fraction of one core)
rate(process_cpu_seconds_total{job="hospital-server"}[1m])

# Event-loop lag
nodejs_eventloop_lag_seconds{job="hospital-server"}
```

---

## Dashboard provisioning

Grafana loads dashboards automatically from:

```
monitoring/grafana/provisioning/dashboards/hospital-overview.json
```

This file is mounted read-only into the Grafana container at startup.
Changes committed to the repository are applied after restarting Grafana:

```powershell
docker compose -f monitoring/docker-compose.yml restart grafana
```

The dashboard appears under **Dashboards → Hospital → Hospital API Overview**.

---

## Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| Prometheus target DOWN — connection refused | Express container not running | `docker compose up -d server` |
| Prometheus target DOWN — no route to host | hospital-net not created | Start the app stack first: `docker compose up -d` |
| `network hospital-net declared as external, but could not be found` | App stack not started | Run `docker compose up -d` from the root before starting monitoring |
| Grafana "Data source connected but no labels received" | Prometheus has no data yet | Wait 30 s for the first scrape cycle |
| Port 3000 already in use | Another service (e.g. local Node dev server) | Stop the other service or change the Grafana port in `monitoring/docker-compose.yml` |
| Port 9090 already in use | Another Prometheus instance | Stop it or change the Prometheus port |
| `JWT_SECRET is missing` in server logs | `.env` not created at the root | Follow "Starting the application" step 1 above |

---

## Metrics implemented

| Metric name | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests handled by the API |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Request latency (buckets: 5 ms – 10 s) |
| `process_cpu_seconds_total` | Counter | — | CPU time consumed by the Node.js process |
| `process_resident_memory_bytes` | Gauge | — | Resident set size (RSS) |
| `nodejs_heap_size_used_bytes` | Gauge | — | V8 heap used |
| `nodejs_heap_size_total_bytes` | Gauge | — | V8 heap total |
| `nodejs_eventloop_lag_seconds` | Gauge | — | Event-loop lag |
| `nodejs_active_handles_total` | Gauge | — | Active libuv handles |
| `nodejs_active_requests_total` | Gauge | — | Active libuv requests |
| … (all other prom-client defaults) | various | — | GC stats, file descriptors, version info |

The `route` label uses the Express matched route pattern (e.g. `/api/appointments/:id/cancel`) rather than raw request paths, so label cardinality stays bounded regardless of the number of appointments or users.

---

## Grafana host port (3002)

Grafana runs on **container port 3000**, but the compose file publishes it on
**host port 3002** (`"3002:3000"` in `monitoring/docker-compose.yml`). Port 3000
is commonly taken on developer machines by another Grafana, so 3002 avoids the
"address already in use" error.

- Browser: http://localhost:3002 (login `admin` / `admin`)
- Prometheus still reaches Grafana's datasource at
  `http://hospital-prometheus:9090` inside the Docker network, so the host port
  change does not affect it.

To use a different port, change the left side of `"3002:3000"`.
