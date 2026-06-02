# server-chefsito

Backend de Ahorita con Node.js, Express, Socket.io y PostgreSQL.

## Inicio rápido

```bash
npm install
cp .env.example .env   # o usa el .env ya creado
```

Crea la base y carga el esquema (ver `database/README.md`):

```sql
CREATE DATABASE chefsito;
```

```bash
npm run db:schema
npm run db:seed
npm run dev
```

## Roles (5 vistas)

| Rol | Vista |
|-----|-------|
| `admin` | Panel global de la plataforma |
| `usuario` | App del cliente (mapa, filas, turno) |
| `recepcionista` | Fila en mostrador |
| `gerente` | Dashboard del restaurante + analítica |
| `soporte` | Consultas de soporte (solo lectura) |

## Endpoints base

- `GET /health` — incluye estado de PostgreSQL si `DATABASE_URL` está definida
- `POST /auth/register` / `POST /auth/login`
- `GET /restaurants/nearby`
- `POST /waitlist`
- `GET /analytics/:restaurant_id/daily`

Las rutas de negocio siguen con datos mock en memoria; el siguiente paso es conectarlas a las tablas de `database/schema.sql`.
