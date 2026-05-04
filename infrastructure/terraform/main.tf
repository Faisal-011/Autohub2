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
    NEXT_PUBLIC_SUPABASE_URL = "https://rfqzbltesehwqiorcxyn.supabase.co"

    NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcXpibHRlc2Vod3Fpb3JjeHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTU2MDksImV4cCI6MjA4MDE5MTYwOX0.x-e4fpX5j2T8gp6_1J1N3WTjNJy-1ye6RIamLp68ftc"

    GEMINI_API_KEY = "AIzaSyD9lOxSz92vjDI-CaxYFf3DX_lBF7o1oww"
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

          # ✅ UPDATED IMAGE (THIS IS THE IMPORTANT FIX)
          image = "your-docker-repo/autohub2:latest"

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