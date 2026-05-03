output "cluster_id" {
  description = "The ID of the Kubernetes cluster"
  value       = digitalocean_kubernetes_cluster.autohub_cluster.id
}

output "kubeconfig" {
  description = "The kubeconfig to connect to the cluster"
  value       = digitalocean_kubernetes_cluster.autohub_cluster.kube_config[0].raw_config
  sensitive   = true
}
