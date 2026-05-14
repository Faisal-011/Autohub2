# DevSecOps Mapping — AutoHub2

Maps every tool, practice, and decision in this project to the DevSecOps cycle phase it belongs to, with the reasoning behind each choice.

---

## The Cycle at a Glance

```
  PLAN ──► CODE ──► BUILD ──► TEST ──► RELEASE ──► DEPLOY ──► OPERATE ──► MONITOR
    │         │        │         │          │           │           │           │
    └─────────┴────────┴─────────┴──────────┴───────────┴───────────┴───────────┘
                              SECURITY woven through every phase
```

---

## Phase 1 — PLAN

> Define what gets built, how it runs, and who owns what.

| Tool / Artifact | Role | Why |
|---|---|---|
| `ARCHITECTURE.md` | Full system map — every tool, every data flow, DevSecOps alignment | Forces upfront design decisions; avoids "build first, document never" drift |
| `instructions.md` | Operational runbook — how to start, stop, rebuild, debug | Ops knowledge shouldn't live in one person's head |
| `devops_mapping.md` (this file) | Explicit tool-to-phase traceability | Makes audit and onboarding straightforward |
| Terraform variable design | Separate `variables.tf` from `terraform.tfvars` (gitignored) | Secrets never enter version control by design, not by discipline |
| GitHub branch strategy | `main` triggers deploy; feature branches do not | Prevents accidental production deploys from in-progress work |

**Security angle:** Planning is where secrets hygiene, blast radius, and least-privilege are decided — not patched in later.

---

## Phase 2 — CODE

> Write application logic with security and observability built in from the start.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Next.js 15 (App Router)** | Full-stack React framework | Server components reduce client-side attack surface; standalone output enables minimal Docker images |
| **TypeScript (strict)** | Static type checking across the entire codebase | Catches a class of bugs (null dereference, wrong shape) before they reach production |
| **Supabase (PostgreSQL)** | Managed database with Row Level Security | RLS enforces access control at the data layer — app bugs can't bypass it |
| **Google Genkit + Gemini 2.5 Flash** | AI car recommendation engine | Genkit provides structured prompt flow with typed I/O, reducing prompt injection risk |
| **prom-client** | Custom Prometheus metrics instrumented in application code | Observability at the code level: `http_requests_total`, `db_errors_total`, `business_events_total`, latency histograms |
| **Firebase removal** | Deleted 11 dead Firebase files entirely | Dead code is attack surface; removing it reduced dependency count and eliminated a misconfigured credential risk |
| **`/api/health` endpoint** | Liveness/readiness check returning `{"status":"healthy"}` | Kubernetes probes need a reliable signal that doesn't touch the database unnecessarily |
| **`/api/metrics` endpoint** | Prometheus scrape target | Exposes prom-client registry over HTTP for Prometheus to pull |

**Security angle:** Supabase RLS, TypeScript strictness, and removing dead code all reduce the exploitable surface before a single line is deployed.

---

## Phase 3 — BUILD

> Turn source code into a reproducible, minimal, auditable artifact.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Docker (multi-stage build)** | Three-stage build: `deps` → `builder` → `runner` | Each stage discards build tools; final image contains only the runtime — no npm, no compiler, no source maps |
| **`node:18-alpine` base image** | Minimal Linux base | Alpine is ~5 MB vs ~900 MB for full Debian; fewer packages = fewer CVEs |
| **`USER node` (non-root)** | Container runs as unprivileged user | If the process is compromised, the attacker has no root access inside the container |
| **`output: "standalone"` in next.config.ts** | Next.js bundles only what's needed | Produces a self-contained server with no `node_modules` copy — smaller image, faster pull |
| **Google Artifact Registry (GAR)** | Private Docker registry inside GCP | Images never leave GCP's network on their way to GKE; no Docker Hub credentials needed in production |
| **GitHub Actions (`build-and-push` job)** | CI pipeline — build, scan, push | Automated, reproducible builds: no "works on my machine" images reaching production |
| **`--platform linux/amd64` flag** | Forces AMD64 build on Apple Silicon Macs | GKE nodes are AMD64; ARM images fail silently at runtime |

**Security angle:** Non-root user, minimal base, and private registry are all supply-chain hardening decisions — they limit what an attacker can do even if a vulnerability exists in application code.

---

## Phase 4 — TEST

> Verify correctness before anything ships.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Vitest** | Unit test runner (15 tests across 3 files) | Fast, TypeScript-native, compatible with the existing Next.js/Vite toolchain |
| **`src/tests/utils.test.ts`** | 6 tests for `cn()` className utility | Validates the shared utility used across all UI components |
| **`src/tests/types.test.ts`** | 5 tests for Car, Customer, Sale, Rental type shapes | Verifies domain model contracts don't silently break |
| **`src/tests/metrics.test.ts`** | 4 tests for Prometheus counter/histogram registration | Confirms observability instrumentation is wired correctly — a broken metrics endpoint would blind the monitoring stack |
| **`npm run typecheck` (tsc)** | Full TypeScript type check with no `ignoreBuildErrors` escape hatch | Previously `next.config.ts` had `ignoreBuildErrors: true` — this was removed so type errors actually fail the build |
| **`npm run build`** | Production Next.js build | Catches import errors, missing env vars, and bundle issues that tests don't cover |
| **`vitest.config.ts`** | Test configuration with jsdom environment and `@` path alias | Mirrors production config so tests run in the same module resolution context |

**Security angle:** The metrics tests specifically guard against silent observability failure — if the metrics endpoint breaks, alerts won't fire.

---

## Phase 5 — RELEASE (Security Gate)

> Scan the artifact for vulnerabilities before it can ever be deployed.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Trivy (aquasecurity/trivy-action)** | Container image vulnerability scanner | Scans the built image for CRITICAL and HIGH CVEs before the push step; `exit-code: 1` means a vulnerable image blocks the entire pipeline |
| **`ignore-unfixed: true`** | Trivy flag — only fails on CVEs with available fixes | Avoids blocking on CVEs where no patch exists yet; focuses effort on actionable findings |
| **GAR image tagging** | `:sha` (immutable) + `:latest` (floating) | SHA tag gives exact traceability of what's running in production; `latest` gives a predictable pull target |
| **GitHub Actions secrets** | `GCP_SA_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc. | Credentials never appear in workflow YAML or logs; GitHub encrypts them at rest |
| **GCP Service Account (`github-actions-deployer`)** | IAM identity for CI/CD | Least-privilege: only `container.developer` + `artifactregistry.writer` — cannot touch billing, IAM, or other services |

**Security angle:** Trivy is the hard gate between "built" and "deployed." A critical vulnerability cannot reach production without explicitly being bypassed.

---

## Phase 6 — DEPLOY

> Provision infrastructure as code; deploy the application repeatably.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Terraform** | Infrastructure as Code for all GCP + Kubernetes resources | Every resource is declarative and version-controlled; no manual console clicks that can't be reviewed or reproduced |
| **GCS backend (`autohub2-496117-terraform-state`)** | Remote Terraform state storage | State is shared, locked, and survives a laptop wipe; GCS object versioning protects against accidental state corruption |
| **GKE (Google Kubernetes Engine)** | Managed Kubernetes cluster | GKE handles control plane patching, node auto-repair, and auto-upgrade — reducing ops toil for security patches |
| **`e2-medium` nodes × 2** | GKE node pool | Right-sized for a demo/portfolio workload; 2 nodes enable pod anti-affinity and rolling deploys without downtime |
| **Helm (NGINX Ingress Controller)** | Layer 7 HTTP routing into the cluster | Single entry point for all traffic; TLS termination at the edge; routes requests to the correct service |
| **Helm (cert-manager)** | Automatic TLS certificate lifecycle | Provisions and renews Let's Encrypt certificates without manual intervention |
| **Let's Encrypt (ACME HTTP-01)** | Free, trusted TLS certificates via nip.io | HTTPS everywhere, no self-signed certs, no certificate purchase |
| **`kubectl set image` in CI** | Rolling image update on deploy | Zero-downtime deploys: Kubernetes replaces pods one at a time, health-checking each before continuing |
| **`kubectl rollout status --timeout=120s`** | Deployment verification | CI fails fast if the new image doesn't become healthy within 2 minutes — catches broken images before they fully roll out |

**Security angle:** IaC means the infrastructure state is auditable in git. GCS remote state prevents two people running `terraform apply` simultaneously and corrupting state. TLS everywhere means no credentials or session tokens travel in plaintext.

---

## Phase 7 — OPERATE

> Keep the application healthy, resilient, and appropriately isolated at runtime.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Liveness probe (`/api/health`)** | Kubernetes restarts the pod if it stops responding | Prevents a hung process from silently serving no traffic while appearing "running" |
| **Readiness probe (`/api/health`)** | Kubernetes withholds traffic until the pod is ready | New pods don't receive requests until the app is fully initialised — avoids 502s during rolling deploys |
| **HPA (Horizontal Pod Autoscaler)** | Min 2 replicas, max 10, CPU 70% / Memory 80% | Automatically scales out under load; min 2 ensures no single point of failure |
| **NetworkPolicy** | Restricts pod-to-pod traffic to ingress-nginx and monitoring namespaces only | Limits blast radius: if a pod is compromised, it cannot freely reach other pods in the cluster |
| **Kubernetes Secrets** | Supabase URL/key and Gemini key injected as env vars via `envFrom` | Secrets are not baked into the image or passed as plain args; visible only to the pod that needs them |
| **`grafana_password` as sensitive Terraform variable** | Grafana admin password set via `TF_VAR_grafana_password` | Never hardcoded in `prometheus-values.yaml` or any committed file |
| **Resource requests and limits** | CPU/memory bounds on the autohub container | Prevents a runaway pod from starving other workloads; required for HPA to function |

**Security angle:** NetworkPolicy is the runtime equivalent of a firewall — it doesn't trust pods just because they're in the same cluster. Secrets injection means credentials are never embedded in images.

---

## Phase 8 — MONITOR

> Observe the system continuously; alert on anything that matters.

| Tool / Artifact | Role | Why |
|---|---|---|
| **Prometheus (kube-prometheus-stack)** | Metrics collection and storage | Pulls metrics from all targets on a 15s interval; stores time-series data for querying and alerting |
| **Grafana** | Metrics visualisation and dashboards | Human-readable view of Prometheus data; pre-built dashboards for Kubernetes cluster health |
| **Node Exporter** | Host-level metrics (CPU, memory, disk, network) per node | Infrastructure visibility below the Kubernetes layer |
| **kube-state-metrics** | Kubernetes object state metrics (pod phase, deployment replicas, HPA status) | Surfaces Kubernetes-level health that Prometheus alone doesn't see |
| **Blackbox Exporter** | Active HTTP probing of `/`, `/api/health`, `/api/metrics` every 15s | Synthetic monitoring — tests the app from outside, the way a real user would |
| **prom-client (custom metrics)** | `http_requests_total`, `http_request_duration_seconds`, `db_errors_total`, `db_query_duration_seconds`, `business_events_total` | Business and application-level observability that infrastructure metrics cannot provide |
| **PrometheusRule (8 alert rules)** | `AutoHubDown`, `HighRequestLatency`, `HighErrorRate`, `DatabaseErrorSpike`, `SlowDatabaseQueries`, `AutoHubPodCrashLooping`, `AutoHubLowReplicas`, `AutoHubHealthCheckFailing` | Every failure mode that matters has a named alert with a severity and a routing rule |
| **Alertmanager** | Alert routing, deduplication, grouping, silencing | Routes CRITICAL and WARNING alerts to Gmail; groups related alerts to prevent notification storms |
| **Gmail SMTP (App Password)** | Alert delivery channel | Actionable alerts reach a human inbox — not just a dashboard nobody watches |

**Security angle:** Monitoring is also a security control. `HighErrorRate` and `DatabaseErrorSpike` can surface active attacks (SQL injection attempts, credential stuffing). `AutoHubPodCrashLooping` can indicate a container being killed by a security policy.

---

## Security — Cross-Cutting Concerns

Security in DevSecOps is not a phase — it runs through all eight.

| Control | Phase(s) | What it protects |
|---|---|---|
| TypeScript strict mode | Code | Type confusion, null dereference bugs |
| Supabase Row Level Security | Code | Data access bypass even if app logic is wrong |
| Non-root Docker user (`USER node`) | Build | Privilege escalation if container is compromised |
| Minimal Alpine base image | Build | Reduced CVE exposure from OS packages |
| Trivy vulnerability scan | Release | Known CVEs in OS packages and app dependencies |
| Private GAR registry | Release, Deploy | Image tampering; no public pull of production images |
| Least-privilege GCP service account | Release, Deploy | Limits what a leaked CI credential can do |
| GitHub Actions secrets | Release | Credentials never in logs or YAML |
| `terraform.tfvars` gitignored | Deploy | Supabase/Gemini/Grafana credentials never committed |
| GCS Terraform state with locking | Deploy | State corruption, concurrent apply conflicts |
| TLS via Let's Encrypt | Deploy | Credentials and tokens in transit |
| Kubernetes Secrets (`envFrom`) | Operate | Credentials not baked into image or CLI args |
| NetworkPolicy | Operate | Lateral movement if a pod is compromised |
| `sensitive = true` on Terraform variables | Operate | Secrets redacted from `terraform plan` output |
| HPA minimum 2 replicas | Operate | Availability — no single pod is a single point of failure |
| Liveness + readiness probes | Operate | Zombie processes don't receive traffic |
| PrometheusRule alert: `AutoHubDown` | Monitor | Immediate notification of full service loss |
| PrometheusRule alert: `DatabaseErrorSpike` | Monitor | Early signal of data-layer attack or misconfiguration |

---

## CI/CD Pipeline Summary

```
git push → GitHub Actions
    │
    ├─ build-and-push (all branches to main + faisal/docker-containerization)
    │     ├── npm ci
    │     ├── npm run typecheck          ← type safety gate
    │     ├── npm test                   ← correctness gate
    │     ├── npm run build              ← build gate
    │     ├── docker build (amd64)
    │     ├── trivy scan                 ← security gate (blocks on CRITICAL/HIGH)
    │     └── docker push → GAR (:sha + :latest)
    │
    └─ deploy (main branch only)
          ├── gcloud auth (GCP service account)
          ├── get-gke-credentials
          ├── kubectl set image          ← rolling deploy
          └── kubectl rollout status     ← health verification
```

Every gate must pass before the next step runs. A failed test, type error, or CVE stops the pipeline — nothing broken reaches the cluster.

---

## Tool Selection Rationale Summary

| Tool | Chosen over | Reason |
|---|---|---|
| GKE | Self-managed K8s | Managed control plane, auto node repair, no etcd to operate |
| GAR | Docker Hub | Same GCP network as GKE; no cross-cloud credential management |
| Terraform | Helm-only / manual | Full IaC including GCP resources, not just K8s objects |
| GCS backend | Local state | Shared, locked, versioned — survives any local machine |
| cert-manager + Let's Encrypt | Manual TLS / paid certs | Zero-cost, fully automated, auto-renewing certificates |
| NGINX Ingress | GKE native Ingress | More control over routing; required for cert-manager HTTP-01 challenge |
| Supabase | Firebase | Firebase was dead code already in the repo; Supabase gives typed SQL with RLS |
| Vitest | Jest | Native TypeScript support; same Vite config as the app; faster |
| Trivy | Snyk / Grype | Free, container-native, integrates directly into GitHub Actions |
| prom-client | OpenTelemetry | Direct Prometheus integration without an OTel collector layer |
| kube-prometheus-stack | Individual installs | Single Helm chart installs Prometheus + Grafana + Alertmanager + exporters with sane defaults |
| nip.io | Custom domain | Free wildcard DNS over IP — no domain purchase needed for a portfolio project |
