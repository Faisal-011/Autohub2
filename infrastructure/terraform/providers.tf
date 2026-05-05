terraform {
  # Shared remote state — all collaborators read/write the same state file.
  # Run `gsutil mb gs://autohub-terraform-state` once to create the bucket.
  backend "gcs" {
    bucket = "autohub-terraform-state"
    prefix = "terraform/state"
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host  = "https://${google_container_cluster.autohub_cluster.endpoint}"
  token = data.google_client_config.default.access_token

  cluster_ca_certificate = base64decode(
    google_container_cluster.autohub_cluster.master_auth[0].cluster_ca_certificate
  )
}

provider "helm" {
  kubernetes {
    host  = "https://${google_container_cluster.autohub_cluster.endpoint}"
    token = data.google_client_config.default.access_token

    cluster_ca_certificate = base64decode(
      google_container_cluster.autohub_cluster.master_auth[0].cluster_ca_certificate
    )
  }
}