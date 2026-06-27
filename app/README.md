# Demo AWS ALB + Neon + Node/Express

Este proyecto sirve para hacer una demo visual de un **AWS Application Load Balancer**.

La app muestra:

1. **6 productos** traídos desde una base de datos **Neon/Postgres**.
2. Un bloque visual con el **ID de la instancia EC2** que respondió la request.
3. Un **círculo de color único** generado automáticamente a partir del `instance-id`.
4. Un endpoint `/health` para usar como health check del Target Group del ALB.

La arquitectura esperada es:

```txt
Usuario
 ↓
AWS Application Load Balancer
 ↓
EC2 Auto Scaling Group
 ↓
Node/Express
 ↓
Neon Postgres
```

---

## 1. Requisitos

- Node.js 18 o superior.
- Una base Neon creada.
- La connection string de Neon.
- En AWS: EC2 o Auto Scaling Group + ALB.

---

## 2. Crear la tabla y cargar productos en Neon

Entrá a Neon y abrí:

```txt
SQL Editor
```

Pegá y ejecutá el contenido de:

```txt
db/schema.sql
```

Eso crea la tabla `products` y carga 18 productos de ejemplo:

- `gadgets`
- `home_office`
- `smart_home`

---

## 3. Configurar variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.example .env
```

En Windows podés duplicarlo manualmente y renombrarlo a `.env`.

Editá `.env`:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:password@ep-tu-host.neon.tech/neondb?sslmode=require&channel_binding=require"
PRODUCT_GROUPS="gadgets,home_office,smart_home"
LOCAL_INSTANCE_ID="local-dev"
```

Importante: `DATABASE_URL` no va en el HTML. Queda solamente en el backend.

---

## 4. Instalar y correr local

```bash
npm install
npm run dev
```

Abrí:

```txt
http://localhost:3000
```

En local no vas a tener `instance-id` real de EC2, entonces la app usa `LOCAL_INSTANCE_ID` como fallback.

---

## 5. Endpoints disponibles

### Home

```txt
GET /
```

Muestra la demo visual.

### Productos

```txt
GET /api/products
```

Devuelve 6 productos desde Neon.

La app elige un grupo aleatorio por visitante y lo guarda en cookie:

```txt
product_group
```

Esto hace que el usuario mantenga el mismo grupo aunque el ALB mande requests a distintas instancias.

### Info de instancia

```txt
GET /api/server-info
```

Devuelve algo así:

```json
{
  "serverId": "i-0a12bc34def567890",
  "instanceId": "i-0a12bc34def567890",
  "hostname": "ip-172-31-20-44",
  "availabilityZone": "us-east-1a",
  "instanceType": "t3.micro",
  "color": "#3A8FDB",
  "message": "Respuesta generada por i-0a12bc34def567890"
}
```

La app usa `instance-id` para generar un color HEX estable.

### Health check

```txt
GET /health
```

Devuelve:

```json
{ "ok": true }
```

Usalo como health check del Target Group del ALB.

---

## 6. Cómo funciona el color por instancia

La instancia EC2 lee su propio `instance-id` usando AWS EC2 Instance Metadata Service.

Luego la app genera un color HEX con esta lógica:

```js
function hexColorFromText(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += value.toString(16).padStart(2, '0');
  }

  return color.toUpperCase();
}
```

Resultado:

```txt
Misma instancia → mismo color siempre
Nueva instancia → nuevo color
```

---

## 7. Subir a una EC2

Ejemplo básico en Ubuntu:

```bash
sudo apt update
sudo apt install -y nodejs npm git
```

Subí el proyecto o clonalo.

Después:

```bash
npm install
npm start
```

Para producción, conviene correrlo con PM2:

```bash
sudo npm install -g pm2
pm2 start server.js --name alb-neon-product-demo
pm2 save
pm2 startup
```

---

## 8. Configurar ALB

En tu Target Group:

```txt
Protocol: HTTP
Port: 3000
Health check path: /health
```

En el ALB, el listener puede estar en:

```txt
HTTP : 80
```

Y reenviar al Target Group en el puerto 3000.

---

## 9. Para ver bien la demo del balanceo

Entrá a la URL del ALB:

```txt
http://tu-alb.amazonaws.com
```

Refrescá varias veces.

Deberías ver que cambia:

- `instance-id`
- hostname
- zona
- círculo de color

Si no cambia, revisá:

1. Que tengas más de una instancia saludable en el Target Group.
2. Que Sticky Sessions esté desactivado.
3. Que el navegador no esté reutilizando siempre la misma conexión.
4. Probá en incógnito o con otro navegador.

---

## 10. Notas importantes

- No dependemos de `SERVER_KEY=server1`, porque en Auto Scaling las instancias nacen y mueren.
- La identidad visual sale del `instance-id` real de EC2.
- Los productos se organizan por `product_group`, no por servidor.
- Neon se consume desde el backend, nunca desde el HTML.
