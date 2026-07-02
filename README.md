# Obligatorio Cloud - Migración de aplicación web de e-commerce a AWS

Proyecto para migrar una aplicación web de e-commerce hacia AWS, desplegando una capa de aplicación con EC2, balanceo con ALB, base de datos en RDS MySQL y backups en S3.

## Contenido del Repositorio

```
├── README.md
├── terraform/          # Infraestructura como código
│   ├── networking.tf
│   ├── security_groups.tf
│   ├── compute.tf
│   ├── database.tf
│   ├── monitoring.tf
│   ├── outputs.tf
│   ├── variables.tf
│   └── terraform.tfvars
├── app/
│   ├── server.js
│   ├── package.json
│   ├── db/
│   │   └── schema.sql
│   ├── public/
│   └── .env.example
└── docs/
    ├── Arquitectura.md
    ├── Instructivo.md
    └── App.md
```

## Documentación

-  [`docs/Arquitectura.md`](./docs/Arquitectura.md) - descripción y explicación de la arquitectura diseñada.
-  [`docs/Instructivo.md`](./docs/Instructivo.md) - Instructivo de cómo utilizar la solución.
-  [`docs/App.md`](./docs/App.md) - Detalle del funcionamiento de la app demo y las pruebas de funcionamiento que permite hacer.

## Resumen de la Solución

La solución original (on-premise) contaba con un load balancer, dos servidores de aplicación, una base de datos y un servidor de backups. Esta migración replica esos mismos componentes en AWS:

| Componente original | Equivalente en AWS |
|---|---|
| Load balancer | Application Load Balancer (ALB) |
| Servidores de aplicación | Auto Scaling Group con instancias EC2 (Amazon Linux 2023 + Node.js) |
| Base de datos | RDS MySQL |
| Servidor de backups | Bucket S3, accedido vía VPC Endpoint |

Además, se agregó monitoreo con CloudWatch mediante una alarma de CPU y una política de auto scaling basada en esa métrica.

## Disclaimer

Algunas implementaciones indicadas en la sección de arquitectura, así como otras buenas prácticas, se vieron limitadas por el uso de AWS Academy Learner Lab, entorno en el cual se diseñó y probó esta solución.

---

*Giuliana Pedemonti · 325718 · ISC - 2026*