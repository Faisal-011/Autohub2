# AutoHub — Operations Guide

## Current State

Cluster exists, all workloads scaled to 0, node pool at 0 nodes. **No VMs are running — billing is minimal (GKE control plane ~$0.10/hr).**
To bring everything back, follow **START THE APP (Terraform)** below.

---

## Infrastructure Reference

| Resource | Value |
|---|---|
| GCP Project | `autohub2-496117` |
| GCP Account | `timothyroshchild@gmail.com` |
| Region | `us-central1` |
| GKE Cluster | `autohub-cluster` |
| Node Pool | `autohub-node-pool` (1 node/zone, 3 zones) |
| Docker Image | `us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4` |
| App URL | `https://35.192.141.65.nip.io` |
| Grafana URL | `http://35.254.80.206` — `admin` / `Qurrain` |
| Terraform state | GCS bucket `autohub2-496117-terraform-state` |

---

## RUN LOCALLY (no cloud needed)

```bash
# Install deps
npm install

# Start dev server
npm run dev
# App runs at http://localhost:9003

# Run tests
npm test

# Type check
npm run typecheck
```

Environment files needed:
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `.env` — `GEMINI_API_KEY`

Check it's working:
```bash
curl http://localhost:9003/api/health
# → {"status":"healthy","services":{"database":"up"}}
```

---

## START THE APP (Terraform)

### If cluster exists but is scaled down (normal case — current state)

```bash
# 1. Authenticate
gcloud config set account timothyroshchild@gmail.com
gcloud auth application-default login

# 2. Scale the node pool back up
gcloud container clusters resize autohub-cluster \
  --node-pool autohub-node-pool \
  --num-nodes 1 \
  --region us-central1 \
  --project autohub2-496117

# Wait ~3 min for nodes to be Ready
kubectl get nodes --watch

# 3. Re-apply Terraform to restore all workloads
cd infrastructure/terraform
export TF_VAR_grafana_password="Qurrain"
terraform apply -auto-approve

# 4. Restore monitoring statefulsets (Terraform doesn't manage replica count)
kubectl scale statefulset prometheus-kube-prometheus-stack-prometheus -n monitoring --replicas=1
kubectl scale statefulset alertmanager-kube-prometheus-stack-alertmanager -n monitoring --replicas=1

# 5. Restore node-exporter daemonset
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  --type=json \
  -p='[{"op":"remove","path":"/spec/template/spec/nodeSelector/non-existing"}]'

# 6. Verify everything is up
kubectl get pods -n default
kubectl get pods -n monitoring
curl https://35.192.141.65.nip.io/api/health
```

> The nginx ingress IP should stay the same (`35.192.141.65`) as long as the cluster is not destroyed. If it changes, update `domain` in `terraform.tfvars` and re-apply (see Fresh Provisioning below).

---

### If cluster is fully destroyed (fresh provisioning)

```bash
# 1. Authenticate
gcloud config set account timothyroshchild@gmail.com
gcloud auth application-default login

# 2. Phase 1 — create GKE cluster and node pool only
cd infrastructure/terraform
export TF_VAR_grafana_password="Qurrain"

terraform apply \
  -target=google_container_cluster.autohub_cluster \
  -target=google_container_node_pool.primary_nodes \
  -auto-approve

# 3. Connect kubectl to the new cluster
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 --project autohub2-496117

# 4. Phase 2 — deploy everything (app, monitoring, ingress, certs)
terraform apply -auto-approve

# 5. Get the new nginx ingress IP
kubectl get svc ingress-nginx-controller -n ingress-nginx

# 6. Update domain to the new IP
# Edit infrastructure/terraform/terraform.tfvars:
#   domain = "<new-ip>.nip.io"
# Also edit infrastructure/k8s/ingress.yaml with the same IP
# Then re-apply:
terraform apply -auto-approve

# 7. Apply Let's Encrypt issuer (not managed by Terraform)
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml

# 8. Apply alerting rules, alertmanager config, and blackbox probe
kubectl apply -f infrastructure/k8s/prometheus-rules.yaml
kubectl apply -f infrastructure/k8s/alertmanager-config.yaml

kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: Probe
metadata:
  name: autohub-blackbox
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  interval: 30s
  module: http_2xx
  prober:
    url: blackbox-exporter-prometheus-blackbox-exporter.monitoring.svc:9115
  targets:
    staticConfig:
      static:
        - https://<new-ip>.nip.io
        - https://<new-ip>.nip.io/api/health
        - https://<new-ip>.nip.io/api/metrics
EOF

# 9. Verify
kubectl get pods -n default
kubectl get pods -n monitoring
curl https://<new-ip>.nip.io/api/health
```

> Every fresh cluster gets a new nginx IP. You must update `domain` in `terraform.tfvars` AND `ingress.yaml` and re-apply before HTTPS/TLS works.

---

## STOP THE APP (scale to 0, keep cluster)

Stops all billing except GKE control plane (~$0.10/hr).

```bash
# Scale all workloads to 0
kubectl scale deployment autohub-deployment --replicas=0
kubectl scale deployment -n monitoring --all --replicas=0
kubectl scale statefulset -n monitoring --all --replicas=0
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  -p '{"spec":{"template":{"spec":{"nodeSelector":{"non-existing":"true"}}}}}'

# Scale node pool to 0 (stops VM billing)
gcloud container clusters resize autohub-cluster \
  --node-pool autohub-node-pool \
  --num-nodes 0 \
  --region us-central1 \
  --project autohub2-496117
```

---

## DESTROY EVERYTHING (zero billing)

```bash
cd infrastructure/terraform
export TF_VAR_grafana_password="Qurrain"
terraform destroy -auto-approve
```

Supabase data and Firebase data are unaffected — only GKE infrastructure is removed.

---

## CHECK STATS

### App health (live check)
```bash
curl https://35.192.141.65.nip.io/api/health
# → {"status":"healthy","services":{"database":"up"}}
```

### Pod status
```bash
kubectl get pods -n default          # app pods
kubectl get pods -n monitoring       # Prometheus, Grafana, Alertmanager
kubectl get nodes                    # cluster nodes
kubectl get hpa                      # autoscaler status (CPU/memory %)
```

### Prometheus (all metrics + targets)
```bash
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
# Open http://localhost:9090
# Status → Targets: check autohub-nextjs is UP
# Useful queries:
#   probe_success                          — blackbox probe results (1=up, 0=down)
#   http_requests_total                    — request counts by route/status
#   http_request_duration_seconds          — latency histograms
#   db_errors_total                        — Supabase error counts
#   db_query_duration_seconds              — DB query latency
#   business_events_total                  — sales/rental event counts
```

### Grafana (dashboards)
```
URL:      http://35.254.80.206
Username: admin
Password: Qurrain
```
Prometheus datasource is pre-configured. Go to **Explore → Prometheus** and run any query above.

> Note: Grafana's external IP may change after a fresh cluster provision. Run `kubectl get svc kube-prometheus-stack-grafana -n monitoring` to get the current IP.

### Blackbox probe status (live app uptime)
```bash
# Via Prometheus query:
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
curl -s "http://localhost:9090/api/v1/query?query=probe_success" | python3 -m json.tool
# probe_success = 1 means UP, 0 means DOWN
# Targets: https://35.192.141.65.nip.io, /api/health, /api/metrics
```

### Alert rules
```bash
kubectl get prometheusrule -n monitoring   # lists all rule groups
# autohub-alerts covers: availability, performance, database, pods
# Firing alerts → email sent to qsirius12@gmail.com
```

---

## CI/CD (automatic on push to main)

Every push to `main` branch automatically:
1. Runs `typecheck` + all 15 tests
2. Builds Docker image
3. Runs Trivy security scan (blocks on CRITICAL/HIGH CVEs)
4. Pushes to Google Artifact Registry
5. Deploys to GKE via `kubectl set image`

No manual steps needed for app updates — just push to `main`.

---

## Rebuild Docker Image Manually

Only needed if CI/CD is not working.

```bash
# Must use --platform linux/amd64 — GKE is AMD64, Macs are ARM
docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v5 .

docker push us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v5

kubectl set image deployment/autohub-deployment \
  autohub=us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v5

kubectl rollout status deployment/autohub-deployment
```

---

## Troubleshooting

**Pods in ImagePullBackOff**
```bash
kubectl describe pod <pod-name>
# "no match for platform" → rebuilt with --platform linux/amd64
# "not found" → tag missing, rebuild and push
```

**HTTPS not working / certificate not issuing**
```bash
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml
kubectl delete certificate autohub-tls
kubectl delete secret autohub-tls 2>/dev/null
# Wait 60s then:
kubectl get certificate   # READY should become True
# If still failing, the domain in terraform.tfvars may not match the nginx IP
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

**No metrics in Grafana / Prometheus**
```bash
# Check Prometheus is scraping the app
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
# http://localhost:9090/targets → look for autohub-nextjs = UP
```

**kubectl: no current context**
```bash
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 --project autohub2-496117
```

**Grafana password forgotten**
```
Password: Qurrain
```
