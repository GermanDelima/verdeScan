# Configuración de Google OAuth en Supabase

## Paso 1: Ejecutar el SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Abre el **SQL Editor** (menú lateral izquierdo)
3. Copia y pega el contenido del archivo `supabase-oauth-setup.sql`
4. Ejecuta el SQL haciendo clic en "Run"

Este script creará:
- Una función que automáticamente crea usuarios en la tabla `users` cuando alguien se registra
- Un trigger que ejecuta esta función cuando se crea un usuario en `auth.users`
- Políticas RLS actualizadas que permiten la inserción automática

## Paso 2: Configurar Google OAuth en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Credentials**
4. Haz clic en **Create Credentials** > **OAuth client ID**
5. Si es la primera vez, configura la pantalla de consentimiento:
   - Selecciona **External**
   - Completa la información requerida:
     - Nombre de la aplicación: `VerdeScan`
     - Email de soporte
     - Dominio autorizado: Tu dominio de producción (opcional por ahora)
6. Crea las credenciales OAuth:
   - Tipo de aplicación: **Web application**
   - Nombre: `VerdeScan Web`
   - URIs de redireccionamiento autorizados:
     ```
     https://<TU-PROJECT-ID>.supabase.co/auth/v1/callback
     ```
     Para desarrollo local también agrega:
     ```
     http://localhost:54321/auth/v1/callback
     ```

7. Copia el **Client ID** y **Client Secret** que se generan

## Paso 3: Configurar Google OAuth en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Authentication** > **Providers**
3. Busca **Google** en la lista de proveedores
4. Activa el toggle para habilitar Google
5. Pega las credenciales:
   - **Client ID**: El Client ID de Google Cloud Console
   - **Client Secret**: El Client Secret de Google Cloud Console
6. Copia la **Callback URL** que Supabase te muestra (debería ser algo como `https://<TU-PROJECT-ID>.supabase.co/auth/v1/callback`)
7. Haz clic en **Save**

## Paso 4: Verificar variables de entorno

Asegúrate de que tu archivo `.env.local` tenga las variables correctas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<TU-PROJECT-ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<TU-ANON-KEY>
```

## Paso 5: Instalar dependencia necesaria

Ejecuta el siguiente comando para instalar el paquete de auth helpers de Supabase:

```bash
npm install @supabase/auth-helpers-nextjs
```

## Paso 6: Probar la integración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/login` o `http://localhost:3000/register`

3. Haz clic en el botón "Continuar con Google"

4. Deberías ser redirigido a la pantalla de consentimiento de Google

5. Después de autorizar, serás redirigido de vuelta a tu aplicación y automáticamente logueado

## Solución de problemas

### Error: "new row violates row-level security policy"

Si sigues viendo este error:
1. Verifica que ejecutaste correctamente el SQL del archivo `supabase-oauth-setup.sql`
2. Revisa que el trigger esté activo en **Database** > **Triggers**
3. Verifica las políticas RLS en **Database** > **Policies**

### Error: "redirect_uri_mismatch"

Si ves este error:
1. Verifica que la URI de redirección en Google Cloud Console coincida exactamente con la de Supabase
2. Asegúrate de no tener espacios ni caracteres extra
3. La URI debe ser: `https://<TU-PROJECT-ID>.supabase.co/auth/v1/callback`

### El usuario no se crea en la tabla users

1. Ve a **Database** > **Triggers** en Supabase
2. Verifica que el trigger `on_auth_user_created` esté presente y activo
3. Revisa los logs en **Logs** > **Postgres Logs** para ver si hay errores

## Notas importantes

- El trigger automáticamente extraerá el nombre del usuario desde los metadatos de Google
- Si Google no provee un nombre completo, usará la parte antes del @ del email
- Los usuarios creados con Google OAuth tendrán 0 puntos inicialmente
- El campo `email` será verificado automáticamente por Google
