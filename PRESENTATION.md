# Guía de Presentación Final - Chefsito

Esta guía estructurada cubre todos los requerimientos solicitados para la **Presentación Final** del proyecto de Construcción de Software (Rúbrica: 10%). Úsala como base para las diapositivas o tu discurso ante el sínodo.

---

## 💻 Diapositiva 1: Portada y Proyecto
- **Título**: Chefsito (Plataforma Inteligente de Fila de Espera en Tiempo Real)
- **Subtítulo**: Solución modular y reactiva para la gestión de aforo y reducción de fricción en tiempos de espera.
- **Integrantes**: [Nombres del Equipo]

---

## 🧩 Diapositiva 2: El Problema que Resuelve
- **El Dolor del Cliente**:
  - Filas físicas largas, desorganizadas y frustrantes en restaurantes populares.
  - Pérdida de clientes potenciales que deciden irse al ver la fila llena.
  - Falta de visibilidad para los comensales sobre su tiempo real de espera.
- **El Dolor del Restaurante**:
  - Personal de mostrador abrumado manejando libretas físicas de papel.
  - Dificultad para avisar a los clientes cuando su mesa está lista (gritos en la entrada, localizadores costosos).
  - Cero métricas o analíticas sobre el flujo de clientes por hora o pérdidas por cancelaciones (no-shows).
- **La Solución**:
  - Una aplicación web multiplataforma donde el cliente se une a la fila escaneando un QR o mediante un mapa interactivo.
  - Actualización del estado en tiempo real (Sockets) y avisos automáticos en el navegador y notificaciones push.
  - Consola de control simplificada para el recepcionista y dashboard de analíticas para el gerente.

---

## 🏗️ Diapositiva 3: Arquitectura Técnica y Calidad
- **Estructura Modular Separada**:
  - **Frontend (Client-side)**: React (v19) + Vite + Tailwind CSS (v4). Single Page Application reactiva optimizada para móviles y escritorio.
  - **Backend (Server-side)**: Node.js + Express. Arquitectura limpia organizada en capas de control (Rutas), lógica de negocio (Servicios), persistencia (Base de Datos) y seguridad (Middlewares).
  - **Tiempo Real**: Socket.io para actualización instantánea de turnos y estados de locales sin necesidad de refrescar o consultar la API constantemente.
  - **Base de Datos**: PostgreSQL (Base de Datos Relacional robusta).
- **Esquema de Seguridad**:
  - Autenticación mediante JSON Web Tokens (JWT) firmados en el servidor y almacenados de forma segura.
  - Middleware de protección de rutas basado en roles (`admin`, `usuario`, `recepcionista`, `gerente`, `soporte`).
  - Encriptación de contraseñas mediante hashing salteado con `bcrypt`.

---

## 🗄️ Diapositiva 4: Base de Datos e Integridad Relacional
- **Relaciones Obligatorias Demostradas**:
  - **1:1 (Usuario <-> Perfil)**: Cada usuario cuenta con un perfil único (`user_profiles`) para almacenar su biografía, foto y preferencias gastronómicas. Clave primaria igual a la foránea.
  - **1:N (Usuario -> Publicaciones)**: Los gerentes y administradores publican anuncios o novedades de los locales (`publicaciones`). Cada anuncio pertenece a un solo usuario creador.
  - **N:M (Muchos a Muchos)**:
    - *Comercial*: `restaurant_staff` que vincula recepcionistas y gerentes con múltiples sucursales de restaurantes.
    - *Académico (Rúbrica)*: `estudiante_cursos` que asocia alumnos (`estudiantes`) inscritos en múltiples materias (`cursos`).
- **Garantías de Integridad**:
  - Integridad referencial mediante restricciones `FOREIGN KEY`.
  - Propagación y limpieza automática de datos huérfanos usando cláusulas `ON DELETE CASCADE`.
  - Evidencia certificada mediante el script de pruebas de estrés y cascade delete: `npm run db:verify`.

---

## 🛠️ Diapositiva 5: Decisiones de Diseño y Retos
- **Decisión 1: Socket.io vs HTTP Polling**:
  - *Reto*: El polling constante satura el servidor de base de datos con consultas repetitivas sobre el estado de la fila.
  - *Solución*: Implementar websockets bidireccionales. El servidor emite un evento `waitlist:changed` cuando un recepcionista atiende a un cliente, lo que gatilla que los clientes actualicen su posición al instante sin saturar la red.
- **Decisión 2: Soft Delete vs Hard Delete**:
  - *Reto*: Eliminar personal o cuentas de usuario directamente rompe la integridad histórica de las analíticas de turnos atendidos.
  - *Solución*: Implementar baja lógica (`is_active = FALSE`) en la tabla de usuarios, inhabilitando accesos pero resguardando los reportes históricos.
- **Decisión 3: Demo Académica Integrada**:
  - *Reto*: Cumplir con la visualización de datos ajenos al giro comercial del restaurante de forma natural.
  - *Solución*: Crear un portal de demostración aislado dentro de la consola del administrador para mostrar visualmente el CRUD N:M escolar sin interferir con la experiencia del cliente de restaurantes.

---

## 🎬 Diapositiva 6: Guía del Demo Funcional (Paso a Paso)
*Para presentar al profesor en vivo:*

1. **Flujo 1: Registro y Perfil (1:1)**:
   - Inicia sesión como cliente (`usuario`).
   - Abre el menú superior, haz clic en **Editar Perfil**.
   - Escribe una biografía breve, pega un URL de imagen de avatar, selecciona una cocina preferida y guarda. Verifica la alerta de éxito.
2. **Flujo 2: Búsqueda y Espera (1:N & waitlist)**:
   - En el mapa, busca locales usando los filtros integrados (abiertos, tipo de cocina).
   - Selecciona "Los Chilaquiles Tec GDL", elige 2 personas y haz clic en **Unirme a la fila**.
   - Visualiza en tiempo real tu tarjeta de turno activo y posición `#4`.
   - Revisa el panel de **Anuncios y Novedades** en el lateral para ver las promociones vigentes publicadas por el gerente del local (Relación 1:N).
3. **Flujo 3: Gestión de Fila por Recepcionista (Sincronía)**:
   - Abre otra pestaña o navegador e ingresa con la cuenta de recepcionista (`recepcion@comalroma.mx`).
   - Haz clic en el botón **Llamar** del cliente recién registrado.
   - Observa cómo en la pestaña del cliente se actualiza instantáneamente a **¡Mesa Lista!** vía Sockets y se genera una alerta visual y de audio.
   - El cliente hace clic en **Confirmar mi llegada**, y la consola del recepcionista se actualiza a **Liberado/Atendido**.
4. **Flujo 4: Consola de Administración Global (CRUD Restaurantes & Staff)**:
   - Inicia sesión como administrador (`admin@chefsito.mx`).
   - Ve a la pestaña **Restaurantes**: edita los datos de un local existente o elimina uno de prueba para demostrar el borrado en cascada física.
   - Ve a la pestaña **Staff**: edita el rol de un recepcionista o dale de baja ("Dar de baja" lógico).
5. **Flujo 5: Demostración Académica N:M (Inscripciones)**:
   - En la consola de administración, haz clic en la pestaña **Demo N:M Académica**.
   - Registra un nuevo curso (ej. Materia de Bases de Datos) y un nuevo estudiante.
   - Utiliza el formulario de unión para inscribir al estudiante al curso recién creado.
   - Visualiza al estudiante con su insignia del curso en la lista, y luego haz clic en la `❌` para dar de baja la inscripción y demostrar la remoción física de la tabla de unión.
