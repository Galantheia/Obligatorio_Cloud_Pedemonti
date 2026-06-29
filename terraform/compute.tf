# =============================================================
# Definicion de instancias de computo (EC2 + Auto Scaling)
# =============================================================


# AMI a utilizar

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# Se busca dinamicamente para no depender de un ID de AMI fijo que puede no existir en el futuro.


# Launch Template

resource "aws_launch_template" "app" {
  name_prefix   = "lt-app-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = "LabInstanceProfile"
  }

  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
  db_host     = aws_db_instance.main.address
  db_user     = var.db_username
  db_password = var.db_password
  db_name     = "ecommerce"
  }))
  
  tags = {
    Name = "lt-app"
  }
}

/* El user_data esta diseñado para desplegar una app desarrollada con Node.js.
Instala Node.js, clona el repositorio de la aplicacion, genera el .env y arranca la app con pm2. */


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