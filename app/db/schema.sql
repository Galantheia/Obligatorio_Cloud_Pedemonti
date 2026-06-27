-- Ejecutar en Neon SQL Editor.
-- Esto borra y recrea la tabla products con datos de ejemplo.

DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_group VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_group_active_order
ON products (product_group, active, display_order);

INSERT INTO products
(product_group, name, price, image_url, description, display_order, active)
VALUES

-- =========================
-- GRUPO: gadgets
-- =========================
(
  'gadgets',
  'Smartwatch Pro Fit',
  39.90,
  'https://placehold.co/800x600/png?text=Smartwatch+Pro+Fit',
  'Reloj inteligente para controlar pasos, ritmo cardíaco, notificaciones y actividad diaria. Ideal para uso personal o deportivo.',
  1,
  TRUE
),
(
  'gadgets',
  'Auriculares Bluetooth AirBass',
  24.90,
  'https://placehold.co/800x600/png?text=Auriculares+Bluetooth',
  'Auriculares inalámbricos compactos con estuche de carga. Útiles para llamadas, música, trabajo y entrenamiento.',
  2,
  TRUE
),
(
  'gadgets',
  'Power Bank 20.000 mAh',
  29.90,
  'https://placehold.co/800x600/png?text=Power+Bank+20000mAh',
  'Batería portátil de alta capacidad para cargar celulares, tablets, auriculares y otros dispositivos durante viajes o jornadas largas.',
  3,
  TRUE
),
(
  'gadgets',
  'Cargador Rápido GaN 65W',
  34.90,
  'https://placehold.co/800x600/png?text=Cargador+GaN+65W',
  'Cargador compacto de carga rápida para celulares, notebooks livianas, tablets y accesorios USB-C.',
  4,
  TRUE
),
(
  'gadgets',
  'Hub USB-C 6 en 1',
  27.90,
  'https://placehold.co/800x600/png?text=Hub+USB-C+6+en+1',
  'Adaptador multifunción con HDMI, USB, lector de tarjetas y carga USB-C. Ideal para notebooks modernas y home office.',
  5,
  TRUE
),
(
  'gadgets',
  'Localizador Bluetooth Smart Tag',
  12.90,
  'https://placehold.co/800x600/png?text=Smart+Tag+Bluetooth',
  'Dispositivo para encontrar llaves, mochilas, billeteras o valijas desde el celular mediante conexión Bluetooth.',
  6,
  TRUE
),

-- =========================
-- GRUPO: home_office
-- =========================
(
  'home_office',
  'Webcam Full HD 1080p',
  32.90,
  'https://placehold.co/800x600/png?text=Webcam+Full+HD',
  'Cámara web para videollamadas, clases online, reuniones laborales y transmisiones con imagen clara.',
  1,
  TRUE
),
(
  'home_office',
  'Micrófono USB Condenser Mini',
  44.90,
  'https://placehold.co/800x600/png?text=Microfono+USB',
  'Micrófono de escritorio para grabaciones, podcasts, reuniones, clases y contenido digital.',
  2,
  TRUE
),
(
  'home_office',
  'Teclado Inalámbrico Slim',
  21.90,
  'https://placehold.co/800x600/png?text=Teclado+Inalambrico',
  'Teclado compacto y liviano para oficina, escritorio, tablets y setups minimalistas.',
  3,
  TRUE
),
(
  'home_office',
  'Mouse Ergonómico Wireless',
  18.90,
  'https://placehold.co/800x600/png?text=Mouse+Ergonomico',
  'Mouse inalámbrico cómodo para largas horas de trabajo. Ayuda a reducir cansancio en la mano.',
  4,
  TRUE
),
(
  'home_office',
  'Soporte Regulable para Notebook',
  25.90,
  'https://placehold.co/800x600/png?text=Soporte+Notebook',
  'Base elevadora para notebook que mejora la postura, la ventilación del equipo y el orden del escritorio.',
  5,
  TRUE
),
(
  'home_office',
  'Lámpara LED de Escritorio',
  19.90,
  'https://placehold.co/800x600/png?text=Lampara+LED',
  'Lámpara con luz regulable para trabajar, estudiar, leer o grabar contenido con mejor iluminación.',
  6,
  TRUE
),

-- =========================
-- GRUPO: smart_home
-- =========================
(
  'smart_home',
  'Cámara WiFi Interior 360°',
  36.90,
  'https://placehold.co/800x600/png?text=Camara+WiFi+360',
  'Cámara inteligente para monitorear el hogar, oficina, mascotas o local desde el celular.',
  1,
  TRUE
),
(
  'smart_home',
  'Enchufe Inteligente WiFi',
  13.90,
  'https://placehold.co/800x600/png?text=Enchufe+Inteligente',
  'Permite prender y apagar dispositivos desde una app. Útil para lámparas, ventiladores, cafeteras o equipos eléctricos.',
  2,
  TRUE
),
(
  'smart_home',
  'Tira LED RGB Smart',
  16.90,
  'https://placehold.co/800x600/png?text=Tira+LED+RGB',
  'Tira de luces LED con control desde app. Ideal para decoración, escritorios, habitaciones o fondos de video.',
  3,
  TRUE
),
(
  'smart_home',
  'Sensor de Puerta y Ventana',
  11.90,
  'https://placehold.co/800x600/png?text=Sensor+Puerta',
  'Sensor magnético para recibir alertas cuando una puerta, ventana o cajón se abre.',
  4,
  TRUE
),
(
  'smart_home',
  'Timbre Inalámbrico Digital',
  22.90,
  'https://placehold.co/800x600/png?text=Timbre+Inalambrico',
  'Timbre sin cables para casas, oficinas o locales. Fácil de instalar y con varios tonos configurables.',
  5,
  TRUE
),
(
  'smart_home',
  'Router Mesh Mini WiFi',
  49.90,
  'https://placehold.co/800x600/png?text=Router+Mesh+Mini',
  'Extensor de red para mejorar la cobertura WiFi en casas, oficinas o espacios grandes.',
  6,
  TRUE
);
