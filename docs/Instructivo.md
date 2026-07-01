# Instructivo de uso

## Dependencias / requerimientos

### Infraestructura

| Herramienta | Versión usada |
|---|---|
| Terraform | `1.15.7 <==` |
| Provider AWS | Ver `.terraform.lock.hcl` (no versionado en este repo; se resuelve al correr `terraform init` según el rango definido en `required_providers`) |
| Cuenta | AWS Academy Learner Lab es suficiente para hacer correr esta solución (región fija `us-east-1`, credenciales temporales, sin permisos para crear roles IAM propios) |

### Aplicación

| Herramienta | Versión |
|---|---|
| Node.js | ≥ 18 |
| npm | El que viene con Node 18 |

Dependencias del `package.json`:

- `express` — servidor HTTP
- `mysql2` — driver de MySQL (con soporte de promesas)
- `dotenv` — carga de variables de entorno desde `.env`
- `cookie-parser` — manejo de cookies (sesión admin y grupo de productos)

## Desplegar la infraestructura

1. Configurar las credenciales de AWS Academy (Access Key, Secret Key y Session Token, obtenidas desde el Learner Lab).
2. Pararse en la carpeta `terraform/`.
3. Completar `terraform.tfvars` con los valores necesarios (usuario y contraseña de la base, secreto de sesión, etc. — no se versiona por contener datos sensibles).
4. Correr:

```bash
terraform init
terraform plan
terraform apply
```

5. Al terminar, Terraform va a mostrar como output el DNS del ALB. Esa es la URL para acceder a la aplicación.

```bash
terraform output alb_dns_name
```

La creación completa de la infraestructura (incluyendo que las instancias terminen de bootstrapear vía `user_data` y pasen los health checks del ALB) puede tardar varios minutos.


## Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde escucha la app (`80` en EC2, `3000` en local) |
| `DB_HOST` | Endpoint de la RDS (o host de MySQL local) |
| `DB_PORT` | Puerto de MySQL (`3306`) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales y nombre de la base |
| `DB_SSL` | `true`/`false` según si la conexión requiere SSL |
| `PRODUCT_GROUPS` | Categorías de productos disponibles, separadas por coma |
| `LOCAL_INSTANCE_ID` | Identificador usado como fallback cuando la app no corre en una instancia EC2 real |
| `SESSION_SECRET` | Secreto usado para firmar la cookie de sesión del panel admin. En producción debe ser un valor largo y aleatorio, nunca el del `.env.example` |

## Notas sobre el despliegue en AWS

- El `user_data` de las instancias clona el repositorio, genera el `.env` con los valores reales de la infraestructura (inyectados por Terraform vía `templatefile()`), instala dependencias, carga `db/schema.sql` en la RDS y levanta la app con `pm2` para que se reinicie sola ante una caída.
- El health check del Target Group del ALB apunta al endpoint `/health` de la aplicación.
- Si el Target Group queda en estado `unhealthy` después de un despliegue, el primer lugar para revisar es el **System Log** de la instancia en la consola EC2 (ahí queda registrada la salida completa del `user_data`), y de ahí seguir a los logs de la aplicación con `pm2 logs` conectándose por Session Manager.
