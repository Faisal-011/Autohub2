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
  default = "us-central1-docker.pkg.dev/autohub-project/autohub-repo/autohub2:v3"
}

variable "domain" {
  default = "34.123.147.226.nip.io"
}

variable "email" {
  default = "janetking@gmail.com"
}

variable "supabase_url" {
  default="https://rfqzbltesehwqiorcxyn.supabase.co"
}
variable "supabase_key" {
  default="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcXpibHRlc2Vod3Fpb3JjeHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTU2MDksImV4cCI6MjA4MDE5MTYwOX0.x-e4fpX5j2T8gp6_1J1N3WTjNJy-1ye6RIamLp68ftc"
}
variable "gemini_key" {
  default="AIzaSyD9lOxSz92vjDI-CaxYFf3DX_lBF7o1oww"
}