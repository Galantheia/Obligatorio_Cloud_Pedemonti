# =============================================================
# Definicion de Security Groups
# =============================================================


# Security Group para ALB

resource "aws_security_group" "alb" {
  name        = "alb-sg"
  description = "SG para el ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP desde internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS desde internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-alb"
  }
}

# Permite trafico HTTP y HTTPS desde internet.


# Security Group para EC2

resource "aws_security_group" "ec2" {
  name        = "ec2-sg"
  description = "SG para las instancias EC2"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Salida a internet via NAT"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-ec2"
  }
}

# Solo permite trafico proveniente del ALB.


# Security Group para RDS

resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "SG para RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL desde EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name = "sg-rds"
  }
}

# Solo permite trafico proveniente de las instancias EC2.

# Regla: ALB puede enviar trafico HTTP hacia EC2

resource "aws_security_group_rule" "alb_to_ec2" {
  type                     = "egress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb.id
  source_security_group_id = aws_security_group.ec2.id
}


# Regla: EC2 acepta trafico HTTP desde ALB

resource "aws_security_group_rule" "ec2_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ec2.id
  source_security_group_id = aws_security_group.alb.id
}