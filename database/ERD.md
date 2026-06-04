# Diagrama Entidad-Relación (ERD) - Chefsito

A continuación se detalla la estructura física y lógica de la base de datos de Chefsito. Se especifican todas las llaves primarias (PK), foráneas (FK), relaciones (1:1, 1:N, N:M) y tipos definidos en PostgreSQL.

## Diagrama en Mermaid

```mermaid
erDiagram
    %% Tipos Enums y Relaciones
    USERS ||--|| USER_PROFILES : "1:1 (tiene perfil)"
    USERS ||--oN REFRESH_TOKENS : "1:N (posee tokens)"
    USERS ||--oN PUBLICACIONES : "1:N (escribe anuncios)"
    USERS ||--oN WAITLIST_ENTRIES : "1:N (se une a filas)"
    USERS ||--oN NOTIFICATIONS : "1:N (recibe notificaciones)"
    USERS ||--oN USER_ROLES_JUNCTION : "1:N (tiene asignados)"
    ROLES ||--oN USER_ROLES_JUNCTION : "1:N (asociados a)"
    
    RESTAURANTS ||--oN RESTAURANT_STAFF : "1:N (cuenta con personal)"
    USERS ||--oN RESTAURANT_STAFF : "1:N (forma parte de)"
    
    RESTAURANTS ||--oN WAITLIST_ENTRIES : "1:N (tiene fila de espera)"
    WAITLIST_ENTRIES ||--oN NOTIFICATIONS : "1:N (desencadena notificaciones)"
    RESTAURANTS ||--oN DAILY_ANALYTICS : "1:N (genera analítica diaria)"
    RESTAURANTS ||--oN HOURLY_ANALYTICS : "1:N (registra analítica horaria)"
    
    ESTUDIANTES ||--oN ESTUDIANTE_CURSOS : "1:N (está inscrito)"
    CURSOS ||--oN ESTUDIANTE_CURSOS : "1:N (contiene estudiantes)"

    USERS {
        uuid id PK
        varchar_120 name
        varchar_255 email UK
        varchar_20 phone
        varchar_255 password_hash
        user_role role
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    USER_PROFILES {
        uuid user_id PK_FK
        text bio
        varchar_255 avatar_url
        jsonb preferences
        timestamptz updated_at
    }

    PUBLICACIONES {
        uuid id PK
        uuid user_id FK
        varchar_255 title
        text content
        timestamptz created_at
    }

    ROLES {
        uuid id PK
        varchar_50 name UK
        text description
    }

    USER_ROLES_JUNCTION {
        uuid user_id PK_FK
        uuid role_id PK_FK
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar_255 token_hash
        timestamptz expires_at
        timestamptz created_at
    }

    RESTAURANTS {
        uuid id PK
        varchar_120 name
        varchar_80 cuisine
        varchar_255 address
        numeric_10_7 lat
        numeric_10_7 lng
        int table_count
        restaurant_status status
        int estimated_wait_minutes
        uuid manager_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    RESTAURANT_STAFF {
        uuid id PK
        uuid restaurant_id FK
        uuid user_id FK
    }

    WAITLIST_ENTRIES {
        uuid id PK
        uuid restaurant_id FK
        uuid user_id FK
        int party_size
        waitlist_status status
        int position
        timestamptz registered_at
        timestamptz called_at
        timestamptz arrived_at
        timestamptz cancelled_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid waitlist_entry_id FK
        uuid user_id FK
        varchar_20 channel
        text message
        varchar_20 status
        timestamptz sent_at
    }

    DAILY_ANALYTICS {
        uuid id PK
        uuid restaurant_id FK
        date report_date
        int total_entries
        int no_shows
        int avg_wait_minutes
        smallint peak_hour
    }

    HOURLY_ANALYTICS {
        uuid id PK
        uuid restaurant_id FK
        date report_date
        smallint hour
        int entries
    }

    ESTUDIANTES {
        uuid id PK
        varchar_120 name
        varchar_255 email UK
        timestamptz created_at
    }

    CURSOS {
        uuid id PK
        varchar_20 code UK
        varchar_120 name
        int credits
    }

    ESTUDIANTE_CURSOS {
        uuid estudiante_id PK_FK
        uuid curso_id PK_FK
        timestamptz enrolled_at
    }
```

## Explicación de Relaciones Obligatorias de Rúbrica

1. **Relación 1:1 (Usuario <-> Perfil)**:
   - Representada por la tabla `users` y `user_profiles`.
   - La clave foránea `user_profiles.user_id` es también la clave primaria (PK) de dicha tabla, lo que garantiza por restricción física de base de datos que no pueda existir más de un perfil por cada usuario.
   
2. **Relación 1:N (Usuario -> Publicaciones)**:
   - Representada por `users` y `publicaciones`.
   - Un usuario de tipo gerente o administrador puede crear múltiples anuncios, los cuales se enlazan mediante `publicaciones.user_id`. Un anuncio pertenece a un único creador.

3. **Relaciones N:M (Muchos a Muchos)**:
   - **Usuarios <-> Roles**: Un usuario puede poseer múltiples roles y un rol puede pertenecer a múltiples usuarios. La relación se rompe mediante la tabla intermedia `user_roles_junction` mapeando `user_id` y `role_id`.
   - **Estudiantes <-> Cursos**: Representación literal del ejemplo escolar de la rúbrica. Un estudiante se inscribe a varias materias, y un curso tiene matriculados a varios alumnos. Se rompe mediante `estudiante_cursos` mapeando las claves `estudiante_id` y `curso_id` de forma conjunta.
   - **Personal de Restaurante**: Un usuario puede formar parte del staff de diferentes locales, y un restaurante tiene asignados a múltiples empleados de mostrador. Se rompe mediante `restaurant_staff`.
