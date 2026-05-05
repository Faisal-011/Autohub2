variable "project_id" {
  default = "autohub-project"
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
  default = "your-docker-repo/autohub2:latest"
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