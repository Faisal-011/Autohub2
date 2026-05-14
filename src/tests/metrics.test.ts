import { describe, it, expect, beforeEach } from 'vitest';

describe('Prometheus metrics registry', () => {
  beforeEach(() => {
    // Reset module registry between tests to avoid duplicate metric errors
    delete (globalThis as any)._metricsRegistry;
  });

  it('exports the expected counter and histogram names', async () => {
    const { register, httpRequestCounter, httpRequestDuration, dbErrorCounter, dbQueryDuration, businessEventCounter } =
      await import('@/lib/metrics');

    const metricNames = (await register.getMetricsAsJSON()).map((m: any) => m.name);

    expect(metricNames).toContain('http_requests_total');
    expect(metricNames).toContain('http_request_duration_seconds');
    expect(metricNames).toContain('db_errors_total');
    expect(metricNames).toContain('db_query_duration_seconds');
    expect(metricNames).toContain('business_events_total');
  });

  it('httpRequestCounter increments correctly', async () => {
    const { httpRequestCounter, register } = await import('@/lib/metrics');

    httpRequestCounter.inc({ method: 'GET', route: '/test', status_code: '200' });

    const json = await register.getMetricsAsJSON();
    const counter = json.find((m: any) => m.name === 'http_requests_total');
    expect(counter).toBeDefined();
    const value = counter!.values.find(
      (v: any) => v.labels.method === 'GET' && v.labels.route === '/test' && v.labels.status_code === '200'
    );
    expect(value?.value).toBeGreaterThanOrEqual(1);
  });

  it('dbErrorCounter increments correctly', async () => {
    const { dbErrorCounter, register } = await import('@/lib/metrics');

    dbErrorCounter.inc({ operation: 'select', table: 'cars' });

    const json = await register.getMetricsAsJSON();
    const counter = json.find((m: any) => m.name === 'db_errors_total');
    const value = counter?.values.find(
      (v: any) => v.labels.operation === 'select' && v.labels.table === 'cars'
    );
    expect(value?.value).toBeGreaterThanOrEqual(1);
  });

  it('businessEventCounter increments correctly', async () => {
    const { businessEventCounter, register } = await import('@/lib/metrics');

    businessEventCounter.inc({ event_type: 'sale', status: 'completed' });

    const json = await register.getMetricsAsJSON();
    const counter = json.find((m: any) => m.name === 'business_events_total');
    const value = counter?.values.find(
      (v: any) => v.labels.event_type === 'sale' && v.labels.status === 'completed'
    );
    expect(value?.value).toBeGreaterThanOrEqual(1);
  });
});
