import client from 'prom-client';

// Use a global to survive hot-reloads in Next.js dev mode
const globalForMetrics = globalThis as typeof globalThis & { _metricsRegistry?: client.Registry };

let register: client.Registry;

if (globalForMetrics._metricsRegistry) {
  register = globalForMetrics._metricsRegistry;
} else {
  register = new client.Registry();
  client.collectDefaultMetrics({ register });
  globalForMetrics._metricsRegistry = register;
}

export { register };

function getOrCreateCounter(name: string, help: string, labelNames: string[]) {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as client.Counter;
  return new client.Counter({ name, help, labelNames: labelNames as any, registers: [register] });
}

function getOrCreateHistogram(name: string, help: string, labelNames: string[], buckets: number[]) {
  const existing = register.getSingleMetric(name);
  if (existing) return existing as client.Histogram;
  return new client.Histogram({ name, help, labelNames: labelNames as any, buckets, registers: [register] });
}

export const httpRequestCounter = getOrCreateCounter(
  'http_requests_total',
  'Total number of HTTP requests',
  ['method', 'route', 'status_code']
);

export const httpRequestDuration = getOrCreateHistogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds',
  ['method', 'route', 'status_code'],
  [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
);

export const dbErrorCounter = getOrCreateCounter(
  'db_errors_total',
  'Total database errors',
  ['operation', 'table']
);

export const dbQueryDuration = getOrCreateHistogram(
  'db_query_duration_seconds',
  'Supabase query duration in seconds',
  ['operation', 'table'],
  [0.01, 0.05, 0.1, 0.5, 1, 2]
);

export const businessEventCounter = getOrCreateCounter(
  'business_events_total',
  'Total business events (sales, rentals)',
  ['event_type', 'status']
);
