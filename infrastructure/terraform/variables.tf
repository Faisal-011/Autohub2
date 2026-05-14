variable "project_id" {
  default = "autohub2-496117"
}

variable "region" {
  default = "us-central1"
}

variable "cluster_name" {
  default = "autohub-cluster"
}

variable "node_count" {
  default = 2
}

variable "machine_type" {
  default = "e2-medium"
}

variable "image" {
  default = "us-central1-docker.pkg.dev/autohub2-496117/autohub-repo/autohub2:latest"
}

variable "domain" {
  default = "34.123.147.226.nip.io"
}

variable "email" {
  default = "your-email@gmail.com"
}

variable "supabase_url" {}
variable "supabase_key" {}
variable "gemini_key" {}
variable "grafana_password" {
  description = "Grafana admin password. Set via TF_VAR_grafana_password env var — never hardcode."
  sensitive   = true
}