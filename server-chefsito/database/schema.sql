-- Chefsito / Ahorita — esquema PostgreSQL
-- Ejecutar: psql -U postgres -d chefsito -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS v_restaurants_public CASCADE;
DROP VIEW IF EXISTS v_waitlist_active CASCADE;
DROP TABLE IF EXISTS hourly_analytics CASCADE;
DROP TABLE IF EXISTS daily_analytics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS waitlist_entries CASCADE;
DROP TABLE IF EXISTS restaurant_staff CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS publicaciones CASCADE;
DROP TABLE IF EXISTS user_roles_junction CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS estudiante_cursos CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS restaurant_status CASCADE;
DROP TYPE IF EXISTS waitlist_status CASCADE;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
  'admin',         -- administración global de la plataforma
  'usuario',       -- cliente que se une a filas de espera
  'recepcionista', -- personal de mostrador: fila, llamar turnos
  'gerente',       -- dueño/gerente del restaurante: config, métricas, estado
  'soporte'        -- soporte técnico de la plataforma (ayuda limitada)
);

CREATE TYPE restaurant_status AS ENUM ('open', 'paused', 'closed');

CREATE TYPE waitlist_status AS ENUM (
  'waiting',
  'called',
  'arrived',
  'cancelled',
  'no_show'
);

-- ---------------------------------------------------------------------------
-- Usuarios y permisos por rol
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'usuario',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role                   user_role PRIMARY KEY,
  can_manage_platform    BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_restaurant  BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_waitlist    BOOLEAN NOT NULL DEFAULT FALSE,
  can_join_waitlist      BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_analytics     BOOLEAN NOT NULL DEFAULT FALSE,
  description            TEXT NOT NULL
);

INSERT INTO role_permissions (role, can_manage_platform, can_manage_restaurant, can_manage_waitlist, can_join_waitlist, can_view_analytics, description) VALUES
  ('admin',         TRUE,  TRUE,  TRUE,  FALSE, TRUE,  'Control total: usuarios, restaurantes y configuración global'),
  ('usuario',       FALSE, FALSE, FALSE, TRUE,  FALSE, 'Cliente: busca restaurantes y se une a filas'),
  ('recepcionista', FALSE, FALSE, TRUE,  FALSE, FALSE, 'Mostrador: gestiona la fila y llama turnos'),
  ('gerente',       FALSE, TRUE,  TRUE,  FALSE, TRUE,  'Gerente del local: estado, personal y reportes'),
  ('soporte',       FALSE, FALSE, FALSE, FALSE, TRUE,  'Soporte de plataforma: consulta y asistencia (solo lectura)');

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ---------------------------------------------------------------------------
-- Restaurantes y personal asignado
-- ---------------------------------------------------------------------------

CREATE TABLE restaurants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   VARCHAR(120) NOT NULL,
  cuisine                VARCHAR(80),
  address                VARCHAR(255) NOT NULL,
  lat                    NUMERIC(10, 7) NOT NULL,
  lng                    NUMERIC(10, 7) NOT NULL,
  table_count            INT NOT NULL DEFAULT 10 CHECK (table_count > 0),
  status                 restaurant_status NOT NULL DEFAULT 'open',
  estimated_wait_minutes INT NOT NULL DEFAULT 15 CHECK (estimated_wait_minutes >= 0),
  manager_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_status ON restaurants(status);
CREATE INDEX idx_restaurants_location ON restaurants(lat, lng);

-- Recepcionistas (y opcionalmente otros) asignados a un restaurante
CREATE TABLE restaurant_staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, user_id)
);

CREATE INDEX idx_restaurant_staff_user ON restaurant_staff(user_id);

-- ---------------------------------------------------------------------------
-- Fila de espera
-- ---------------------------------------------------------------------------

CREATE TABLE waitlist_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party_size    INT NOT NULL CHECK (party_size BETWEEN 1 AND 20),
  status        waitlist_status NOT NULL DEFAULT 'waiting',
  position      INT NOT NULL CHECK (position > 0),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  called_at     TIMESTAMPTZ,
  arrived_at    TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ
);

-- Un usuario solo puede tener un turno activo por restaurante
CREATE UNIQUE INDEX uq_waitlist_active_per_user_restaurant
  ON waitlist_entries (user_id, restaurant_id)
  WHERE status IN ('waiting', 'called');

CREATE INDEX idx_waitlist_restaurant_status ON waitlist_entries(restaurant_id, status);
CREATE INDEX idx_waitlist_user ON waitlist_entries(user_id);

-- ---------------------------------------------------------------------------
-- Notificaciones y analítica
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_entry_id UUID REFERENCES waitlist_entries(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel           VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'push', 'email')),
  message           TEXT NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_entry ON notifications(waitlist_entry_id);

CREATE TABLE daily_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  report_date      DATE NOT NULL,
  total_entries    INT NOT NULL DEFAULT 0 CHECK (total_entries >= 0),
  no_shows         INT NOT NULL DEFAULT 0 CHECK (no_shows >= 0),
  avg_wait_minutes INT NOT NULL DEFAULT 0 CHECK (avg_wait_minutes >= 0),
  peak_hour        SMALLINT CHECK (peak_hour BETWEEN 0 AND 23),
  UNIQUE (restaurant_id, report_date)
);

CREATE TABLE hourly_analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  report_date   DATE NOT NULL,
  hour          SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  entries       INT NOT NULL DEFAULT 0 CHECK (entries >= 0),
  UNIQUE (restaurant_id, report_date, hour)
);

-- ---------------------------------------------------------------------------
-- Vistas útiles por rol (consultas desde la API)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_restaurants_public AS
SELECT
  r.id,
  r.name,
  r.cuisine,
  r.address,
  r.lat,
  r.lng,
  r.status,
  r.estimated_wait_minutes,
  (
    SELECT COUNT(*)::INT
    FROM waitlist_entries w
    WHERE w.restaurant_id = r.id AND w.status = 'waiting'
  ) AS people_waiting
FROM restaurants r;

CREATE OR REPLACE VIEW v_waitlist_active AS
SELECT
  w.id,
  w.restaurant_id,
  w.user_id,
  u.name AS guest_name,
  w.party_size,
  w.status,
  w.position,
  w.registered_at,
  w.called_at,
  EXTRACT(EPOCH FROM (COALESCE(w.called_at, NOW()) - w.registered_at)) / 60 AS wait_minutes
FROM waitlist_entries w
JOIN users u ON u.id = w.user_id
WHERE w.status IN ('waiting', 'called')
ORDER BY w.restaurant_id, w.position;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------------------------------------------------------------------------
-- Relación 1:1 -> Usuario <-> Perfil
-- ---------------------------------------------------------------------------
CREATE TABLE user_profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio           TEXT,
  avatar_url    VARCHAR(255),
  preferences   JSONB DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------------------------------------------------------------------------
-- Relación 1:N -> Usuario -> Publicaciones
-- ---------------------------------------------------------------------------
CREATE TABLE publicaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Relación N:M -> Usuarios <-> Roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE user_roles_junction (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Relación N:M -> Estudiantes <-> Cursos (Ejemplo de Rúbrica)
-- ---------------------------------------------------------------------------
CREATE TABLE estudiantes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cursos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(20) NOT NULL UNIQUE,
  name        VARCHAR(120) NOT NULL,
  credits     INT NOT NULL DEFAULT 3
);

CREATE TABLE estudiante_cursos (
  estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  curso_id      UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (estudiante_id, curso_id)
);
