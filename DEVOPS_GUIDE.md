# 🚀 Autohub DevOps Deployment Guide

This project deploys a full-stack application on **Google Kubernetes Engine (GKE)** using **Terraform**, **Docker**, and **Kubernetes**, with **HTTPS via cert-manager**.

---

# 🧠 Architecture Overview

```text
User → HTTPS → Ingress → Service → Pods (Next.js App)
                               ↓
                        Supabase + Gemini API
```

---

# 📦 Prerequisites

Install the following:

* Docker Desktop
* Terraform
* kubectl
* Google Cloud SDK

---

# 🔐 Step 1 — Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project autohub-project
```

---

# 🐳 Step 2 — Build & Push Docker Image

Go to project root (where Dockerfile exists):

```bash
cd Autohub2
```

Build for GKE (IMPORTANT: correct architecture):

```bash
docker buildx build \
  --platform linux/amd64 \
  -t your-docker-repo/autohub2:latest \
  . \
  --push
```

---

# ⚙️ Step 3 — Configure Secrets

Open `main.tf` and update:

```hcl
data = {
  NEXT_PUBLIC_SUPABASE_URL      = "https://your-project.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-supabase-key"
  GEMINI_API_KEY               = "your-gemini-key"
}
```

⚠️ Do NOT use `base64encode()` — Terraform handles encoding automatically.

---

# 🌍 Step 4 — Deploy Infrastructure

```bash
cd infrastructure/terraform

terraform init
terraform apply
```

Type:

```text
yes
```

---

# ☸️ Step 5 — Verify Deployment

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
kubectl get certificate
```

Expected:

* Pods → Running
* Certificate → READY = True

---

# 🌐 Step 6 — Access Application

Open:

```text
https://<external-ip>.nip.io
```

Example:

```text
https://34.55.30.20.nip.io
```

---

# 🧪 Debugging Guide

## Check logs

```bash
kubectl logs -l app=autohub
```

---

## Check environment variables

```bash
kubectl exec -it $(kubectl get pod -l app=autohub -o jsonpath="{.items[0].metadata.name}") -- printenv
```

---

## Common Issues

### ❌ ImagePullBackOff

Fix:

```text
Build with --platform linux/amd64
```

---

### ❌ Invalid supabaseUrl

Fix:

```text
Remove base64encode() from Terraform secret
```

---

### ❌ App works locally but fails in cluster

Fix:

```text
Next.js env variables must be available at build time
```

---

# 🔄 Updating the App

1. Build new version:

```bash
docker buildx build --platform linux/amd64 -t autohub2:v2 . --push
```

2. Update image in Terraform:

```hcl
image = ".../autohub2:v2"
```

3. Apply:

```bash
terraform apply
```

---

# 🔐 Security Notes

* Never commit API keys to Git
* Rotate keys if exposed
* Use `.tfvars` or secret managers in production

---

# 🎯 Final Result

```text
✔ Fully automated infrastructure (Terraform)
✔ Kubernetes deployment
✔ HTTPS enabled
✔ Scalable cloud application
```

---

# 🧠 Key Learnings

* Terraform manages infrastructure declaratively
* Kubernetes handles scaling and deployment
* Docker images must match target architecture
* Secrets should not be manually encoded
* Next.js env variables can be build-time sensitive

---

# 🚀 Future Improvements

* CI/CD pipeline (GitHub Actions)
* Autoscaling (HPA)
* Monitoring (Prometheus + Grafana)
* Custom domain (no nip.io)

```
```

