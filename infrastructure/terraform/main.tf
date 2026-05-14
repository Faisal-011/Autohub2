# ------------------------
# GKE CLUSTER
# ------------------------

resource "google_container_cluster" "autohub_cluster" {
  name     = var.cluster_name
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  node_config {
    machine_type = var.machine_type
    disk_size_gb = 20
    disk_type    = "pd-standard"
  }
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
    disk_type    = "pd-standard"
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

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 30
            period_seconds        = 15
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 5
            failure_threshold     = 3
          }

          resources {
            requests = {
              cpu    = "250m"
              memory = "512Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "1Gi"
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

# ===================================
# MONITORING & OBSERVABILITY STACK
# ===================================

# Create the monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

# Prometheus + Grafana via kube-prometheus-stack
resource "helm_release" "kube_prometheus_stack" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = kubernetes_namespace.monitoring.metadata[0].name
  create_namespace = false

  # Grafana settings
  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set {
    name  = "grafana.adminPassword"
    value = var.grafana_password
  }

  set {
    name  = "grafana.service.type"
    value = "LoadBalancer"
  }

  # Additional scrape config to scrape the AutoHub Next.js /api/metrics endpoint
  values = [<<-EOT
    prometheus:
      prometheusSpec:
        additionalScrapeConfigs:
          - job_name: 'autohub-nextjs'
            static_configs:
              - targets: ['autohub-service.default.svc.cluster.local:80']
            metrics_path: '/api/metrics'
            scrape_interval: 15s
  EOT
  ]

  depends_on = [
    google_container_node_pool.primary_nodes,
    kubernetes_namespace.monitoring,
  ]
}

# Blackbox Exporter for active HTTP probing
resource "helm_release" "blackbox_exporter" {
  name             = "blackbox-exporter"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "prometheus-blackbox-exporter"
  namespace        = kubernetes_namespace.monitoring.metadata[0].name
  create_namespace = false

  values = [<<-EOT
    config:
      modules:
        http_2xx:
          prober: http
          timeout: 5s
          http:
            valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
            valid_status_codes: [200]
            method: GET
  EOT
  ]

  depends_on = [
    google_container_node_pool.primary_nodes,
    kubernetes_namespace.monitoring,
  ]
}

# ConfigMap: Prometheus scrape target for AutoHub metrics
resource "kubernetes_config_map" "scrape_config" {
  metadata {
    name      = "autohub-scrape-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "scrape.yaml" = <<-EOT
      - job_name: 'autohub-nextjs'
        static_configs:
          - targets: ['autohub-service.default.svc.cluster.local:80']
        metrics_path: '/api/metrics'
        scrape_interval: 15s
    EOT
  }
}

# ------------------------
# HORIZONTAL POD AUTOSCALER
# ------------------------

resource "kubernetes_horizontal_pod_autoscaler_v2" "autohub" {
  metadata {
    name = "autohub-hpa"
  }

  spec {
    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.autohub.metadata[0].name
    }

    min_replicas = 2
    max_replicas = 10

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }

    metric {
      type = "Resource"
      resource {
        name = "memory"
        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }
  }
}

# ------------------------
# NETWORK POLICIES
# ------------------------

resource "kubernetes_network_policy" "autohub" {
  metadata {
    name      = "autohub-network-policy"
    namespace = "default"
  }

  spec {
    pod_selector {
      match_labels = {
        app = "autohub"
      }
    }

    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = "ingress-nginx"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "3000"
      }
    }

    ingress {
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = "monitoring"
          }
        }
      }
      ports {
        protocol = "TCP"
        port     = "3000"
      }
    }

    egress {
      ports {
        protocol = "UDP"
        port     = "53"
      }
      ports {
        protocol = "TCP"
        port     = "53"
      }
    }

    egress {
      ports {
        protocol = "TCP"
        port     = "443"
      }
    }
  }
}

# ConfigMap: Blackbox Exporter probe targets
resource "kubernetes_config_map" "blackbox_scrape_config" {
  metadata {
    name      = "blackbox-scrape-config"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }

  data = {
    "scrape.yaml" = <<-EOT
      - job_name: 'blackbox-http'
        metrics_path: /probe
        params:
          module: [http_2xx]
        static_configs:
          - targets:
              - http://autohub-service.default.svc.cluster.local:80
              - http://autohub-service.default.svc.cluster.local:80/api/metrics
              - http://autohub-service.default.svc.cluster.local:80/api/health
        relabel_configs:
          - source_labels: [__address__]
            target_label: __param_target
          - source_labels: [__param_target]
            target_label: instance
          - target_label: __address__
            replacement: blackbox-exporter:9115
    EOT
  }
}