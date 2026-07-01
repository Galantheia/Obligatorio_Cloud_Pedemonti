#!/bin/bash
set -e

# Instalación de Node.js 18 y git
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs git mariadb105 awscli

# Clonado del repositorio
cd /home/ec2-user
git clone https://github.com/Galantheia/App_Web_Obli-ISCloud.git
cd App_Web_Obli-ISCloud

# Generación del archivo .env con los valores reales de la infraestructura
cat <<EOF > .env
PORT=80
DB_HOST=${db_host}
DB_PORT=3306
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
DB_SSL=false
PRODUCT_GROUPS=gadgets,home_office,smart_home
SESSION_SECRET=${session_secret}
EOF

# Instalación de dependencias de la app
npm install

# Carga del esquema en RDS, solo si la tabla aun no existe
mysql -h "${db_host}" -u "${db_user}" -p"${db_password}" "${db_name}" < db/schema.sql || true

# Configuracion de backups de la base de datos hacia S3.
# Se genera un backup inicial cuando la instancia se crea y luego se agenda
# un backup diario con cron. Como el Auto Scaling Group puede tener mas de
# una instancia, se usa un marcador en S3 para evitar backups duplicados
# durante el mismo dia.


cat <<EOF > /usr/local/bin/ecommerce-db-backup.sh
#!/bin/bash
set -e

BACKUP_DATE=\$(date -u +%F)
TIMESTAMP=\$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR="/tmp/ecommerce-db-backups"
BACKUP_FILE="\$BACKUP_DIR/ecommerce-\$TIMESTAMP.sql.gz"
BACKUP_BUCKET="${backup_bucket}"
MARKER_KEY="mysql/daily/\$BACKUP_DATE/_started"
BACKUP_KEY="mysql/daily/\$BACKUP_DATE/ecommerce-\$TIMESTAMP.sql.gz"

mkdir -p "\$BACKUP_DIR"

if aws s3api head-object --bucket "\$BACKUP_BUCKET" --key "\$MARKER_KEY" >/dev/null 2>&1; then
  echo "Ya existe un backup para \$BACKUP_DATE"
  exit 0
fi

aws s3api put-object --bucket "\$BACKUP_BUCKET" --key "\$MARKER_KEY" --body /dev/null >/dev/null

mysqldump -h "${db_host}" -P 3306 -u "${db_user}" -p"${db_password}" --single-transaction "${db_name}" | gzip > "\$BACKUP_FILE"

aws s3 cp "\$BACKUP_FILE" "s3://\$BACKUP_BUCKET/\$BACKUP_KEY"

rm -f "\$BACKUP_FILE"

echo "Backup generado: s3://\$BACKUP_BUCKET/\$BACKUP_KEY"
EOF

chmod +x /usr/local/bin/ecommerce-db-backup.sh

# Ejecucion del primer backup al crear la instancia
/usr/local/bin/ecommerce-db-backup.sh || true

# Programacion del backup diario a las 03:15 UTC
echo "15 3 * * * root /usr/local/bin/ecommerce-db-backup.sh >> /var/log/ecommerce-db-backup.log 2>&1" > /etc/cron.d/ecommerce-db-backup

# Instalación de pm2 y arranque de la app con reinicio automático
npm install -g pm2
pm2 start npm --name app -- start

echo "=== Diagnostico local app ==="
sleep 10
curl -i http://localhost:80/health || true
ss -ltnp || true
pm2 status || true
pm2 logs app --lines 80 --nostream || true
echo "=== Fin diagnostico local app ==="

pm2 save