# =============================================================
# Definicion de Outputs
# =============================================================

# Load Balancer

output "alb_dns_name" {
  description = "DNS publico del Load Balancer"
  value       = aws_lb.main.dns_name
}
