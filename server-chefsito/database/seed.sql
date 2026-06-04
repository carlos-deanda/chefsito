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
  ('b0000000-0000-4000-8000-000000000002', 'Burritos Universitaria',  'Tex-Mex',   'Av. Aviación 142, San Juan de Ocotán, Zapopan',20.7295000, -103.4518000, 12, 'paused', 26, NULL),
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