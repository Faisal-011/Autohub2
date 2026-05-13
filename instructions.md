# AutoHub Manager — Deployment & Operations Guide

## Current State

All workloads are **stopped** (scaled to 0). The GKE cluster is still running (nodes are up) but no pods are active. See below to start everything back up.

---

## Infrastructure Reference

| Resource | Value |
|---|---|
| GCP Project | `autohub2-496117` |
| Region | `us-central1` |
| GKE Cluster | `autohub-cluster` |
| Docker image | `us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4` |
| Nginx Ingress IP | `35.223.135.76` |
| Grafana IP | `35.225.14.91` |
| App URL (HTTPS) | https://35.223.135.76.nip.io |
| TLS Certificate | Let's Encrypt — already issued |

---

## START THE APP — Run These Commands

> The cluster is already provisioned. These commands restart everything from stopped state.

### Step 1 — Authenticate and connect

```bash
gcloud auth login
gcloud config set project autohub2-496117
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 --project autohub2-496117
```

Verify nodes are up: `kubectl get nodes`

### Step 2 — Start the app

```bash
kubectl scale deployment autohub-deployment --replicas=2 -n default
kubectl rollout status deployment/autohub-deployment
```

App is live at: **https://35.223.135.76.nip.io**

### Step 3 — Start the nginx ingress

```bash
kubectl scale deployment ingress-nginx-controller --replicas=1 -n ingress-nginx
```

### Step 4 — Start monitoring (Prometheus + Grafana + Blackbox)

```bash
# Deployments
kubectl scale deployment kube-prometheus-stack-grafana --replicas=1 -n monitoring
kubectl scale deployment kube-prometheus-stack-operator --replicas=1 -n monitoring
kubectl scale deployment kube-prometheus-stack-kube-state-metrics --replicas=1 -n monitoring
kubectl scale deployment blackbox-exporter-prometheus-blackbox-exporter --replicas=1 -n monitoring

# Statefulsets
kubectl scale statefulset prometheus-kube-prometheus-stack-prometheus --replicas=1 -n monitoring
kubectl scale statefulset alertmanager-kube-prometheus-stack-alertmanager --replicas=1 -n monitoring

# Node exporter daemonset (re-enable on all nodes)
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  --type=json \
  -p='[{"op":"remove","path":"/spec/template/spec/nodeSelector/non-existing"}]'
```

Wait ~60 seconds, then verify: `kubectl get pods -n monitoring`

---

## STOP THE APP — Shut Everything Down

```bash
# App
kubectl scale deployment autohub-deployment --replicas=0 -n default

# Ingress
kubectl scale deployment ingress-nginx-controller --replicas=0 -n ingress-nginx

# Monitoring deployments
kubectl scale deployment kube-prometheus-stack-grafana --replicas=0 -n monitoring
kubectl scale deployment kube-prometheus-stack-operator --replicas=0 -n monitoring
kubectl scale deployment kube-prometheus-stack-kube-state-metrics --replicas=0 -n monitoring
kubectl scale deployment blackbox-exporter-prometheus-blackbox-exporter --replicas=0 -n monitoring

# Monitoring statefulsets
kubectl scale statefulset prometheus-kube-prometheus-stack-prometheus --replicas=0 -n monitoring
kubectl scale statefulset alertmanager-kube-prometheus-stack-alertmanager --replicas=0 -n monitoring

# Node exporter daemonset
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  -p '{"spec":{"template":{"spec":{"nodeSelector":{"non-existing":"true"}}}}}'
```

> This stops all workloads but keeps the cluster and infrastructure intact. Restart anytime with the START commands above.

---

## How to Access Monitoring

### Grafana

1. Start Grafana (Step 4 above)
2. Wait ~30 seconds for the pod to be ready: `kubectl get pods -n monitoring | grep grafana`
3. Open **http://35.225.14.91** in your browser
4. Login — **Username:** `admin` / **Password:** `changeme`
5. Go to **Explore** → select **Prometheus** datasource → query:
   - `up{job="autohub-nextjs"}` — confirms app is being scraped (should be `1`)
   - `http_requests_total` — total HTTP requests
   - `db_query_duration_seconds` — Supabase query latency
   - `db_errors_total` — database errors
   - `business_events_total` — sales and rental counts

### Prometheus UI

Prometheus has no external IP — use port-forward:

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
```

Open **http://localhost:9090**

Go to **Status → Targets** → look for `autohub-nextjs` — it should show `UP`.

### Blackbox Exporter

```bash
kubectl port-forward -n monitoring svc/blackbox-exporter-prometheus-blackbox-exporter 9115:9115
```

Open **http://localhost:9115** — probes `/`, `/api/health`, `/api/metrics` every 15s.

---

## App Endpoints (when running)

| Endpoint | Description |
|---|---|
| `https://35.223.135.76.nip.io` | Main app |
| `https://35.223.135.76.nip.io/api/health` | Health check — returns `{"status":"healthy"}` |
| `https://35.223.135.76.nip.io/api/metrics` | Prometheus metrics |

---

## Rebuild and Push a New Docker Image

Always use `--platform linux/amd64` — GKE nodes are AMD64, Macs are ARM.

```bash
cd /path/to/Autohub2

docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4 .

docker push us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4

# Update the running deployment
kubectl set image deployment/autohub-deployment \
  autohub=us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4

kubectl rollout status deployment/autohub-deployment
```

---

## Local Development (no cloud needed)

```bash
npm install
npm run dev
# App at http://localhost:9003
```

Environment:
- `.env.local` — Supabase URL + anon key
- `.env` — Gemini API key

---

## Provision from Scratch (cluster doesn't exist)

Only run this if the cluster was fully destroyed.

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project autohub2-496117
gcloud auth application-default login

# 2. Provision cluster and core infrastructure
cd infrastructure/terraform
terraform init
terraform apply

# 3. Connect kubectl
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 --project autohub2-496117

# 4. Apply Let's Encrypt issuer (after nginx gets its IP — check with kubectl get svc -n ingress-nginx)
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml

# 5. Deploy monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values monitoring/prometheus-values.yaml

helm upgrade --install blackbox-exporter \
  prometheus-community/prometheus-blackbox-exporter \
  --namespace monitoring \
  --values monitoring/blackbox-values.yaml

kubectl apply -f monitoring/scrape-config.yaml
kubectl apply -f monitoring/blackbox-scrape.yaml
```

> **Important after fresh terraform apply:** The nginx ingress will get a new IP. Update `domain` in `infrastructure/terraform/terraform.tfvars` and `infrastructure/k8s/ingress.yaml` to `<new-nginx-ip>.nip.io`, then re-apply the ingress and cluster-issuer.

---

## Tear Down Everything

```bash
cd infrastructure/terraform
terraform destroy
```

Supabase data is unaffected.

---

## Troubleshooting

**Pods in ImagePullBackOff**
`kubectl describe pod <pod-name>` — two common causes:
- `no match for platform` → built on Mac (ARM). Fix: rebuild with `--platform linux/amd64`
- `not found` → tag missing in registry. Fix: rebuild and push

**Certificate not issuing**
```bash
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml
kubectl delete certificate autohub-tls && kubectl delete secret autohub-tls
# wait 30s then check
kubectl get certificate
```

**Grafana shows no autohub metrics**
Check Prometheus is scraping: `kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090` → http://localhost:9090/targets

**kubectl: no current context**
Run Step 1 (get-credentials) above.
