output "cluster_name" {
  value = google_container_cluster.autohub_cluster.name
}

output "domain" {
  value = var.domain
}

output "monitoring_namespace" {
  value = kubernetes_namespace.monitoring.metadata[0].name
}