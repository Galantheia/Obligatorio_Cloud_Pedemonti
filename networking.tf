# =============================================================
# Definicion de la estructura de red
# =============================================================

# VPC

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  tags = {
    Name = "vpc-main"
  }
}


# Internet Gateway

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-main"
  }
}


# Subnets Publicas para ALB

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "subnet-public-${count.index + 1}"
  }
}


# Subnets Privadas para EC2

resource "aws_subnet" "private_ec2" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_ec2_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "subnet-private-ec2-${count.index + 1}"
  }
}


# Subnets Privadas para RDS

resource "aws_subnet" "private_rds" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_rds_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "subnet-private-rds-${count.index + 1}"
  }
}


# Elastic IP para NAT Gateway

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "e-ip-nat"
  }
}


# NAT Gateway

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "nat-gw-main"
  }
}


# VPC Endpoint para S3


resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = {
    Name = "vpc-end-s3"
  }
}

# Permite el acceso a S3 desde las subnets privadas sin salir a internet.


# Route Table publica

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Todo el trafico externo se dirige al Internet Gateway.


# Route Table privada

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "rt-private"
  }
}

resource "aws_route_table_association" "private_ec2" {
  count          = 2
  subnet_id      = aws_subnet.private_ec2[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_rds" {
  count          = 2
  subnet_id      = aws_subnet.private_rds[count.index].id
  route_table_id = aws_route_table.private.id
}

# Todo el trafico externo se dirige al NAT Gateway.