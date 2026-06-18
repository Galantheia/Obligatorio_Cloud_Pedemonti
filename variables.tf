# =============================================================
# Declaracion de variables
# =============================================================

# Credenciales para conexion con AWS

variable "access_key" {
  description = "AWS Access Key"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "AWS Secret Key"
  type        = string
  sensitive   = true
}

variable "token" {
  description = "AWS Session Token"
  type        = string
  sensitive   = true
}


# Region a utilizar

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

# En caso de modificar la Region, se deben modificar las AZs en la variable availability_zones que se encuentra a continuacion, para que correspondan a la Region seleccionada. De lo contrario, se pueden generar errores de disponibilidad de recursos.

variable "availability_zones" {
  description = "Zonas de disponibilidad a utilizar"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}


# Establecimiento de CIDRs y AZs para estructura de red

variable "vpc_cidr" {
  description = "CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs de las subnets públicas para ALB"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_ec2_cidrs" {
  description = "CIDRs de las subnets privadas para EC2"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "private_subnet_rds_cidrs" {
  description = "CIDRs de las subnets privadas para RDS"
  type        = list(string)
  default     = ["10.0.5.0/24", "10.0.6.0/24"]
}


# Definicion de instancias a utilizar

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t2.micro"
}


# Credenciales para conexion con RDS

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
}

variable "db_password" {
  description = "Contraseña de la base de datos"
  type        = string
  sensitive   = true
}