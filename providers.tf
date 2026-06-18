# =============================================================
# Credenciales de acceso y configuracion del proveedor AWS
# =============================================================


provider "aws" {
  region     = var.aws_region
  access_key = var.access_key
  secret_key = var.secret_key
  token      = var.token
}