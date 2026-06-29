#!/bin/bash
set -e

# Instalación de Node.js 18 y git
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git mariadb105

# Clonado del repositorio
cd /home/ec2-user
git clone https://github.com/Galantheia/Obligatorio_Cloud_Pedemonti.git
cd Obligatorio_Cloud_Pedemonti/app

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
EOF

# Instalación de dependencias de la app
npm install

# Carga del esquema en RDS, solo si la tabla aun no existe
mysql -h "${db_host}" -u "${db_user}" -p"${db_password}" "${db_name}" < db/schema.sql || true

# Instalación de pm2 y arranque de la app con reinicio automático
npm install -g pm2
pm2 start server.js --name app
pm2 startup
pm2 save