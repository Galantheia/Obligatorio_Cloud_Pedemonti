# =============================================================
# Definicion del Load Balancer
# =============================================================


# Application Load Balancer

resource "aws_lb" "main" {
  name               = "alb-main"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "alb-main"
  }
}


# Target Group

resource "aws_lb_target_group" "app" {
  name     = "tg-app"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    timeout             = 5
  }

  tags = {
    Name = "tg-app"
  }
}


# Listener

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# Redirecciona el trafico HTTP al Target Group que contiene las instancias EC2 del Auto Scaling Group.


# Asociacion del Target Group con el Auto Scaling Group

resource "aws_autoscaling_attachment" "app" {
  autoscaling_group_name = aws_autoscaling_group.app.name
  lb_target_group_arn    = aws_lb_target_group.app.arn
}

# Asocia las instancias EC2 creadas por el ASG sean registradas automaticamente en el Target Group.