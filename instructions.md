# AutoHub — Operations Guide

## Current State

**Cluster exists. Node pool at 0 nodes. All workloads scaled to 0.**
No VMs running — billing is GKE control plane only (~$0.10/hr).
To bring everything back, follow **START THE APP** below.

---

## Infrastructure Reference

| Resource | Value |
|---|---|
| GCP Project | `autohub2-496117` |
| GCP Account | `timothyroshchild@gmail.com` |
| Region | `us-central1` |
| GKE Cluster | `autohub-cluster` |
| Node Pool | `autohub-node-pool` |
| Docker Image | `us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:v4` |
| App URL (HTTPS) | `https://35.192.141.65.nip.io` |
| Grafana URL | `http://35.254.80.206` |
| Grafana Login | `admin` / `Qurrain` |
| Terraform state | GCS bucket `autohub2-496117-terraform-state` |

---

## RUN LOCALLY (no cloud needed)

```bash
# Install deps (first time only)
npm install

# Start dev server
npm run dev
# App runs at http://localhost:9003

# Run tests
npm test

# Type check
npm run typecheck
```

**Required env files** (already present, do not commit):
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `.env` — `GEMINI_API_KEY`

Verify it's working:
```bash
curl http://localhost:9003/api/health
# → {"status":"healthy","services":{"database":"up"}}
```

---

## IS TERRAFORM READY TO USE?

**Yes — fully configured.** `infrastructure/terraform/terraform.tfvars` already contains all required values: GCP project, region, image, domain, Supabase keys, Gemini key. It is gitignored (never committed).

**One caveat:** The node pool has `lifecycle { ignore_changes = all }`, so Terraform cannot scale nodes up or down. You must always manually resize the node pool first (one `gcloud` command), then run `terraform apply` to restore the workloads.

Everything else — the app deployment, service, ingress, HTTPS, monitoring stack, HPA, network policies — is fully managed by Terraform.

---

## START THE APP (HTTPS on GKE)

### Normal start (cluster exists, currently scaled down — this is the usual case)

```bash
# 1. Authenticate
gcloud config set account timothyroshchild@gmail.com
gcloud auth application-default login

# 2. Scale the node pool back up (Terraform cannot do this)
gcloud container clusters resize autohub-cluster \
  --node-pool autohub-node-pool \
  --num-nodes 1 \
  --region us-central1 \
  --project autohub2-496117

# Wait ~3 min for nodes to become Ready
kubectl get nodes --watch

# 3. Re-apply Terraform to restore all workloads
cd infrastructure/terraform
export TF_VAR_grafana_password="Qurrain"
terraform apply -auto-approve

# 4. Restore monitoring statefulsets (Terraform doesn't track replica count)
kubectl scale statefulset prometheus-kube-prometheus-stack-prometheus \
  -n monitoring --replicas=1
kubectl scale statefulset alertmanager-kube-prometheus-stack-alertmanager \
  -n monitoring --replicas=1

# 5. Restore node-exporter daemonset
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  --type=json \
  -p='[{"op":"remove","path":"/spec/template/spec/nodeSelector/non-existing"}]'

# 6. Verify everything is running
kubectl get pods -n default
kubectl get pods -n monitoring
curl https://35.192.141.65.nip.io/api/health
```

The nginx ingress IP stays the same (`35.192.141.65`) as long as the cluster is not destroyed.

---

### Fresh provisioning (cluster was fully destroyed)

```bash
# 1. Authenticate
gcloud config set account timothyroshchild@gmail.com
gcloud auth application-default login

# 2. Phase 1 — create cluster and node pool only
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
# Note the EXTERNAL-IP — this is your new app IP

# 6. Update domain to the new IP (do this if IP changed)
# Edit infrastructure/terraform/terraform.tfvars:
#   domain = "<new-ip>.nip.io"
# Edit infrastructure/k8s/ingress.yaml with the same IP
# Then re-apply:
terraform apply -auto-approve

# 7. Apply Let's Encrypt issuer (not managed by Terraform)
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml

# 8. Apply alerting rules and alertmanager config
kubectl apply -f infrastructure/k8s/prometheus-rules.yaml
kubectl apply -f infrastructure/k8s/alertmanager-config.yaml

# 9. Apply blackbox probes (update <new-ip> first)
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

# 10. Verify
kubectl get pods -n default
kubectl get pods -n monitoring
curl https://<new-ip>.nip.io/api/health
```

Every fresh cluster gets a new nginx IP. Update `domain` in `terraform.tfvars` AND `ingress.yaml` before HTTPS/TLS will work.

---

## STOP THE APP (scale to 0 — keeps cluster, stops VM billing)

```bash
# Scale all workloads to 0
kubectl scale deployment autohub-deployment --replicas=0
kubectl scale deployment -n monitoring --all --replicas=0
kubectl scale statefulset -n monitoring --all --replicas=0
kubectl patch daemonset kube-prometheus-stack-prometheus-node-exporter \
  -n monitoring \
  -p '{"spec":{"template":{"spec":{"nodeSelector":{"non-existing":"true"}}}}}'

# Scale node pool to 0 (stops VM billing entirely)
gcloud container clusters resize autohub-cluster \
  --node-pool autohub-node-pool \
  --num-nodes 0 \
  --region us-central1 \
  --project autohub2-496117
```

After this: only GKE control plane is billed (~$0.10/hr). The nginx load balancer IP is preserved.

---

## DESTROY EVERYTHING (zero billing)

```bash
cd infrastructure/terraform
export TF_VAR_grafana_password="Qurrain"
terraform destroy -auto-approve
```

**Supabase and Firebase data are unaffected** — only GKE infrastructure is removed.
After destroy, the nginx IP will be a different address on the next fresh provision.

---

## MONITOR

### App health
```bash
curl https://35.192.141.65.nip.io/api/health
# → {"status":"healthy","services":{"database":"up"}}
```

### Pod and cluster status
```bash
kubectl get pods -n default          # app pods
kubectl get pods -n monitoring       # Prometheus, Grafana, Alertmanager
kubectl get nodes                    # node pool status
kubectl get hpa                      # autoscaler (shows CPU/memory %)
```

### Grafana (dashboards)
```
URL:      http://35.254.80.206
Username: admin
Password: Qurrain
```
Prometheus datasource is pre-configured. Go to **Explore → Prometheus** and run any query.

> Grafana's external IP may change after a fresh cluster provision.
> Run `kubectl get svc kube-prometheus-stack-grafana -n monitoring` to get the current IP.

### Prometheus (raw metrics + targets)
```bash
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
# Open http://localhost:9090
# Status → Targets: check autohub-nextjs is UP
```

Useful Prometheus queries:
```
probe_success                        # blackbox results: 1=up, 0=down
http_requests_total                  # request counts by route/status
http_request_duration_seconds        # latency histograms
db_errors_total                      # Supabase error counts
db_query_duration_seconds            # DB query latency
business_events_total                # sales/rental event counts
```

### Alert rules
```bash
kubectl get prometheusrule -n monitoring
# autohub-alerts covers: availability, performance, database, pods
# Firing alerts → email sent to qsirius12@gmail.com
```

### Blackbox probe status
```bash
kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090
curl -s "http://localhost:9090/api/v1/query?query=probe_success" | python3 -m json.tool
# probe_success = 1 → UP, 0 → DOWN
```

---

## CI/CD (automatic on push to main)

Every push to `main` automatically:
1. Runs `typecheck` + all 15 tests
2. Builds Docker image (`--platform linux/amd64`)
3. Runs Trivy security scan (blocks on CRITICAL/HIGH CVEs)
4. Pushes to Google Artifact Registry
5. Deploys to GKE via `kubectl set image`

No manual steps needed for app code updates — just push to `main`.

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

Then update `image` in `terraform.tfvars` to the new tag so the next `terraform apply` uses it.

---

## Troubleshooting

**Pods in ImagePullBackOff**
```bash
kubectl describe pod <pod-name>
# "no match for platform" → rebuild with --platform linux/amd64
# "not found" → tag missing, rebuild and push
```

**HTTPS not working / certificate not issuing**
```bash
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml
kubectl delete certificate autohub-tls
kubectl delete secret autohub-tls 2>/dev/null
# Wait 60s, then:
kubectl get certificate   # READY should become True
# If still failing: domain in terraform.tfvars may not match the nginx IP
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

**No metrics in Grafana / Prometheus**
```bash
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
