terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# DigitalOcean Kubernetes Cluster
resource "digitalocean_kubernetes_cluster" "autohub_cluster" {
  name    = var.cluster_name
  region  = var.region
  version = var.k8s_version

  node_pool {
    name       = "autohub-worker-pool"
    size       = var.node_size
    node_count = var.node_count
  }
}

# Optional: Add a firewall if you wanted to lock down specific tags or droplets, 
# but DOKS LoadBalancers automatically handle exposing the necessary ports.
