# Base de datos PostgreSQL

## Roles del sistema (5 vistas)

| Rol | Quién es | Qué puede hacer |
|-----|----------|-----------------|
| `admin` | Equipo Chefsito | Gestionar toda la plataforma, usuarios y restaurantes |
| `usuario` | Cliente final | Buscar restaurantes, unirse a filas y ver su turno |
| `recepcionista` | Mostrador del restaurante | Gestionar fila, llamar y eliminar turnos |
| `gerente` | Dueño o gerente del local | Estado del restaurante, personal y analítica |
| `soporte` | Soporte técnico | Consultar datos y ayudar (sin modificar operación del local) |

Los permisos detallados viven en la tabla `role_permissions`.

## Configuración inicial

1. Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE chefsito;
```

2. Aplica el esquema y los datos de prueba (desde `server-chefsito`):

```bash
npm run db:schema
npm run db:seed
```

O con `psql` directamente:

```bash
psql -U postgres -d chefsito -f database/schema.sql
psql -U postgres -d chefsito -f database/seed.sql
```

3. Verifica la conexión levantando el servidor y visitando `GET /health`.

## Usuarios demo (contraseña: `password`)

| Email | Rol |
|-------|-----|
| admin@chefsito.mx | admin |
| mariana@demo.mx | usuario |
| recepcion@comalroma.mx | recepcionista |
| gerente@comalroma.mx | gerente |
| soporte@chefsito.mx | soporte |
