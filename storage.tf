# =============================================================
# Definicion del almacenamiento S3 para backups
# =============================================================


# Bucket S3

resource "aws_s3_bucket" "backups" {
  bucket = "ecommerce-backups-${var.aws_region}"

  tags = {
    Name = "s3-backups"
  }
}


# Versionado del bucket

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}