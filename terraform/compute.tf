# =============================================================
# Definicion de instancias de computo (EC2 + Auto Scaling)
# =============================================================


# AMI a utilizar

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Se busca dinamicamente para no depender de un ID de AMI fijo que puede no existir en el futuro.


# Launch Template

resource "aws_launch_template" "app" {
  name_prefix   = "lt-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
  EOF
  )

  tags = {
    Name = "lt-app"
  }
}

# El user_data se debe modificar en base a la aplicacion que se desee desplegar en las instancias EC2.


# Auto Scaling Group

resource "aws_autoscaling_group" "app" {
  name                = "asg-app"
  desired_capacity    = 2
  min_size            = 2
  max_size            = 4
  vpc_zone_identifier = aws_subnet.private_ec2[*].id

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ec2-app"
    propagate_at_launch = true
  }
}
