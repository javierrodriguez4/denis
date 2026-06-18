# Denis — Organizador de estudio para medicina

Denis te ayuda a organizar materias, calendario académico, planner semanal y recordatorios. Funciona en el navegador de tu celular y computadora.

## Qué puedes hacer

- **Materias:** carpetas con programa, libros y presentaciones
- **Calendario:** parciales, finales y presentaciones
- **Planner semanal:** temas por día con checklist (leído / estudiado / repasado)
- **Extracción de temas:** sube el PDF del programa y revisa los temas sugeridos
- **Recordatorios:** avisos antes de exámenes y presentaciones

---

## Desarrollo local con Docker

Esta computadora puede levantar todo el stack sin cuentas externas:

```bash
# 1. Base de datos + storage (Supabase en Docker)
npx supabase start
npx supabase db reset --yes

# 2. App (modo desarrollo)
npm install
npm run dev
```

Abre **http://localhost:3000**

| Servicio | URL |
|----------|-----|
| App Denis | http://localhost:3000 |
| Supabase Studio (admin BD) | http://127.0.0.1:54323 |
| API Supabase | http://127.0.0.1:54321 |

O usa el script todo-en-uno:

```bash
./scripts/start-stack.sh
npm run dev
```

### App en Docker (producción local)

```bash
npx supabase start
docker compose up --build
```

---

## Paso 1 — Instalar Node.js (solo una vez)

Si aún no tienes Node.js, descárgalo desde [https://nodejs.org](https://nodejs.org) (versión LTS) e instálalo con las opciones por defecto.

---

## Paso 2 — Crear cuenta en Supabase (gratis)

1. Entra a [https://supabase.com](https://supabase.com) y crea una cuenta.
2. Clic en **New project** y elige un nombre (ej: `denis-estudio`).
3. Espera a que el proyecto termine de crearse (~2 minutos).
4. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**

### Crear la base de datos

1. En Supabase, abre **SQL Editor**.
2. Clic en **New query**.
3. Copia todo el contenido del archivo `supabase/migrations/001_initial.sql` de este proyecto.
4. Clic en **Run**.

### Crear el almacén de archivos

1. Ve a **Storage** en el menú lateral.
2. Si no existe el bucket `subject-files`, créalo (privado).
3. Si el SQL anterior no lo creó, en Storage → **New bucket** → nombre: `subject-files`, desmarcar "Public bucket".

---

## Paso 3 — Configurar la app en tu computadora

1. Abre una terminal en la carpeta del proyecto `denis`.
2. Copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```
3. Edita `.env.local` con un editor de texto y pega tus claves de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. *(Opcional, recomendado para mejor extracción de temas)* Agrega tu clave de Anthropic:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   Sin esta clave, la app igual extrae temas de forma básica desde el PDF.

5. Instala dependencias y arranca:
   ```bash
   npm install
   npm run dev
   ```
6. Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Paso 4 — Publicar en internet (opcional, recomendado)

Para usar Denis desde el celular sin depender de tu computadora:

1. Crea cuenta en [https://vercel.com](https://vercel.com).
2. Conecta tu repositorio de GitHub con el proyecto.
3. En Vercel, agrega las mismas variables de entorno que en `.env.local`.
4. Despliega. Vercel te dará un enlace tipo `https://tu-app.vercel.app`.

---

## Paso 5 — Instalar en el celular

1. Abre el enlace de Denis en **Chrome** (Android) o **Safari** (iPhone).
2. **Android:** menú ⋮ → "Agregar a pantalla de inicio" o "Instalar app".
3. **iPhone:** botón Compartir → "Agregar a pantalla de inicio".
4. Ve a **Ajustes** en Denis y toca **Activar notificaciones**.

---

## Guía de uso diario

### Crear una materia
1. Ve a **Materias** → escribe el nombre → **Agregar materia**.

### Subir archivos
1. Entra a la materia.
2. Elige el tipo (programa, libro, presentación).
3. **Subir archivo**.

### Extraer temas del programa
1. Sube el PDF del programa curricular (tipo "Programa curricular").
2. Toca el botón con el nombre del PDF bajo "Extraer temas".
3. Revisa la lista, edita lo que haga falta.
4. **Confirmar temas**.
5. Opcional: **Distribuir automáticamente** hasta la fecha del examen.

### Calendario
1. Ve a **Calendario** → **Nuevo evento**.
2. Elige tipo (parcial, final, presentación), fecha y materia.

### Planner
1. Ve a **Planner** para ver la semana.
2. Marca cada tema como **Leído**, **Estudiado** o **Repasado**.

### Recordatorios
1. Ve a **Ajustes**.
2. Elige cuántos días antes avisar (7, 3 y 1 día por defecto).
3. Activa las notificaciones del navegador.

---

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| Banner "Configuración pendiente" | Revisa que `.env.local` tenga las claves correctas y reinicia `npm run dev` |
| No se extraen temas del PDF | El PDF puede ser un escaneo; usa versión digital o carga temas a mano |
| No llegan notificaciones | Instala la app en pantalla de inicio y activa permisos en Ajustes |
| Error al subir archivos | Verifica que el bucket `subject-files` exista en Supabase Storage |

---

## Soporte técnico

Este proyecto fue creado para uso personal de estudio. Si algo no funciona, revisa primero la configuración de Supabase y las variables de entorno.
