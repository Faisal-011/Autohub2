# ------------------------
# GKE CLUSTER
# ------------------------

resource "google_container_cluster" "autohub_cluster" {
  name     = var.cluster_name
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1
}

# ------------------------
# NODE POOL
# ------------------------

resource "google_container_node_pool" "primary_nodes" {
  name     = "autohub-node-pool"
  location = var.region
  cluster  = google_container_cluster.autohub_cluster.name

  node_count = var.node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = 30
    image_type   = "COS_CONTAINERD"
  }

  lifecycle {
    ignore_changes = all
  }
}

# ------------------------
# SECRET
# ------------------------

resource "kubernetes_secret" "autohub" {
  metadata {
    name = "autohub-secrets"
  }

  data = {
    NEXT_PUBLIC_SUPABASE_URL      = var.supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY = var.supabase_key
    GEMINI_API_KEY                = var.gemini_key
  }
}

# ------------------------
# DEPLOYMENT
# ------------------------

resource "kubernetes_deployment" "autohub" {
  metadata {
    name = "autohub-deployment"
    labels = {
      app = "autohub"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "autohub"
      }
    }

    template {
      metadata {
        labels = {
          app = "autohub"
        }
      }

      spec {
        container {
          name  = "autohub"

          image = var.image

          port {
            container_port = 3000
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.autohub.metadata[0].name
            }
          }
        }
      }
    }
  }
}

# ------------------------
# SERVICE
# ------------------------

resource "kubernetes_service" "autohub" {
  metadata {
    name = "autohub-service"
  }

  spec {
    selector = {
      app = "autohub"
    }

    port {
      port        = 80
      target_port = 3000
    }

    type = "LoadBalancer"
  }
}

# ------------------------
# INGRESS (HTTPS)
# ------------------------

resource "kubernetes_ingress_v1" "autohub" {
  metadata {
    name = "autohub-ingress"

    annotations = {
      "kubernetes.io/ingress.class"    = "nginx" 
      "cert-manager.io/cluster-issuer" = "letsencrypt-prod"
    }
  }

  spec {
    rule {
      host = var.domain

      http {
        path {
          path      = "/"
          path_type = "Prefix"

          backend {
            service {
              name = kubernetes_service.autohub.metadata[0].name
              port {
                number = 80
              }
            }
          }
        }
      }
    }

    tls {
      hosts       = [var.domain]
      secret_name = "autohub-tls"
    }
  }
}

resource "helm_release" "nginx_ingress" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
}

resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  depends_on = [helm_release.nginx_ingress]
}