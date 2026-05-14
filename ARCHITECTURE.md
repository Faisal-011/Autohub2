# AutoHub2 — Architecture & DevSecOps Map

> **Project:** AutoHub2 — Car Dealership Management System
> **Stack:** Next.js 15 · TypeScript · Supabase · Docker · GKE · Terraform · NGINX · cert-manager · Let's Encrypt · Prometheus · Grafana · Blackbox Exporter · Genkit / Gemini · GitHub Actions · Vitest · Trivy

---

## The Complete DevSecOps Cycle Map

Every tool in this project maps to one or more phases of the DevSecOps cycle. Nothing exists without purpose.

```
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                          AUTOHUB2 — DEVSECOPS CYCLE MAP                                     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  1. PLAN                                                                                │
  │  Tools: CLAUDE.md · DevOps Initial Project Planning Document · Blueprint               │
  │                                                                                         │
  │  - Architecture decisions documented                                                    │
  │  - Tech stack selected with justification                                               │
  │  - Security requirements identified upfront (not bolted on later)                      │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  2. CODE                                                                                │
  │  Tools: Next.js 15 · TypeScript · Zod · Supabase · React · TailwindCSS · Genkit       │
  │                                                                                         │
  │  Next.js 15 (App Router)                                                                │
  │  ├── src/app/          → Pages (Inventory, Sales, Rentals, Customers, Test Drives)     │
  │  ├── src/app/api/      → API routes (health, metrics)                                  │
  │  ├── src/lib/          → Business logic, Supabase client, Prometheus metrics           │
  │  ├── src/ai/           → Genkit + Gemini AI recommendation flow                       │
  │  └── src/components/   → shadcn/ui + Radix UI components                              │
  │                                                                                         │
  │  Security in code:                                                                      │
  │  ├── TypeScript → type safety, no silent runtime errors                                │
  │  ├── Zod schemas → validate all AI flow inputs/outputs                                 │
  │  ├── 'use server' on AI flows → Gemini API key never reaches the browser               │
  │  └── Supabase server client → credentials never in client bundle                       │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  3. BUILD                                                                               │
  │  Tools: Docker (multi-stage) · Next.js standalone output · npm                         │
  │                                                                                         │
  │  Dockerfile — 3-stage build:                                                            │
  │  ┌──────────────┐    ┌──────────────┐    ┌─────────────────────────┐                  │
  │  │  Stage 1     │    │  Stage 2     │    │  Stage 3 (FINAL IMAGE)  │                  │
  │  │  deps        │───▶│  builder     │───▶│  runner                 │                  │
  │  │              │    │              │    │                         │                  │
  │  │ node:18-alp  │    │ npm run build│    │ node:18-alpine          │                  │
  │  │ npm ci       │    │ Next.js      │    │ USER node (non-root)    │                  │
  │  │              │    │ standalone   │    │ EXPOSE 3000             │                  │
  │  └──────────────┘    └──────────────┘    │ CMD ["node","server.js"]│                  │
  │                                          └─────────────────────────┘                  │
  │                                                                                         │
  │  Security in build:                                                                     │
  │  ├── Alpine base → minimal attack surface (~5MB vs ~200MB Debian)                      │
  │  ├── Multi-stage → no build tools, source code, or dev deps in final image             │
  │  ├── USER node → container runs as non-root                                            │
  │  └── next.config.ts output:standalone → smallest possible production bundle            │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  4. TEST                                                                                │
  │  Tools: Vitest · @testing-library/react · Trivy · TypeScript (tsc)                    │
  │                                                                                         │
  │  Automated tests (src/tests/):                                                          │
  │  ├── utils.test.ts     → 6 tests — cn() class merger                                  │
  │  ├── metrics.test.ts   → 4 tests — Prometheus counter/histogram correctness            │
  │  └── types.test.ts     → 5 tests — domain type validation (Car, Sale, Rental)         │
  │                                                        Total: 15 tests                 │
  │                                                                                         │
  │  Security testing:                                                                      │
  │  └── Trivy image scan → scans Docker image for CVEs before any push                    │
  │      ├── Fails CI on CRITICAL or HIGH severity                                          │
  │      ├── Checks Node.js deps, Alpine packages, OS libraries                             │
  │      └── --ignore-unfixed → only fails on actionable vulnerabilities                   │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  5. RELEASE                                                                             │
  │  Tools: GitHub Actions · Google Artifact Registry (GAR) · Git                          │
  │                                                                                         │
  │  GitHub Actions CI pipeline (.github/workflows/ci.yml):                                │
  │                                                                                         │
  │  push to main/branch                                                                    │
  │       │                                                                                 │
  │       ▼                                                                                 │
  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐      │
  │  │ npm ci     │→ │ typecheck  │→ │ npm test   │→ │ npm build  │→ │ Auth GCP   │      │
  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └─────┬──────┘      │
  │                                                                          │              │
  │  ┌────────────┐  ┌────────────┐  ┌───────────────────────────────┐     │              │
  │  │ Push image │← │Trivy scan  │← │ Docker build (local, no push) │ ←───┘              │
  │  │ to GAR     │  │ CRITICAL/  │  │                               │                    │
  │  │ :sha + lat │  │ HIGH block │  └───────────────────────────────┘                    │
  │  └────────────┘  └────────────┘                                                        │
  │                                                                                         │
  │  Image registry: us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2     │
  │  Tagged with git SHA → every image traceable to exact commit, rollback possible        │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  6. DEPLOY                                                                              │
  │  Tools: Terraform · Helm · Kubernetes (GKE) · NGINX Ingress · cert-manager            │
  │         Let's Encrypt · GitHub Actions (CD job)                                        │
  │                                                                                         │
  │  Infrastructure as Code — Terraform provisions everything:                              │
  │                                                                                         │
  │  terraform apply                                                                        │
  │       │                                                                                 │
  │       ├──▶ GKE Cluster (us-central1, 2 nodes, e2-medium, COS_CONTAINERD)              │
  │       ├──▶ Node Pool (2 nodes, 30GB pd-standard)                                       │
  │       ├──▶ Kubernetes Secret (Supabase URL/key, Gemini key)                            │
  │       ├──▶ Kubernetes Deployment (2 replicas, resource limits, health probes)          │
  │       ├──▶ Kubernetes Service (LoadBalancer, port 80→3000)                             │
  │       ├──▶ HPA (min 2, max 10 replicas, CPU 70% / Memory 80%)                         │
  │       ├──▶ NetworkPolicy (app only reachable from ingress-nginx + monitoring ns)       │
  │       ├──▶ Kubernetes Ingress (host routing + TLS)                                     │
  │       ├──▶ Helm: NGINX Ingress Controller (namespace: ingress-nginx)                   │
  │       ├──▶ Helm: cert-manager (namespace: cert-manager)                                │
  │       ├──▶ Helm: kube-prometheus-stack (Prometheus + Grafana, namespace: monitoring)  │
  │       └──▶ Helm: Blackbox Exporter (namespace: monitoring)                             │
  │                                                                                         │
  │  Continuous Deployment (on push to main):                                               │
  │  GitHub Actions deploy job                                                              │
  │       │                                                                                 │
  │       ├──▶ Auth to GCP (GCP_SA_KEY secret → github-actions-deployer service account)  │
  │       ├──▶ gcloud container clusters get-credentials                                   │
  │       ├──▶ kubectl set image deployment → new GAR image SHA                            │
  │       └──▶ kubectl rollout status (waits for zero-downtime rollout to complete)        │
  │                                                                                         │
  │  SSL/TLS — cert-manager + Let's Encrypt:                                               │
  │  ┌─────────────────────────────────────────────────────────────────────────────┐       │
  │  │  ClusterIssuer (letsencrypt-prod)                                           │       │
  │  │       │                                                                     │       │
  │  │       ├──▶ ACME HTTP-01 challenge via NGINX Ingress                        │       │
  │  │       ├──▶ Let's Encrypt verifies domain ownership                         │       │
  │  │       ├──▶ Certificate stored in Secret "autohub-tls"                      │       │
  │  │       ├──▶ NGINX serves HTTPS using the cert                               │       │
  │  │       └──▶ Auto-renews every ~60 days (cert valid 90 days)                 │       │
  │  └─────────────────────────────────────────────────────────────────────────────┘       │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  7. OPERATE                                                                             │
  │  Tools: Kubernetes · NGINX Ingress · Supabase · Google Genkit                          │
  │                                                                                         │
  │  Live request flow:                                                                     │
  │                                                                                         │
  │  Browser (HTTPS)                                                                        │
  │       │                                                                                 │
  │       ▼                                                                                 │
  │  Google Cloud Load Balancer  (public IP via NGINX Ingress Service)                     │
  │       │  TCP :443                                                                       │
  │       ▼                                                                                 │
  │  NGINX Ingress Controller Pod                                                           │
  │  ├── TLS terminated here (cert from "autohub-tls" Secret)                              │
  │  ├── Routes by host: 35.223.135.76.nip.io → autohub-service:80                        │
  │  └── Forwards plain HTTP internally                                                     │
  │       │                                                                                 │
  │       ▼                                                                                 │
  │  Kubernetes Service: autohub-service                                                    │
  │  └── Load balances across 2–10 pods (HPA managed)                                      │
  │       │                                                                                 │
  │       ▼                                                                                 │
  │  AutoHub Pod (Node.js, port 3000)                                                       │
  │  ├── Page request  → Server Component → Supabase (PostgreSQL, external HTTPS)          │
  │  ├── AI request    → Genkit flow → Gemini 2.5 Flash API (external HTTPS)              │
  │  ├── GET /api/health  → Supabase query → 200 healthy / 503 unhealthy                  │
  │  └── GET /api/metrics → prom-client registry → Prometheus text format                 │
  │                                                                                         │
  │  Operational security:                                                                  │
  │  ├── Pods run as USER node (non-root)                                                   │
  │  ├── Resource limits prevent memory/CPU exhaustion attacks                              │
  │  ├── NetworkPolicy → pods only accept traffic from ingress-nginx + monitoring           │
  │  ├── Secrets injected as env vars (never in Docker image)                              │
  │  ├── HPA scales out under load (DDoS mitigation)                                       │
  │  └── Liveness + Readiness probes auto-restart unhealthy pods                           │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  8. MONITOR                                                                             │
  │  Tools: Prometheus · Grafana · Blackbox Exporter · prom-client                         │
  │                                                                                         │
  │  Metrics collection:                                                                    │
  │                                                                                         │
  │  ┌─────────────────────────────────────────────────────────────────────────────┐       │
  │  │  prom-client (inside Next.js)          Exposed at /api/metrics             │       │
  │  │  ├── http_requests_total               Counter — by method/route/status    │       │
  │  │  ├── http_request_duration_seconds     Histogram — request latency         │       │
  │  │  ├── db_errors_total                   Counter — Supabase errors           │       │
  │  │  ├── db_query_duration_seconds         Histogram — query latency           │       │
  │  │  ├── business_events_total             Counter — sales, rentals            │       │
  │  │  └── default Node.js metrics           CPU, memory, event-loop lag         │       │
  │  └─────────────────────────────────────────────────────────────────────────────┘       │
  │                          │ scraped every 15s                                            │
  │                          ▼                                                              │
  │  ┌─────────────────────────────────────────────────────────────────────────────┐       │
  │  │  Prometheus (kube-prometheus-stack)                                         │       │
  │  │  ├── Scrapes /api/metrics (app metrics)                                     │       │
  │  │  ├── Scrapes Node Exporter (host CPU/disk/memory on every node)            │       │
  │  │  ├── Scrapes kube-state-metrics (pod restarts, deployment status)          │       │
  │  │  └── Instructs Blackbox Exporter to probe /, /api/health, /api/metrics     │       │
  │  └─────────────────────────────────────────────────────────────────────────────┘       │
  │                          │                                                              │
  │          ┌───────────────┴────────────────┐                                            │
  │          ▼                                ▼                                            │
  │  ┌──────────────────┐           ┌──────────────────────────────────────┐              │
  │  │ Blackbox Exporter│           │ Grafana                              │              │
  │  │                  │           │                                      │              │
  │  │ Active HTTP probes│          │ Dashboards:                          │              │
  │  │ ├── /            │           │ ├── Kubernetes cluster overview      │              │
  │  │ ├── /api/health  │           │ ├── Node resource usage              │              │
  │  │ └── /api/metrics │           │ ├── AutoHub request rate + latency   │              │
  │  │                  │           │ ├── Business events (sales/rentals)  │              │
  │  │ Returns:         │           │ └── Blackbox probe success/failure   │              │
  │  │ probe_success=1  │           │                                      │              │
  │  │ probe_success=0  │           │ Public URL: LoadBalancer IP          │              │
  │  └──────────────────┘           └──────────────────────────────────────┘              │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  9. RESPOND (ALERT)                                                                     │
  │  Tools: Prometheus Alerting Rules · Alertmanager · Email (Gmail SMTP)                  │
  │                                                                                         │
  │  8 alert rules (infrastructure/k8s/prometheus-rules.yaml):                             │
  │                                                                                         │
  │  CRITICAL alerts (page immediately):                                                    │
  │  ├── AutoHubDown           → probe_success == 0 for 2 min                             │
  │  ├── AutoHubHealthCheck    → /api/health failing for 1 min (DB down)                  │
  │  ├── AutoHubPodCrashLoop   → pod restarting repeatedly                                 │
  │  └── AutoHubLowReplicas    → available replicas < 1                                    │
  │                                                                                         │
  │  WARNING alerts (investigate soon):                                                     │
  │  ├── HighRequestLatency    → p99 > 2s over 5 min                                      │
  │  ├── HighErrorRate         → >5% of requests returning 5xx                             │
  │  ├── DatabaseErrorSpike    → Supabase errors > 0.1/s for 2 min                        │
  │  └── SlowDatabaseQueries   → p95 query time > 1s over 5 min                           │
  │                                                                                         │
  │  Alertmanager routing:                                                                  │
  │  ├── CRITICAL → immediate email to qsirius12@gmail.com                                 │
  │  ├── WARNING  → email to qsirius12@gmail.com                                           │
  │  └── Resolved → sends resolution email (alert cleared notification)                    │
  └─────────────────────────┬───────────────────────────────────────────────────────────────┘
                             │
                             ▼ (feedback loop back to PLAN)
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │  10. FEEDBACK → PLAN                                                                    │
  │                                                                                         │
  │  Metrics from Prometheus + Grafana inform next planning cycle:                          │
  │  ├── business_events_total → which features are used most                              │
  │  ├── db_query_duration → which queries need optimisation                               │
  │  ├── http_request_duration → which pages are slow                                      │
  │  └── Alert history → what broke, how often, how long to recover                        │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Full Infrastructure Map

```
                              INTERNET
                                  │
                    HTTPS :443 (nip.io domain)
                                  │
                                  ▼
                 ┌─────────────────────────────┐
                 │  Google Cloud Load Balancer  │
                 │  (GCP managed, public IP)    │
                 └──────────────┬──────────────┘
                                │
                                ▼
              ┌─────────────────────────────────────┐
              │       GKE CLUSTER (us-central1)      │
              │         2 nodes, e2-medium            │
              │                                       │
              │  namespace: ingress-nginx             │
              │  ┌────────────────────────────────┐  │
              │  │   NGINX Ingress Controller     │  │
              │  │   ├── TLS termination          │  │
              │  │   │   (cert from autohub-tls)  │  │
              │  │   └── Routes → autohub-service │  │
              │  └────────────────────────────────┘  │
              │           │                           │
              │  namespace: cert-manager              │
              │  ┌────────────────────────────────┐  │
              │  │   cert-manager                  │  │
              │  │   ├── Watches Ingress objects   │  │
              │  │   ├── ACME HTTP-01 challenge    │  │
              │  │   │   via Let's Encrypt         │  │
              │  │   └── Stores cert in Secret     │  │
              │  │       "autohub-tls"             │  │
              │  └────────────────────────────────┘  │
              │           │                           │
              │  namespace: default                   │
              │  ┌────────────────────────────────┐  │
              │  │   autohub-service (LB, :80)    │  │
              │  │   NetworkPolicy: only accepts   │  │
              │  │   traffic from ingress-nginx    │  │
              │  │   and monitoring namespaces     │  │
              │  └───────────┬────────────────────┘  │
              │               │ load balanced         │
              │       ┌───────┴────────┐              │
              │       ▼               ▼              │
              │  ┌──────────┐   ┌──────────┐         │
              │  │  Pod 1   │   │  Pod 2   │  ← HPA  │
              │  │ autohub  │   │ autohub  │  scales  │
              │  │ :3000    │   │ :3000    │  2–10    │
              │  │          │   │          │  replicas│
              │  │ /health  │   │ /health  │         │
              │  │ /metrics │   │ /metrics │         │
              │  └────┬─────┘   └────┬────┘         │
              │       │              │               │
              │       └──────┬───────┘               │
              │              │                       │
              │  namespace: monitoring                │
              │  ┌────────────────────────────────┐  │
              │  │   Prometheus                   │  │
              │  │   ├── scrapes :3000/api/metrics│  │
              │  │   ├── scrapes Node Exporter    │  │
              │  │   ├── scrapes kube-state-metrics│ │
              │  │   └── feeds Alertmanager       │  │
              │  │                                │  │
              │  │   Grafana (public LB IP)       │  │
              │  │   └── queries Prometheus       │  │
              │  │                                │  │
              │  │   Blackbox Exporter            │  │
              │  │   └── probes /, /health,       │  │
              │  │       /metrics externally      │  │
              │  │                                │  │
              │  │   Alertmanager                 │  │
              │  │   └── routes alerts → Gmail    │  │
              │  └────────────────────────────────┘  │
              └─────────────────────────────────────┘
                         │                │
                         │                │
                         ▼                ▼
              ┌─────────────────┐  ┌─────────────────┐
              │    Supabase     │  │   Gemini API    │
              │  (PostgreSQL)   │  │  (Google Cloud) │
              │                 │  │                 │
              │  Tables:        │  │  Genkit flow:   │
              │  ├── cars        │  │  recommend-cars │
              │  ├── customers  │  │  -based-on-needs│
              │  ├── sales      │  │                 │
              │  ├── rentals    │  │  Model:         │
              │  ├── test_drives│  │  gemini-2.5-    │
              │  └── appointments│ │  flash          │
              └─────────────────┘  └─────────────────┘
```

---

## CI/CD Pipeline Map

```
  Developer pushes code
         │
         ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    GITHUB (Faisal-011/Autohub2)                         │
  │                                                                          │
  │  Branch: main / faisal/docker-containerization                          │
  │                                                                          │
  │  Secrets stored in GitHub:                                               │
  │  ├── NEXT_PUBLIC_SUPABASE_URL                                            │
  │  ├── NEXT_PUBLIC_SUPABASE_ANON_KEY                                       │
  │  └── GCP_SA_KEY (github-actions-deployer service account)               │
  └──────────────────────────────────┬──────────────────────────────────────┘
                                     │ triggers
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │              GITHUB ACTIONS — Job: build-and-push                       │
  │                                                                          │
  │  ubuntu-latest runner                                                    │
  │                                                                          │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
  │  │ checkout │→ │ node 18  │→ │ npm ci   │→ │typecheck │               │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
  │                                                                          │
  │  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐                │
  │  │ npm test │→ │npm build │→ │ Auth → GCP (SA key)   │                │
  │  │ (Vitest) │  │          │  └───────────────────────┘                │
  │  └──────────┘  └──────────┘              │                             │
  │                                           ▼                             │
  │                              ┌───────────────────────┐                 │
  │                              │ Docker build (local)  │                 │
  │                              │ tagged :git-sha        │                 │
  │                              └───────────┬───────────┘                 │
  │                                          │                              │
  │                                          ▼                              │
  │                              ┌───────────────────────┐                 │
  │                              │  TRIVY SCAN           │                 │
  │                              │  CRITICAL/HIGH → FAIL │                 │
  │                              │  blocks push if vuln  │                 │
  │                              └───────────┬───────────┘                 │
  │                                          │ passes                       │
  │                                          ▼                              │
  │                              ┌───────────────────────┐                 │
  │                              │ Push to GAR           │                 │
  │                              │ :sha + :latest        │                 │
  │                              └───────────────────────┘                 │
  └──────────────────────────────────┬──────────────────────────────────────┘
                                     │ on main only
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │              GITHUB ACTIONS — Job: deploy                               │
  │                                                                          │
  │  ┌────────────────────────────────────────────────────────────────┐    │
  │  │ Auth GCP → get-gke-credentials → kubectl set image → rollout  │    │
  │  └────────────────────────────────────────────────────────────────┘    │
  │                                                                          │
  │  Zero-downtime rolling update:                                           │
  │  ├── New pods start with new image                                       │
  │  ├── Readiness probe passes → pod joins Service                         │
  │  ├── Old pods terminated                                                 │
  │  └── kubectl rollout status waits for completion                        │
  └─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                         Deployed to GKE cluster
```

---

## Secrets & Security Map

```
  WHERE SECRETS LIVE                HOW THEY GET TO THE APP
  ──────────────────                ───────────────────────

  terraform.tfvars (LOCAL ONLY)
  ├── supabase_url        ──────▶  terraform apply
  ├── supabase_key        ──────▶       │
  ├── gemini_key          ──────▶       ▼
  └── grafana_password    ──────▶  kubernetes_secret "autohub-secrets"
                                        │
                                        ▼ envFrom.secretRef
                                   Pod environment variables
                                   (NEXT_PUBLIC_SUPABASE_URL, etc.)

  GitHub Repository Secrets
  ├── NEXT_PUBLIC_SUPABASE_URL ──▶ Build step env vars (Next.js needs
  ├── NEXT_PUBLIC_SUPABASE_ANON_KEY  at build time for SSR)
  └── GCP_SA_KEY ───────────────▶ google-github-actions/auth
                                   → gcloud / kubectl in CD job

  GCP IAM
  └── github-actions-deployer SA
      ├── roles/container.developer   → kubectl access
      └── roles/artifactregistry.writer → GAR push access

  NEVER in git:
  ├── terraform.tfvars    (gitignored: *.tfvars)
  ├── terraform.tfstate   (gitignored: *.tfstate, now in GCS)
  ├── .env / .env.local   (gitignored: .env*)
  └── k8s/secrets.yaml    (gitignored explicitly)
```

---

## DevSecOps Tool Reference Table

| Tool | Category | DevSecOps Phase | Why Used |
|---|---|---|---|
| **Next.js 15** | Framework | Code, Operate | Full-stack React framework — SSR, API routes, standalone Docker output |
| **TypeScript** | Language | Code, Test | Catches type errors at compile time before they reach production |
| **Zod** | Validation | Code | Runtime schema validation on all AI inputs/outputs |
| **Supabase** | Database | Code, Operate | Managed PostgreSQL — removes DB ops overhead, provides REST API |
| **Google Genkit** | AI Orchestration | Code | Structured AI flow framework — typed prompts, schema-validated outputs |
| **Gemini 2.5 Flash** | AI Model | Code | Fast, cost-efficient LLM for car recommendations |
| **shadcn/ui + Radix UI** | UI Components | Code | Accessible, headless component primitives |
| **TailwindCSS** | Styling | Code | Utility-first CSS — fast to build, consistent, no dead CSS |
| **prom-client** | Instrumentation | Code, Monitor | Exposes Prometheus metrics from inside the Next.js process |
| **Docker** | Containerisation | Build | Reproducible, portable runtime — eliminates environment differences |
| **Vitest** | Testing | Test | Fast unit test runner, native TypeScript support |
| **@testing-library/react** | Testing | Test | Tests React components as users interact with them |
| **Trivy** | Security Scanning | Test, Release | Scans Docker images for CVEs — blocks push on CRITICAL/HIGH |
| **GitHub Actions** | CI/CD | Release, Deploy | Automated pipeline on every push — build, test, scan, deploy |
| **Google Artifact Registry** | Image Registry | Release | GCP-native Docker registry — integrates with GKE without extra credentials |
| **Terraform** | Infrastructure as Code | Deploy | Declarative, repeatable infrastructure provisioning |
| **GKE (Kubernetes)** | Orchestration | Deploy, Operate | Self-healing, auto-scaling, rolling deployments, service discovery |
| **Helm** | Package Manager | Deploy | Deploys NGINX, cert-manager, Prometheus, Grafana as versioned charts |
| **NGINX Ingress** | Routing | Deploy, Operate | L7 reverse proxy — routes external traffic, terminates TLS |
| **cert-manager** | Certificate Mgmt | Deploy, Operate | Automates TLS certificate lifecycle (issue + renew) |
| **Let's Encrypt** | Certificate Authority | Deploy, Operate | Free, automated CA — issues 90-day DV certificates via ACME |
| **Kubernetes Secrets** | Secrets Management | Deploy, Operate | Injects credentials into pods at runtime without baking into images |
| **NetworkPolicy** | Network Security | Operate | Restricts pod-to-pod traffic — app only reachable from NGINX + Prometheus |
| **HPA** | Auto-scaling | Operate | Scales pods 2–10 based on CPU/memory — handles traffic spikes |
| **Liveness/Readiness Probes** | Health Checking | Operate | Auto-restart unhealthy pods, gate traffic to ready pods only |
| **Prometheus** | Metrics | Monitor | Scrapes and stores time-series metrics from app, nodes, and K8s |
| **Grafana** | Dashboards | Monitor | Visualises Prometheus data — dashboards for K8s, app, business metrics |
| **Blackbox Exporter** | Availability Probing | Monitor | Active HTTP probes — measures what an external user actually sees |
| **PrometheusRule** | Alerting | Respond | 8 alert rules covering availability, latency, errors, and pod health |
| **Alertmanager** | Alert Routing | Respond | Routes alerts to email — CRITICAL and WARNING channels, with resolution |
| **GCS Backend** | State Management | Deploy | Shared Terraform state in Google Cloud Storage — team-safe, versioned |
| **GCP IAM** | Access Control | Deploy, Operate | Least-privilege service accounts for CI/CD and cluster access |

---

## Database Schema Map

```
  SUPABASE (PostgreSQL)
  ─────────────────────

  customers ──────────────────────────────────────────────┐
  ├── id (uuid PK)                                         │
  ├── name                                                 │
  ├── email                                                │
  └── phone                                                │
                                                           │ customer_id FK
  cars                                                     │
  ├── id (uuid PK)                                         ├────── sales
  ├── make / model / year                                  │       ├── id
  ├── mileage / price                                      │       ├── car_id FK ──── cars
  ├── image_url / image_hint                               │       ├── customer_id FK
  └── status: Available│Sold│Rented│Reserved               │       ├── sale_date
       │                                                   │       └── price
       │ car_id FK                                         │
       ├────── test_drives                                 ├────── rentals
       │       ├── id                                      │       ├── id
       │       ├── customer_id FK ─────────────────────────┘       ├── car_id FK
       │       ├── date                                             ├── customer_id FK
       │       └── status                                           ├── start_date / end_date
       │                                                             ├── total_fee
       └────── appointments                                          └── status: Active│Completed
               ├── id
               ├── customer_id FK
               ├── date
               └── status

  Stored function: record_sale(car_id, customer_id, price, sale_date)
  └── Atomic transaction: INSERT sales + UPDATE cars.status = 'Sold'
```

---

## Terraform State Map

```
  LOCAL (your machine)              REMOTE (GCS)
  ────────────────────              ────────────
  infrastructure/terraform/         gs://autohub2-496117-terraform-state/
  ├── main.tf                       └── terraform/state/
  ├── variables.tf                      └── default.tfstate  ← live state
  ├── providers.tf                          (versioned, team-shared)
  ├── outputs.tf
  └── terraform.tfvars (gitignored)

  terraform init   → connects to GCS backend
  terraform plan   → shows diff vs GCS state
  terraform apply  → creates/updates resources, writes new state to GCS
  terraform destroy → tears down all resources, updates GCS state
```
