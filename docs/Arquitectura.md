# Arquitectura

## Diagrama

![Arquitectura AWS](docs/Arquitectura.png)

## Descripción general

La infraestructura se despliega en la región `us-east-1` (restricción de AWS Academy Learner Lab) y está repartida en **2 Availability Zones** para tolerar la caída de una de ellas.

La arquitectura se organiza en tres capas:

- **Capa publica**: contiene el Application Load Balancer, que es el unico punto de entrada desde internet.
- **Capa de aplicacion**: contiene las instancias EC2 administradas por un Auto Scaling Group.
- **Capa de persistencia**: contiene la base de datos RDS MySQL en subnets privadas separadas.

Las instancias EC2 y la base de datos no tienen acceso publico directo. El trafico externo entra por el ALB y desde ahi se redirige hacia las instancias registradas en el Target Group.

## Networking

| Recurso | Detalle |
|---|---|
| VPC | CIDR `10.0.0.0/16` |
| Subnets públicas | 2, una por AZ: `10.0.1.0/24` y `10.0.2.0/24` |
| Subnets privadas (EC2) | 2, una por AZ: `10.0.3.0/24` y `10.0.4.0/24` |
| Subnets privadas (RDS) | 2, una por AZ: `10.0.5.0/24` y `10.0.6.0/24` |
| Internet Gateway | Asociado a la VPC, ruta por defecto de las subnets públicas |
| NAT Gateway | Permite que las instancias privadas salgan a internet para instalar dependencias y clonar la aplicacion |
| VPC Endpoint (Gateway) | Permite acceder a S3 desde la red privada sin depender de internet público |

### Route tables

| Route Table | Asociacion | Rutas principales |
|---|---|---|
| Publica | Subnets publicas | Ruta `0.0.0.0/0` hacia el Internet Gateway |
| Privada | Subnets privadas de EC2 y RDS | Ruta `0.0.0.0/0` hacia el NAT Gateway y acceso a S3 mediante VPC Endpoint |

La route table privada se comparte entre las subnets de EC2 y RDS para mantener una configuracion simple dentro del alcance del obligatorio. El acceso real a la base se controla mediante Security Groups.

## Security Groups

Los Security Groups se configuraron siguiendo el principio de minimo acceso necesario. Las reglas internas referencian otros Security Groups en lugar de abrir rangos completos de IP.

| Security Group | Ingress | Egress |
|---|---|---|
| ALB | HTTP `80` y HTTPS `443` desde `0.0.0.0/0` | HTTP `80` hacia el Security Group de EC2 |
| EC2 | HTTP `80` solamente desde el Security Group del ALB | Salida abierta hacia internet mediante NAT |
| RDS | MySQL `3306` solamente desde el Security Group de EC2 | Salida por defecto |

El unico componente accesible desde internet es el ALB. Las instancias EC2 y RDS quedan en subnets privadas.

## Computo

La capa de aplicacion se implementa con EC2 y Auto Scaling Group.

| Recurso | Detalle |
|---|---|
| AMI | Amazon Linux 2023 |
| Tipo de instancia | `t2.micro` |
| Capacidad deseada | 2 instancias |
| Capacidad minima | 2 instancias |
| Capacidad maxima | 4 instancias |
| Subnets | Subnets privadas de EC2 en dos Availability Zones |
| IAM Instance Profile | `LabInstanceProfile`, provisto por AWS Academy |

Las instancias se crean a partir de un Launch Template. El `user_data` instala Node.js, Git, cliente de MySQL, AWS CLI y PM2. Luego clona el repositorio de la aplicacion, genera el archivo `.env`, carga el schema inicial en RDS y levanta la app con PM2 ejecutando `npm start`.

## Base de Datos

La base de datos se implementa con RDS MySQL.

| Recurso | Detalle |
|---|---|
| Motor | MySQL 8.0 |
| Clase de instancia | `db.t3.micro` |
| Base | `ecommerce` |
| Acceso publico | Deshabilitado |
| Subnets | Subnets privadas dedicadas a RDS |
| Multi-AZ | Deshabilitado por restricciones de AWS Academy |

RDS solo acepta conexiones MySQL desde el Security Group de EC2. De esta forma, la base no queda expuesta directamente a internet.

## Backups

El bucket S3 representa el componente de backups de la arquitectura original. La base RDS no escribe directamente en S3; el backup se genera desde las instancias EC2.

Aunque en la demo no esta contemplado su funcionamiento, el componente si se crea y es una buena implementación a corto plazo.

## Monitoreo y Escalabilidad

La solucion incluye monitoreo y escalabilidad automatica sobre la capa de aplicacion.

| Componente | Uso |
|---|---|
| Auto Scaling Policy | Politica de target tracking sobre CPU promedio del ASG |
| CloudWatch Alarm | Alarma cuando la CPU promedio supera el umbral definido |
| Target Group Health Checks | Validacion del estado de las instancias mediante `/health` |

La politica de Auto Scaling busca mantener la CPU promedio alrededor del 70%. Ademas, se define una alarma de CloudWatch para detectar CPU alta.

## Servicios Utilizados

- VPC
- Subnets
- Internet Gateway
- NAT Gateway
- VPC Endpoint para S3
- Route Tables
- Security Groups
- Application Load Balancer
- Target Group
- Auto Scaling Group
- EC2
- RDS MySQL
- S3
- CloudWatch

## Limitaciones y Decisiones de Diseno

Algunas decisiones se tomaron considerando las restricciones de AWS Academy Learner Lab.

- **RDS sin Multi-AZ**: AWS Academy no permite utilizar RDS Multi-AZ en este entorno. En una solucion productiva seria recomendable habilitarlo.
- **NAT Gateway unico**: se utiliza un solo NAT Gateway para reducir complejidad y consumo de recursos. En produccion seria mejor tener uno por Availability Zone.
- **IAM limitado**: no se crean roles IAM personalizados. Se utiliza `LabInstanceProfile`, provisto por AWS Academy.
- **Terraform sin modulos**: los recursos se organizaron en archivos separados dentro del mismo modulo raiz para mantener la implementacion simple y facil de revisar.
