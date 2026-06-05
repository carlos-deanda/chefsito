-- Datos de demostración — ejecutar después de schema.sql
-- psql -U postgres -d chefsito -f database/seed.sql

-- Contraseña demo de todos los usuarios: password
-- El hash real se genera con: npm run db:fix-passwords
-- (el hash de ejemplo en INSERT es placeholder; db:seed lo corrige al final)

TRUNCATE TABLE
  hourly_analytics,
  daily_analytics,
  notifications,
  waitlist_entries,
  restaurant_staff,
  refresh_tokens,
  restaurants,
  user_profiles,
  publicaciones,
  user_roles_junction,
  roles,
  restaurant_amenities,
  amenities,
  users
RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- Usuarios (5 roles)
-- ---------------------------------------------------------------------------

INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Admin Chefsito',    'admin@chefsito.mx',        '+525511110001', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'Mariana Lopez',     'mariana@demo.mx',          '+525511110002', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'usuario'),
  ('a0000000-0000-4000-8000-000000000003', 'Diego Perez',       'diego@demo.mx',            '+525511110003', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'usuario'),
  ('a0000000-0000-4000-8000-000000000004', 'Laura Recepcion',   'recepcion@comalroma.mx',   '+525511110004', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'recepcionista'),
  ('a0000000-0000-4000-8000-000000000005', 'Carlos Gerente',    'gerente@comalroma.mx',     '+525511110005', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'gerente'),
  ('a0000000-0000-4000-8000-000000000006', 'Soporte Plataforma','soporte@chefsito.mx',      '+525511110006', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'soporte'),
  ('a0000000-0000-4000-8000-000000000007', 'Sofia Torres',      'sofia@demo.mx',            '+525511110007', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'usuario'),
  ('a0000000-0000-4000-8000-000000000008', 'Ana Recepcion Nori','recepcion@noricondesa.mx', '+525511110008', '$2b$10$EixZaYVK1fsbw1ZfbXOXMOuIp2Z04ogFB/errFyfgMXXKyEtj6B2u', 'recepcionista');

-- ---------------------------------------------------------------------------
-- Restaurantes (Ubicaciones reales alrededor del Tec Campus Guadalajara)
-- ---------------------------------------------------------------------------

INSERT INTO restaurants (id, name, cuisine, address, lat, lng, table_count, status, estimated_wait_minutes, manager_id) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Los Chilaquiles Tec GDL', 'Mexicana',  'Av. General Ramón Corona 2500, Zapopan, Jal.', 20.7342000, -103.4565000, 18, 'open',   18, 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000002', 'Burritos Universitaria',  'Tex-Mex',   'Av. Aviación 142, San Juan de Ocotán, Zapopan',20.7295000, -103.4518000, 12, 'closed', 26, NULL),
  ('b0000000-0000-4000-8000-000000000003', 'Sushi N Boru Valle Real', 'Asiática',  'Av. Santa Margarita 4100, Plaza Real, Zapopan',20.7381000, -103.4492000, 20, 'open',   12, NULL);

INSERT INTO restaurant_staff (restaurant_id, user_id) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000008');

-- ---------------------------------------------------------------------------
-- Fila de espera activa (Conectada a: Los Chilaquiles Tec GDL)
-- ---------------------------------------------------------------------------

INSERT INTO waitlist_entries (id, restaurant_id, user_id, party_size, status, position, registered_at, arrived_at) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 2, 'arrived', 1, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '5 minutes'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 4, 'arrived', 2, NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '10 minutes'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000007', 3, 'arrived', 3, NOW() - INTERVAL '19 minutes', NOW() - INTERVAL '12 minutes');

INSERT INTO waitlist_entries (id, restaurant_id, user_id, party_size, status, position, registered_at, called_at, cancelled_at) VALUES
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 2, 'cancelled', 1, NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '1 minute');

-- Historial cerrado (para analítica)
INSERT INTO waitlist_entries (restaurant_id, user_id, party_size, status, position, registered_at, arrived_at) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000007', 2, 'arrived',   1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 42 minutes'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 3, 'no_show',   2, NOW() - INTERVAL '2 hours', NULL),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 4, 'cancelled', 3, NOW() - INTERVAL '90 minutes', NULL);

-- ---------------------------------------------------------------------------
-- Notificaciones de ejemplo
-- ---------------------------------------------------------------------------

INSERT INTO notifications (waitlist_entry_id, user_id, channel, message, status) VALUES
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'whatsapp', 'Tu mesa en Burritos Universitaria está lista. Tienes 5 minutos para presentarte.', 'sent'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'push',     'Estás en posición #1 en Los Chilaquiles Tec GDL. Espera estimada: 8 min.', 'sent');

-- ---------------------------------------------------------------------------
-- Analítica (reporte del mockup)
-- ---------------------------------------------------------------------------

INSERT INTO daily_analytics (restaurant_id, report_date, total_entries, no_shows, avg_wait_minutes, peak_hour) VALUES
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 184, 12, 17, 14);

INSERT INTO hourly_analytics (restaurant_id, report_date, hour, entries) VALUES
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 12, 18),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 13, 31),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 14, 44),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 15, 27),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 16, 16),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 17, 22),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 18, 35),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 19, 39),
  ('b0000000-0000-4000-8000-000000000001', CURRENT_DATE, 20, 33);

-- ---------------------------------------------------------------------------
-- Relación 1:1 -> Perfiles de Usuario
-- ---------------------------------------------------------------------------
INSERT INTO user_profiles (user_id, bio, avatar_url, preferences) VALUES
  ('a0000000-0000-4000-8000-000000000002', 'Amante de la comida mexicana y los buenos chilaquiles.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '{"notifications_enabled": true, "favorite_cuisine": "Mexicana"}'),
  ('a0000000-0000-4000-8000-000000000003', 'Foodie de corazón. Busco siempre los mejores tacos de la ciudad.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', '{"notifications_enabled": true, "favorite_cuisine": "Tacos"}'),
  ('a0000000-0000-4000-8000-000000000007', 'Estudiante de ingeniería. Me encanta cenar sushi después de clases.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '{"notifications_enabled": false, "favorite_cuisine": "Asiática"}');

-- ---------------------------------------------------------------------------
-- Relación 1:N -> Publicaciones / Novedades
-- ---------------------------------------------------------------------------
INSERT INTO publicaciones (user_id, title, content) VALUES
  ('a0000000-0000-4000-8000-000000000005', '¡Chilaquiles gratis en tu cumpleaños!', 'Ven a celebrar con nosotros en Los Chilaquiles Tec GDL y recibe una porción gratis presentando tu credencial de estudiante o INE.'),
  ('a0000000-0000-4000-8000-000000000005', 'Horario especial de fin de año', 'Informamos a todos nuestros clientes que el 31 de diciembre cerraremos a las 16:00 horas. ¡Felices fiestas a todos!'),
  ('a0000000-0000-4000-8000-000000000001', 'Nueva sucursal en camino', 'Estamos afinando detalles para la apertura de nuestra nueva sucursal cerca de la universidad. ¡Espérala pronto!');

-- ---------------------------------------------------------------------------
-- Relación N:M -> Roles y Asignaciones
-- ---------------------------------------------------------------------------
INSERT INTO roles (id, name, description) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'Administrador Global', 'Control total sobre la plataforma, restaurantes y configuraciones.'),
  ('e0000000-0000-4000-8000-000000000002', 'Cliente General', 'Usuario regular de la plataforma que busca locales y hace fila.'),
  ('e0000000-0000-4000-8000-000000000003', 'Personal de Recepción', 'Gestiona turnos, llama comensales y valida llegadas.'),
  ('e0000000-0000-4000-8000-000000000004', 'Gerente de Sucursal', 'Administra el menú, horarios, métricas y personal de su local.');

INSERT INTO user_roles_junction (user_id, role_id) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001'), -- admin
  ('a0000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000002'), -- usuario
  ('a0000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002'), -- usuario
  ('a0000000-0000-4000-8000-000000000004', 'e0000000-0000-4000-8000-000000000003'), -- recepcionista
  ('a0000000-0000-4000-8000-000000000005', 'e0000000-0000-4000-8000-000000000004'), -- gerente
  ('a0000000-0000-4000-8000-000000000007', 'e0000000-0000-4000-8000-000000000002'); -- usuario

-- ---------------------------------------------------------------------------
-- Relación N:M -> Amenidades y Asignaciones
-- ---------------------------------------------------------------------------
INSERT INTO amenities (id, name, description) VALUES
  ('90000000-0000-4000-8000-000000000001', 'WiFi gratis', 'Conexión inalámbrica a internet de alta velocidad.'),
  ('90000000-0000-4000-8000-000000000002', 'Terraza al aire libre', 'Área de mesas exteriores para disfrutar del clima.'),
  ('90000000-0000-4000-8000-000000000003', 'Estacionamiento propio', 'Cajones de estacionamiento exclusivos para clientes.'),
  ('90000000-0000-4000-8000-000000000004', 'Pet Friendly', 'Se permite el acceso a mascotas domesticadas en áreas designadas.');

INSERT INTO restaurant_amenities (restaurant_id, amenity_id) VALUES
  ('b0000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001'), -- Chilaquiles -> WiFi
  ('b0000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002'), -- Chilaquiles -> Terraza
  ('b0000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001'), -- Burritos -> WiFi
  ('b0000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003'), -- Burritos -> Estacionamiento
  ('b0000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000004'); -- Sushi -> Pet Friendly