# Obligatorio_Cloud_Pedemonti

# Migración de Frontend E-commerce a AWS

![Terraform](https://img.shields.io/badge/Terraform-%3E%3D1.0-844FBA?logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Academy-FF9900?logo=amazonaws&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/status-en%20desarrollo-yellow)

Infraestructura como código para migrar el frontend de una solución de e-commerce desde un entorno on-premise hacia AWS, implementada con Terraform.

---

## Tabla de contenidos

- [Obligatorio\_Cloud\_Pedemonti](#obligatorio_cloud_pedemonti)
- [Migración de Frontend E-commerce a AWS](#migración-de-frontend-e-commerce-a-aws)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Descripción del proyecto](#descripción-del-proyecto)
  - [Arquitectura](#arquitectura)
  - [Servicios de AWS utilizados](#servicios-de-aws-utilizados)
  - [Estructura del repositorio](#estructura-del-repositorio)
  - [Requisitos previos](#requisitos-previos)
  - [Instrucciones de uso](#instrucciones-de-uso)
  - [Documentación adicional](#documentación-adicional)
  - [Aclaraciones y limitaciones conocidas](#aclaraciones-y-limitaciones-conocidas)
  - [Autor](#autor)

---

## Descripción del proyecto

Una empresa de venta online migra el componente de frontend de su infraestructura on-premise hacia AWS, con el objetivo de soportar picos de tráfico tras una campaña publicitaria que degradó la performance del sitio. Este repositorio contiene el código de infraestructura automatizada que despliega dicha solución en la nube de AWS.

## Arquitectura

El diagrama completo de la arquitectura, con iconografía AWS y el detalle de networking, se encuentra en [`docs/arquitectura.md`](docs/arquitectura.md).

En líneas generales, la solución contempla:

- Una VPC con subnets públicas y privadas distribuidas en 2 zonas de disponibilidad
- Un Application Load Balancer como único punto de entrada público
- Un Auto Scaling Group con instancias EC2 corriendo la aplicación
- Una base de datos RDS MySQL
- Un bucket S3 para backups
- Políticas de escalado automático basadas en CPU

## Servicios de AWS utilizados

| Capa | Servicio |
|---|---|
| Publicación | Application Load Balancer (ALB) |
| Aplicación | EC2, Auto Scaling Group, Launch Template |
| Persistencia | RDS (MySQL) |
| Almacenamiento | S3 |
| Networking | VPC, Subnets, Internet Gateway, NAT Gateway, VPC Endpoint, Route Tables |
| Seguridad | Security Groups |
| Monitoreo | CloudWatch (a través de Target Tracking Scaling) |

## Estructura del repositorio

```
.
├── README.md
├── docs/
│   ├── arquitectura.md
│   ├── instrucciones.md
│   └── dependencias.md
└── terraform/
    ├── providers.tf
    ├── variables.tf
    ├── terraform.tfvars.example
    ├── networking.tf
    ├── security_groups.tf
    ├── compute.tf
    ├── load_balancer.tf
    ├── database.tf
    ├── storage.tf
    ├── monitoring.tf
    └── outputs.tf
```

## Requisitos previos

El detalle completo de versiones y dependencias está en [`docs/dependencias.md`](docs/dependencias.md).

En resumen, se necesita:

- Terraform instalado
- Credenciales de AWS (Access Key, Secret Key y Session Token si se usa AWS Academy)
- Una cuenta de AWS con permisos para crear los recursos detallados en la arquitectura

## Instrucciones de uso

El paso a paso detallado está en [`docs/instrucciones.md`](docs/instrucciones.md).

Resumen rápido:

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd <nombre-repo>/terraform

# 2. Completar las variables
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con las credenciales y datos correspondientes

# 3. Inicializar, validar y desplegar
terraform init
terraform validate
terraform plan
terraform apply
```

Al finalizar, Terraform muestra como output la URL del Load Balancer para acceder al sitio.

## Documentación adicional

| Documento | Contenido |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Diagrama completo, CIDRs, Security Groups, tipos de instancia |
| [`docs/instrucciones.md`](docs/instrucciones.md) | Guía paso a paso de despliegue |
| [`docs/dependencias.md`](docs/dependencias.md) | Versiones de software requeridas |

## Aclaraciones y limitaciones conocidas

- El proyecto está pensado para desplegarse sobre **AWS Academy Learner Lab**, por lo que algunas configuraciones difieren de un entorno productivo real (ver detalle en `docs/arquitectura.md`).
- RDS se despliega en modalidad **Single-AZ**, dado que AWS Academy no soporta despliegues Multi-AZ.

## Autor

Trabajo individual — FI-7417 Soluciones Cloud, ORT.
