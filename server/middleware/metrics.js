/**
 * Prometheus metrics middleware for the Hospital Appointment System API.
 *
 * Exposes:
 *   - Default Node.js process metrics (CPU, memory, GC, event-loop lag)
 *   - http_requests_total          counter   { method, route, status_code }
 *   - http_request_duration_seconds histogram { method, route, status_code }
 *
 * The /metrics endpoint itself is excluded from the http_* counters so that
 * Prometheus scrape traffic does not inflate application metrics.
 *
 * Labels use bounded cardinality:
 *   - method:      HTTP verb (GET, POST, PATCH, DELETE)
 *   - route:       Express matched route pattern (e.g. /api/appointments/:id/cancel)
 *                  Falls back to UNKNOWN when no route is matched (404 handler path).
 *   - status_code: HTTP status code as a string
 *
 * No personal data, auth headers, tokens, request bodies, or query strings
 * are ever recorded as labels.
 */

'use strict';

const client = require('prom-client');

// ── Registry ──────────────────────────────────────────────────────────────────
// Use the global default registry so prom-client's built-in collectDefaultMetrics
// writes into the same registry that /metrics reads from.
const register = client.register;
register.setDefaultLabels({ app: 'hospital-api' });

// Collect Node.js process metrics (CPU, memory, GC, event-loop lag, …)
client.collectDefaultMetrics({ register });

// ── Custom metrics ────────────────────────────────────────────────────────────
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets covering fast API (5 ms) through slow queries (10 s)
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * Derive a bounded-cardinality route label from an Express request.
 * Uses req.route.path (the matched pattern) when available so that
 * parameterised segments like :id never appear raw in metric labels.
 * Falls back to UNKNOWN rather than using req.path, which could contain IDs.
 */
function routeLabel(req) {
  if (req.route && req.route.path) {
    // Combine the mount path prefix with the route pattern, e.g.
    // baseUrl=/api/appointments  route.path=/:id/cancel
    // → /api/appointments/:id/cancel
    return (req.baseUrl || '') + req.route.path;
  }
  return 'UNKNOWN';
}

// ── Middleware ────────────────────────────────────────────────────────────────
/**
 * Express middleware that starts a timer on every request and records
 * http_requests_total and http_request_duration_seconds on response finish.
 *
 * Attach this BEFORE route definitions in server.js.
 */
function metricsMiddleware(req, res, next) {
  // Do not measure the scrape endpoint itself.
  if (req.path === '/metrics') return next();

  const end = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: routeLabel(req),
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}

// ── /metrics route handler ────────────────────────────────────────────────────
/**
 * Returns all registered metrics in Prometheus text exposition format.
 * Mount this handler at GET /metrics in server.js.
 */
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err.message);
  }
}

module.exports = { metricsMiddleware, metricsHandler };
