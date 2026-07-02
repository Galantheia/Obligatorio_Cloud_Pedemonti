# La aplicación

Demo de e-commerce hecha en Node.js + Express, pensada específicamente para mostrar el funcionamiento del ALB y de la base de datos en la infraestructura desplegada.

Se encuentra en el repositorio https://github.com/Galantheia/App_Web_Obli-ISCloud

## Qué hace

### Catálogo de productos

- Muestra productos agrupados por categoría (`gadgets`, `home_office`, `smart_home`).
- Al entrar por primera vez, se asigna aleatoriamente una categoría vía cookie, que se mantiene durante la sesión del usuario (se puede reiniciar).
- Permite buscar productos por nombre o descripción.
- Los datos de los productos se leen desde la base MySQL en RDS.

### Identificación de instancia

En la parte superior derecha se muestra la instancia EC2 que constesta la petición y muestra:
- instance ID
- Availability Zone
- tipo de instancia
- color generado a partir de esos datos.

Esto es lo que permite comprobar visualmente, refrescando la página varias veces, que el ALB está repartiendo el tráfico entre las distintas instancias del Auto Scaling Group.

### Panel de administración (`/admin`)

- Login con usuario y contraseña, validado contra la tabla `users` de la base. Para la demo se les asigno los valores:
    - Usuario: admin
    - Contraseña: Admin1234!
- Las contraseñas se guardan hasheadas con `scrypt` (nativo de Node, sin librerías externas).
- La sesión se maneja con una cookie firmada con HMAC-SHA256 (implementación propia, sin librerías de sesión externas), con expiración a las 8 horas.
- Desde el panel se puede:
  - Ver un resumen general: cantidad de productos totales y activos, cantidad de usuarios y admins activos, distribución de productos por categoría, e info de la instancia que atendió el pedido.
  - Listar todos los productos (activos e inactivos) con buscador.
  - Crear, editar y eliminar productos.

## Flujo de Uso

1. El usuario ingresa a la URL publica del ALB optenida al terminar de ejecutar _> terraform apply_.
2. El ALB redirige la request a una de las instancias EC2 registradas en el Target Group.
3. La instancia consulta la base RDS para obtener los productos.
4. La respuesta muestra el catalogo y los datos de la instancia que atendio el pedido.
5. Al refrescar la pagina, se puede verificar si el trafico fue atendido por la misma instancia o por otra.


## Stack

Node.js 18 · Express · MySQL (`mysql2`) · `pm2` como process manager en producción · HTML/CSS/JS plano en el frontend.
