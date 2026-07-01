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

# Alarma de CPU del ASG: dispara si el promedio supera el umbral
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "alarma-cpu-alta"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods   = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Se dispara cuando la CPU promedio del ASG supera el 80%"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }
}