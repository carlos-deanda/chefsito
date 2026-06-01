# server-chefsito

Backend de Ahorita con Node.js, Express y Socket.io.

```bash
npm install
npm run dev
```

Endpoints base incluidos:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /restaurants/nearby`
- `POST /waitlist`
- `GET /waitlist/:id/position`
- `GET /analytics/:restaurant_id/daily`

Por ahora las rutas responden con datos mock o mensajes `501` para dejar clara la estructura antes de conectar Supabase, Redis, Bull y Twilio.
