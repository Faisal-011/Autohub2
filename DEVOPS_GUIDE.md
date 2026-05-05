# 🚀 Autohub Deployment (Kubernetes + Terraform + HTTPS)

This project deploys the **Autohub application** on Kubernetes using **Terraform**, with **NGINX Ingress** and **automatic HTTPS via cert-manager + Let’s Encrypt**.

---

# 🧠 Architecture

```
User → NGINX Ingress (LoadBalancer)
     ↓
Kubernetes Service (ClusterIP)
     ↓
Pods (Autohub App)

cert-manager → Let's Encrypt → HTTPS
```

---

# ⚠️ Important Notes

* This setup uses **Google Cloud (GKE)**
* Only one person (project owner) needs GCP access
* Others can follow along or use local Kubernetes (Minikube)

---

# 🧰 Prerequisites

Install:

* Docker
* kubectl
* Helm
* Terraform
* Google Cloud SDK (gcloud)

Verify:

```bash
docker --version
kubectl version --client
helm version
terraform -v
gcloud --version
```

---

# 🔐 Step 1 — Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project autohub-project
```

---

# 📂 Step 2 — Clone Repository

```bash
git clone <your-repo-url>
cd Autohub2/infrastructure/terraform
```

---

# ⚙️ Step 3 — Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit:

```hcl
project_id = "autohub-project"
region     = "us-central1"
```

---

# 🏗️ Step 4 — Initialize Terraform

```bash
terraform init
```

---

# 📊 Step 5 — Plan Deployment

```bash
terraform plan
```

---

# 🚀 Step 6 — Deploy Infrastructure

```bash
terraform apply
```

Type `yes`

⏳ Wait ~10 minutes

---

# 🔗 Step 7 — Connect to Cluster

```bash
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 \
  --project autohub-project
```

Verify:

```bash
kubectl get nodes
```

---

# 🌐 Step 8 — Install NGINX Ingress

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

Wait:

```bash
kubectl get pods -n ingress-nginx
```

---

# 🔐 Step 9 — Install cert-manager

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true
```

Wait:

```bash
kubectl get pods -n cert-manager
```

---

# 🌍 Step 10 — Get External IP

```bash
kubectl get svc -n ingress-nginx
```

Example:

```
EXTERNAL-IP: 34.xxx.xxx.xxx
```

---

# 🔧 Step 11 — Update Domain (CRITICAL)

Edit:

```bash
terraform.tfvars
```

```hcl
domain = "<EXTERNAL-IP>.nip.io"
```

---

# 🔁 Step 12 — Apply Again

```bash
terraform apply
```

---

# 📄 Step 13 — Apply ClusterIssuer

```bash
kubectl apply -f ../k8s/cluster-issuer.yaml
```

---

# 🔐 Step 14 — Reset Certificate Flow

```bash
kubectl delete certificate autohub-tls 2>/dev/null
kubectl delete challenge --all 2>/dev/null
kubectl delete order --all 2>/dev/null
```

---

# 🔁 Step 15 — Apply Again

```bash
terraform apply
```

---

# 👀 Step 16 — Verify HTTPS

```bash
kubectl get certificate
```

Expected:

```
autohub-tls   True
```

---

# 🌐 Step 17 — Access Application

```
https://<EXTERNAL-IP>.nip.io
```

---

# 🚨 Troubleshooting

## ❌ kubectl error (localhost:8080)

```bash
gcloud container clusters get-credentials autohub-cluster \
  --region us-central1 \
  --project autohub-project
```

---

## ❌ NGINX webhook error

Wait until:

```bash
kubectl get pods -n ingress-nginx
```

All are `Running`, then re-run:

```bash
terraform apply
```

---

## ❌ Certificate stuck (pending)

* Check domain matches NGINX IP
* Ensure ingress is working:

```bash
kubectl get ingress
```

---

# 🧠 DevOps Mapping

| Stage            | Tool                         |
| ---------------- | ---------------------------- |
| Infrastructure   | Terraform                    |
| Containerization | Docker                       |
| Orchestration    | Kubernetes                   |
| Routing          | NGINX Ingress                |
| Security         | cert-manager + Let’s Encrypt |

---

# ✅ Final Result

You will have:

* Scalable Kubernetes deployment
* External access via NGINX
* Automatic HTTPS
* Fully automated infrastructure

---

# 🔥 Tip

External IP changes after rebuild. Always update:

```hcl
domain = "<NEW-IP>.nip.io"
```

---

# 📌 Author Notes

This project demonstrates a complete **DevOps deployment pipeline**, including infrastructure provisioning, container orchestration, networking, and security automation.
