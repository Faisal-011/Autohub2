output "cluster_name" {
  value = google_container_cluster.autohub_cluster.name
}

output "domain" {
  value = var.domain
}