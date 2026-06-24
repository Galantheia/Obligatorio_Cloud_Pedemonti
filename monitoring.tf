# =============================================================
# Definicion de monitoreo y escalado automatico con CloudWatch
# =============================================================


# Politica de escalado basada en CPU
# Mantiene el promedio de CPU del ASG cerca del 70%, escalando automaticamente hacia arriba o abajo segun la carga.
# CloudWatch gestiona las alarmas necesarias de forma automatica por detras de esta politica.

resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "policy-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}