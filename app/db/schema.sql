CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  full_name VARCHAR(120),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_role_active
ON users (role, active);

INSERT INTO users (username, full_name, password_hash, role, active)
VALUES (
  'admin',
  'Administrador Principal',
  'scrypt$bd888df621380db4b8c90736857edcc2$13a97352b73f0b3bd14b6f5b43aaab3d3415b611a97aeb684db3380935417c225bf8752ce4f4e66b50281a606c3e39c7c0e0b1a83ed605d590497a3fbe07049c',
  'admin',
  TRUE
)
ON DUPLICATE KEY UPDATE username = username;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_group VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_products_group_name UNIQUE (product_group, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_group_active_order
ON products (product_group, active, display_order);

INSERT INTO products
(product_group, name, price, image_url, description, display_order, active)
VALUES
('gadgets', 'Smartwatch Pro Fit', 39.90, 'https://placehold.co/800x600/png?text=Smartwatch+Pro+Fit', 'Reloj inteligente para controlar pasos, ritmo cardiaco, notificaciones y actividad diaria. Ideal para uso personal o deportivo.', 1, TRUE),
('gadgets', 'Auriculares Bluetooth AirBass', 24.90, 'https://placehold.co/800x600/png?text=Auriculares+Bluetooth', 'Auriculares inalambricos compactos con estuche de carga. Utiles para llamadas, musica, trabajo y entrenamiento.', 2, TRUE),
('gadgets', 'Power Bank 20.000 mAh', 29.90, 'https://placehold.co/800x600/png?text=Power+Bank+20000mAh', 'Bateria portatil de alta capacidad para cargar celulares, tablets, auriculares y otros dispositivos durante viajes o jornadas largas.', 3, TRUE),
('gadgets', 'Cargador Rapido GaN 65W', 34.90, 'https://placehold.co/800x600/png?text=Cargador+GaN+65W', 'Cargador compacto de carga rapida para celulares, notebooks livianas, tablets y accesorios USB-C.', 4, TRUE),
('gadgets', 'Hub USB-C 6 en 1', 27.90, 'https://placehold.co/800x600/png?text=Hub+USB-C+6+en+1', 'Adaptador multifuncion con HDMI, USB, lector de tarjetas y carga USB-C. Ideal para notebooks modernas y home office.', 5, TRUE),
('gadgets', 'Localizador Bluetooth Smart Tag', 12.90, 'https://placehold.co/800x600/png?text=Smart+Tag+Bluetooth', 'Dispositivo para encontrar llaves, mochilas, billeteras o valijas desde el celular mediante conexion Bluetooth.', 6, TRUE),
('home_office', 'Webcam Full HD 1080p', 32.90, 'https://placehold.co/800x600/png?text=Webcam+Full+HD', 'Camara web para videollamadas, clases online, reuniones laborales y transmisiones con imagen clara.', 1, TRUE),
('home_office', 'Microfono USB Condenser Mini', 44.90, 'https://placehold.co/800x600/png?text=Microfono+USB', 'Microfono de escritorio para grabaciones, podcasts, reuniones, clases y contenido digital.', 2, TRUE),
('home_office', 'Teclado Inalambrico Slim', 21.90, 'https://placehold.co/800x600/png?text=Teclado+Inalambrico', 'Teclado compacto y liviano para oficina, escritorio, tablets y setups minimalistas.', 3, TRUE),
('home_office', 'Mouse Ergonomico Wireless', 18.90, 'https://placehold.co/800x600/png?text=Mouse+Ergonomico', 'Mouse inalambrico comodo para largas horas de trabajo. Ayuda a reducir cansancio en la mano.', 4, TRUE),
('home_office', 'Soporte Regulable para Notebook', 25.90, 'https://placehold.co/800x600/png?text=Soporte+Notebook', 'Base elevadora para notebook que mejora la postura, la ventilacion del equipo y el orden del escritorio.', 5, TRUE),
('home_office', 'Lampara LED de Escritorio', 19.90, 'https://placehold.co/800x600/png?text=Lampara+LED', 'Lampara con luz regulable para trabajar, estudiar, leer o grabar contenido con mejor iluminacion.', 6, TRUE),
('smart_home', 'Camara WiFi Interior 360', 36.90, 'https://placehold.co/800x600/png?text=Camara+WiFi+360', 'Camara inteligente para monitorear el hogar, oficina, mascotas o local desde el celular.', 1, TRUE),
('smart_home', 'Enchufe Inteligente WiFi', 13.90, 'https://placehold.co/800x600/png?text=Enchufe+Inteligente', 'Permite prender y apagar dispositivos desde una app. Util para lamparas, ventiladores, cafeteras o equipos electricos.', 2, TRUE),
('smart_home', 'Tira LED RGB Smart', 16.90, 'https://placehold.co/800x600/png?text=Tira+LED+RGB', 'Tira de luces LED con control desde app. Ideal para decoracion, escritorios, habitaciones o fondos de video.', 3, TRUE),
('smart_home', 'Sensor de Puerta y Ventana', 11.90, 'https://placehold.co/800x600/png?text=Sensor+Puerta', 'Sensor magnetico para recibir alertas cuando una puerta, ventana o cajon se abre.', 4, TRUE),
('smart_home', 'Timbre Inalambrico Digital', 22.90, 'https://placehold.co/800x600/png?text=Timbre+Inalambrico', 'Timbre sin cables para casas, oficinas o locales. Facil de instalar y con varios tonos configurables.', 5, TRUE),
('smart_home', 'Router Mesh Mini WiFi', 49.90, 'https://placehold.co/800x600/png?text=Router+Mesh+Mini', 'Extensor de red para mejorar la cobertura WiFi en casas, oficinas o espacios grandes.', 6, TRUE)
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  image_url = VALUES(image_url),
  description = VALUES(description),
  display_order = VALUES(display_order),
  active = VALUES(active);
