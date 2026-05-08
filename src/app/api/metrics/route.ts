import { NextRequest, NextResponse } from 'next/server';
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbErrorCounter = new client.Counter({
  name: 'db_errors_total',
  help: 'Total database errors',
  labelNames: ['operation', 'table'],
  registers: [register],
});

export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Supabase query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const businessEventCounter = new client.Counter({
  name: 'business_events_total',
  help: 'Total business events (sales, rentals)',
  labelNames: ['event_type', 'status'],
  registers: [register],
});

export async function GET(req: NextRequest) {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}