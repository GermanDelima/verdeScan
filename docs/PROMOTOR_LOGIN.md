# Sistema de Login para Promotores y Ecopuntos

## Descripción

Se ha implementado un sistema de autenticación separado para que los **Promotores/Kioskeros** y **Ecopuntos** puedan acceder a su propio panel de control usando **nombre de usuario y contraseña**.

## Características Implementadas

- ✅ Página de login exclusiva para promotores y ecopuntos
- ✅ Autenticación con nombre de usuario y contraseña
- ✅ Dashboard personalizado según el tipo de cuenta
- ✅ Sesión almacenada en localStorage
- ✅ Enlace desde la página de login principal

## Flujo de Uso

### 1. Acceso al Login

Hay dos formas de acceder:

**Opción A - Desde la página principal:**
1. Ve a `http://localhost:3000/login`
2. Haz scroll hacia abajo
3. Haz clic en el botón **"Soy Promotor / Ecopunto"**

**Opción B - Directo:**
- Ve a `http://localhost:3000/promotor/login`

### 2. Iniciar Sesión

1. Ingresa tu **nombre de usuario** (el que creó el administrador)
2. Ingresa tu **contraseña**
3. Haz clic en **"Iniciar Sesión"**
4. Serás redirigido a tu dashboard

### 3. Dashboard de Promotor/Ecopunto

Una vez autenticado, verás:
- Tu información de cuenta
- Tipo de cuenta (Promotor o Ecopunto)
- ID de cuenta
- Último acceso
- Botón para cerrar sesión

## Crear Cuentas de Promotores/Ecopuntos

### Como Administrador:

1. Inicia sesión en `/admin/dashboard`
2. Completa el formulario "Crear Nueva Cuenta"
3. Ingresa:
   - **Nombre de Usuario**: Ejemplo: `kioskero_centro`
   - **Contraseña**: Mínimo 6 caracteres
   - **Tipo de Cuenta**: Selecciona "Promotor / Kioskero" o "Ecopunto"
4. Haz clic en **"Crear Cuenta"**

### Credenciales de Ejemplo:

Después de crear una cuenta, proporciona estas credenciales al promotor:

```
Usuario: kioskero_centro
Contraseña: la-que-configuraste
URL: http://localhost:3000/promotor/login
```

## Diferencias entre Tipos de Cuenta

### Promotor / Kioskero
- Icono: 👥 (Usuarios)
- Color: Azul
- Función: Gestionar validaciones en kioscos

### Ecopunto
- Icono: 🏪 (Tienda)
- Color: Morado
- Función: Gestionar punto de reciclaje más grande

## Estructura de Archivos

```
src/
├── app/
│   ├── promotor/
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   └── dashboard/
│   │       └── page.tsx          # Dashboard de promotor/ecopunto
│   └── api/
│       └── promotor/
│           └── auth/
│               └── route.ts      # API de autenticación
```

## Seguridad

### Almacenamiento de Sesión

La sesión se guarda en `localStorage` con la siguiente estructura:

```json
{
  "id": "uuid-del-usuario",
  "username": "nombre-usuario",
  "account_type": "promotor" | "ecopunto",
  "loginTime": "2025-10-26T..."
}
```

### Protección de Rutas

El dashboard verifica automáticamente si hay una sesión válida:
- Si **no hay sesión**: Redirige a `/promotor/login`
- Si **hay sesión**: Muestra el dashboard

### Cerrar Sesión

Para cerrar sesión:
1. Haz clic en el botón **"Cerrar Sesión"**
2. La sesión se elimina de localStorage
3. Redirige a la página de login

## Mejoras Futuras Sugeridas

El dashboard actualmente es básico. Próximas funcionalidades a implementar:

1. **Validación de Entregas**
   - Escanear QR de usuarios
   - Validar tokens únicos (OTC)
   - Acreditar puntos a usuarios

2. **Historial de Transacciones**
   - Ver todas las validaciones realizadas
   - Filtrar por fecha
   - Exportar reportes

3. **Estadísticas**
   - Total de validaciones del día/mes
   - Cantidad de material recibido
   - Gráficos de actividad

4. **Gestión de Inventario** (Solo Ecopuntos)
   - Control de material acumulado
   - Notificaciones de capacidad

5. **Comunicación**
   - Chat con administrador
   - Notificaciones del sistema

## Ejemplo de Flujo Completo

### Paso 1: Admin crea cuenta
```
Admin Dashboard → Crear Nueva Cuenta
- Username: kioskero_centro
- Password: Centro2025!
- Type: Promotor
→ Cuenta creada ✅
```

### Paso 2: Admin comparte credenciales
```
Email/WhatsApp al Kioskero:
"Hola! Tu cuenta está lista:
Usuario: kioskero_centro
Contraseña: Centro2025!
Link: http://localhost:3000/promotor/login"
```

### Paso 3: Promotor inicia sesión
```
1. Va a /promotor/login
2. Ingresa: kioskero_centro / Centro2025!
3. Click "Iniciar Sesión"
4. ✅ Redirigido a /promotor/dashboard
```

### Paso 4: Promotor ve su dashboard
```
Panel de Promotor / Kioskero
Bienvenido, kioskero_centro

Información de Cuenta:
- Usuario: kioskero_centro
- Tipo: Promotor
- ID: a15946bf...
- Último Acceso: 26/10/2025, 14:30
```

## Solución de Problemas

### Error: "Usuario o contraseña incorrectos"
- Verifica que el username sea exactamente igual (case-sensitive)
- Verifica que la contraseña sea correcta
- Confirma que la cuenta esté activa en el panel de admin

### No se guarda la sesión
- Verifica que localStorage esté habilitado en el navegador
- Revisa la consola del navegador (F12) para errores

### Redirige al login después de iniciar sesión
- Limpia el localStorage: `localStorage.clear()`
- Intenta iniciar sesión nuevamente
- Verifica la consola para errores de API

## API Endpoints

### POST /api/promotor/auth
Autenticar un promotor/ecopunto.

**Request:**
```json
{
  "username": "kioskero_centro",
  "password": "Centro2025!"
}
```

**Response Exitoso:**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "account": {
    "id": "uuid",
    "username": "kioskero_centro",
    "account_type": "promotor",
    "created_at": "2025-10-26T..."
  }
}
```

**Response Error:**
```json
{
  "error": "Usuario o contraseña incorrectos"
}
```

## Notas Técnicas

- Las contraseñas se hashean usando Base64 (⚠️ **cambiar a bcrypt en producción**)
- La autenticación no usa Supabase Auth, es un sistema custom
- Las sesiones no expiran automáticamente (implementar en futuro)
- El SERVICE_ROLE_KEY se usa para acceder a staff_accounts

---

**¿Listo para usar?**

1. Asegúrate de haber ejecutado las migraciones
2. Crea cuentas desde el panel de admin
3. Comparte las credenciales con los promotores
4. ¡Empieza a validar reciclaje! 🌱
