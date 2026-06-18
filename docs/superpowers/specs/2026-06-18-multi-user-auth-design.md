# Diseño: Autenticación multi-usuario para Denis

Fecha: 2026-06-18
Estado: Aprobado por el usuario, pendiente de implementación

> Nota de idioma: este documento es para revisión del stakeholder (hispanohablante).
> El código, identificadores, nombres de tablas/columnas, SQL y comentarios van en inglés.

## Objetivo

Pasar Denis de una app mono-usuario con base de datos abierta a una app
multi-usuario donde cada estudiante ve y edita **solo sus propios datos**, con
cuentas creadas por invitación desde un panel de administración interno.

## Decisiones cerradas

1. **Roles:** `admin` y `user`.
2. **Acceso:** solo por invitación. Registro público deshabilitado.
3. **Login:** email + contraseña.
4. **Primer ingreso:** el sistema obliga a cambiar la contraseña.
5. **Olvido de contraseña:** lo resuelve el admin (reset manual desde el panel). Sin auto-reset por email.
6. **Aislamiento:** cada usuario ve solo sus datos. El admin **NO** ve datos de estudio de otros; solo gestiona cuentas.
7. **El admin es también un usuario normal:** tiene sus propias materias además de los poderes de administración.

## Modelo de identidad

- Se usa **Supabase Auth** (email + password). Confirmación de email deshabilitada
  (las cuentas se crean ya confirmadas vía admin API).
- **Rol** en `app_metadata.role` (`'admin'` | `'user'`). Viaja en el JWT → las
  políticas RLS lo leen sin joins. Solo modificable con `service_role`.
- **Flag de cambio forzado** en `user_metadata.must_change_password` (`true` al
  crear/resetear). El propio usuario lo pone en `false` tras cambiar su clave.
- No se crea tabla `profiles`: el listado de usuarios del panel usa la admin API.

## Cambios en la base de datos (migración nueva)

Tablas afectadas: `subjects`, `subject_files`, `topics`, `calendar_events`,
`planner_entries`, `study_logs`, `reminder_settings`.

1. Agregar `user_id uuid not null references auth.users(id) on delete cascade
   default auth.uid()` a cada tabla.
2. **`reminder_settings`**: deja de ser fila única global → una fila por usuario.
   Quitar el singleton `id = 1`; unicidad por `user_id`.
3. **`study_logs`**: el `unique(log_date)` pasa a `unique(user_id, log_date)`.
4. **RLS**: reemplazar las políticas `using(true) with check(true)` por:
   - `using (auth.uid() = user_id)` y `with check (auth.uid() = user_id)` en
     SELECT/INSERT/UPDATE/DELETE de cada tabla.
5. **Storage**: los archivos pasan a carpeta por usuario `{user_id}/{subject_id}/...`.
   Política del bucket `subject-files`: el primer segmento de la ruta debe ser
   `auth.uid()` (`(storage.foldername(name))[1] = auth.uid()::text`).
6. **Backfill**: asignar todas las filas existentes (datos de prueba actuales) al
   `user_id` del admin bootstrap.

## Flujo de autenticación y rutas

- Nueva dependencia: **`@supabase/ssr`** para sesiones por cookie en server
  components, route handlers, server actions y middleware.
- `middleware.ts`: protege toda la app.
  - Sin sesión → redirige a `/login`.
  - Con sesión pero `must_change_password === true` → fuerza `/cambiar-clave`.
  - Rutas `/admin/*` → solo `role === 'admin'`.
- Páginas nuevas:
  - `/login` — email + contraseña.
  - `/cambiar-clave` — set new password; al guardar limpia el flag.
- Botón de **cerrar sesión** en la navegación.

## Panel de administración (`/admin/usuarios`)

Visible solo para `admin`. Todas las operaciones corren en server actions/route
handlers usando un cliente con `service_role` (nunca expuesto al navegador), y
cada acción verifica que el llamante tenga `role === 'admin'`.

- **Crear usuario**: email, nombre, contraseña inicial → `email_confirm: true`,
  `app_metadata.role = 'user'`, `user_metadata.must_change_password = true`.
- **Listar usuarios** (admin API).
- **Resetear contraseña**: setea nueva clave + `must_change_password = true`.
- **Desactivar / reactivar** cuenta (ban).

## Cambios en el código existente

- Las server actions actuales pasan a usar el cliente server con sesión del
  request. El filtrado por usuario lo hace el RLS automáticamente; la lógica de
  negocio casi no cambia.
- `reminder_settings`: la acción deja de asumir `id = 1`; usa la fila del usuario
  (la crea con defaults si no existe).
- Subida de archivos: el path incluye `user_id` como primera carpeta.

## Bootstrap del primer admin

- Script/seed de un solo uso (con `service_role`):
  - Crea `admin@denis.com` con contraseña inicial `1234` (temporal),
    `app_metadata.role = 'admin'`, `user_metadata.must_change_password = true`.
  - Reasigna los datos existentes a su `user_id`.
- En el primer login el sistema obliga a cambiar la contraseña.

## Fuera de alcance (YAGNI por ahora)

- Auto-reset de contraseña por email.
- OAuth (Google).
- Compartir datos entre usuarios.
- Auditoría / logs de acceso.
- Multi-admin con promoción de roles desde la UI (el rol se setea al crear; se
  puede agregar después).

## Riesgos y notas

- **Contraseña inicial débil (`1234`)**: aceptable solo porque el primer login
  fuerza el cambio. Cambiar por una fuerte de inmediato.
- **`service_role` key**: vive solo en variables de entorno del servidor
  (Vercel), nunca con prefijo `NEXT_PUBLIC_`. Si se filtra, expone toda la base.
- **Migración destructiva sobre datos de prueba**: hacer respaldo antes de correr
  la migración si hubiera datos que importen.
- Verificar convenciones de Supabase Auth + Next.js 16 en
  `node_modules/next/dist/docs/` antes de implementar (regla de AGENTS.md).
