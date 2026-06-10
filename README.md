# Chefsito 🍽️

Video Demo: youtube.com/watch?v=G8BBqBVzlAM&feature=youtu.be

Plataforma inteligente y reactiva de filas de espera en tiempo real diseñada para optimizar los tiempos de espera en restaurantes y locales gastronómicos, reduciendo las aglomeraciones físicas y mejorando la experiencia de servicio de los comensales.

---

## 🏗️ Arquitectura General

Chefsito está construido bajo una arquitectura desacoplada de alto rendimiento y actualización instantánea:

```
[ Frontend: React + Vite + Tailwind ] <---> [ WebSockets: Socket.io ]
                  |                                      ^
                  | (Peticiones REST con JWT)            | (Eventos de fila)
                  v                                      v
[ Backend: Node.js + Express ] <------------------------+
                  |
                  | (Consultas Relacionales con pg Pool)
                  v
[ Base de Datos: PostgreSQL ]
```

- **Separación de Capas**: El frontend es una SPA (Single Page Application) estática que consume una API REST independiente.
- **Flujo de Datos en Tiempo Real**: Socket.io gestiona la sincronización inmediata del estado de la fila entre los recepcionistas y los clientes que esperan su mesa.
- **Persistencia Relacional**: PostgreSQL almacena los datos transaccionales, garantizando integridad relacional mediante claves primarias, foráneas, restricciones únicas y eliminaciones en cascada.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React (v19)**: Librería de UI con componentes funcionales de alto desempeño.
- **Vite (v8)**: Herramienta de compilación ultrarrápida.
- **Tailwind CSS (v4)**: Framework de diseño moderno para interfaces fluidas y atractivas.
- **Socket.io-client (v4)**: Cliente de comunicación bidireccional en tiempo real.

### Backend
- **Node.js**: Entorno de ejecución en tiempo de ejecución de JavaScript.
- **Express (v5)**: Framework minimalista de routing y controladores de API.
- **PG Pool (v8)**: Driver nativo optimizado para pooling de conexiones con PostgreSQL.
- **Bcrypt (v6)**: Algoritmo de hashing criptográfico para contraseñas.
- **JSON Web Tokens (JWT) (v9)**: Estándar para transmisión segura de identidad y roles de usuario.
- **Socket.io (v4)**: Servidor de comunicación en tiempo real.

---

## 🚀 Instrucciones de Instalación y Uso Local

### Prerrequisitos
- **Node.js** (v18 o superior) instalado.
- **PostgreSQL** (v14 o superior) en ejecución local en el puerto `5432`.

### 1. Clonar e Instalar Dependencias

Clona el repositorio e instala las dependencias de ambas aplicaciones:

```bash
# Instalar dependencias del frontend
cd chefsito-app
npm install

# Instalar dependencias del backend
cd ../server-chefsito
npm install
```

### 2. Configurar Variables de Entorno

Crea los archivos `.env` en cada carpeta tomando como referencia los ejemplos:

- En `chefsito-app/`, crea un archivo `.env` con:
  ```env
  VITE_API_URL=http://localhost:4000
  ```
- En `server-chefsito/`, crea un archivo `.env` con la configuración de tu base de datos (revisa el apartado de [Variables de Entorno](#-variables-de-entorno-env)):
  ```env
  PORT=4000
  CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
  JWT_SECRET=tu_clave_secreta_aqui
  DATABASE_URL=postgresql://postgres:12345@localhost:5432/chefsito
  ```

### 3. Configurar la Base de Datos y Correr las Pruebas

Inicializa la base de datos de PostgreSQL (debes tener la base `chefsito` creada) y ejecuta los scripts semilla:

```bash
# Dentro de la carpeta /server-chefsito:

# 1. Crear el esquema y cargar las tablas
npm run db:schema

# 2. Cargar los datos de prueba y hashear las contraseñas
npm run db:seed

# 3. Validar la integridad relacional (Claves foráneas y borrado en cascada)
npm run db:verify
```

### 4. Iniciar Servidores de Desarrollo

Abre dos terminales para iniciar las aplicaciones en paralelo:

```bash
# Terminal 1: Iniciar API Backend (Escucha en puerto 4000)
cd server-chefsito
npm run dev

# Terminal 2: Iniciar Frontend (Escucha en puerto 5173)
cd chefsito-app
npm run dev
```

---

## 🗃️ Variables de Entorno (.env)

### Backend (`server-chefsito/.env`)
- `PORT`: Puerto donde escucha el servidor de Express (por defecto `4000`).
- `CLIENT_ORIGIN`: Orígenes autorizados por CORS para interactuar con la API (separados por coma).
- `JWT_SECRET`: Llave secreta para firmar y validar tokens de sesión de usuario.
- `DATABASE_URL`: Cadena de conexión JDBC de PostgreSQL. Formato: `postgresql://[usuario]:[contraseña]@[host]:[puerto]/[base_de_datos]`.

### Frontend (`chefsito-app/.env`)
- `VITE_API_URL`: URL base de la API del servidor (por defecto `http://localhost:4000`).

---

## 🔑 Credenciales de Demostración

La base de datos se siembra con usuarios de prueba correspondientes a los 5 roles del sistema. La contraseña para **todos** ellos es `password`.

| Correo | Rol de Usuario | Restaurante Asignado / Permisos |
|---|---|---|
| `admin@chefsito.mx` | **Administrador** | Consola total de control de locales, personal y demo N:M académica |
| `gerente@comalroma.mx` | **Gerente** | Sucursal Chilaquiles. Configuración de estado, reportes, anuncios |
| `recepcion@comalroma.mx` | **Recepcionista** | Sucursal Chilaquiles. Control de fila de espera, llamar y liberar turnos |
| `soporte@chefsito.mx` | **Soporte** | Monitoreo en tiempo real de filas y bitácora de mensajes (solo lectura) |
| `mariana@demo.mx` | **Cliente** | Buscar restaurantes, unirse a fila y editar perfil de comensal |
| `sofia@demo.mx` | **Cliente** | Buscar restaurantes, unirse a fila y editar perfil de comensal |

---

## 🌐 Enlaces de Despliegue (Producción)

Chefsito está configurado para un despliegue veloz y sin servidor (serverless) en la nube:

- **Frontend (Vercel)**: 
  - *URL de producción*: [https://chefsito-app.vercel.app](https://chefsito-app.vercel.app) *(Marcador de posición)*
  - *Despliegue*: Vinculado a la rama `main` de GitHub. Soporta compilaciones incrementales.
- **Backend (Render / Railway)**:
  - *URL de API*: [https://api-chefsito.onrender.com](https://api-chefsito.onrender.com) *(Marcador de posición)*
  - *Despliegue*: Configurado como servicio de Web Service persistente de Node.js con redirección de Sockets.
- **Base de Datos (Supabase / Neon)**:
  - *Host de PostgreSQL*: Neon serverless database.
  - *Despliegue*: Instancia gestionada en la nube con escalado a cero para optimización de consumo.
