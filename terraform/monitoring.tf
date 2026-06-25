# =============================================================
# Definicion de monitoreo y escalado automatico con CloudWatch
# =============================================================


# Politica de escalado basada en CPU

resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "policy-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0 # 
  }
}