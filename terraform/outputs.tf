# =============================================================
# Definicion de Outputs
# =============================================================


# Networking

output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs de las subnets publicas"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ec2_ids" {
  description = "IDs de las subnets privadas para EC2"
  value       = aws_subnet.private_ec2[*].id
}

output "private_subnet_rds_ids" {
  description = "IDs de las subnets privadas para RDS"
  value       = aws_subnet.private_rds[*].id
}

output "nat_gateway_ip" {
  description = "IP publica del NAT Gateway"
  value       = aws_eip.nat.public_ip
}


# Security Groups

output "security_group_alb_id" {
  description = "ID del Security Group del ALB"
  value       = aws_security_group.alb.id
}

output "security_group_ec2_id" {
  description = "ID del Security Group de las EC2"
  value       = aws_security_group.ec2.id
}

output "security_group_rds_id" {
  description = "ID del Security Group de RDS"
  value       = aws_security_group.rds.id
}


# Compute

output "asg_name" {
  description = "Nombre del Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}


# Load Balancer

output "alb_dns_name" {
  description = "DNS publico del Load Balancer"
  value       = aws_lb.main.dns_name
}


# Database

output "rds_endpoint" {
  description = "Endpoint de conexion a la base de datos RDS"
  value       = aws_db_instance.main.endpoint
}


# Storage

output "s3_bucket_name" {
  description = "Nombre del bucket S3 de backups"
  value       = aws_s3_bucket.backups.bucket
}