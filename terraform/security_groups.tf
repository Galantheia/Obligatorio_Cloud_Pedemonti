# =============================================================
# Definicion de Security Groups
# =============================================================


# Security Group para ALB

resource "aws_security_group" "alb" {
  name        = "sg-alb"
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

  egress {
    description     = "HTTP hacia EC2"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = {
    Name = "sg-alb"
  }
}

# Permite trafico HTTP y HTTPS desde internet.


# Security Group para EC2

resource "aws_security_group" "ec2" {
  name        = "sg-ec2"
  description = "SG para las instancias EC2"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP desde ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

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
  name        = "sg-rds"
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