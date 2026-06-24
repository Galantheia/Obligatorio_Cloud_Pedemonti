# =============================================================
# Definicion de la base de datos RDS
# =============================================================


# DB Subnet Group

resource "aws_db_subnet_group" "main" {
  name       = "db-subnet-group-main"
  subnet_ids = aws_subnet.private_rds[*].id

  tags = {
    Name = "db-subnet-group-main"
  }
}


# Instancia RDS MySQL

resource "aws_db_instance" "main" {
  identifier             = "db-main"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "ecommerce"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = false  #Para casos de uso real, esta variable deberia ser cambiarse a 'true'.
  skip_final_snapshot    = true

  tags = {
    Name = "db-main"
  }
}

