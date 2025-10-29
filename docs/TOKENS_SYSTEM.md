# Sistema de Tokens OTP para Validación de Reciclaje

## Descripción General

El sistema de tokens OTP (One-Time Password) permite a los usuarios generar códigos únicos cuando desean reciclar material, y a los promotores/ecopuntos validar estos códigos para acreditar puntos automáticamente.

## Flujo Completo del Sistema

### 1. Usuario Genera Token

**Pasos:**
1. Usuario inicia sesión en su cuenta
2. Toca el botón "Canjear" en el dashboard
3. Selecciona el tipo de material:
   - Aceite Vegetal Usado (AVU) - 20 puntos
   - Lata de Aluminio - 1 punto
   - Botella de Plástico - 1 punto
4. El sistema genera un token único de 6 caracteres
5. Se muestra el código en pantalla grande
6. Token válido por 15 minutos

**Ejemplo de token generado:**
```
Código: A3B9K2
Material: Lata de Aluminio
Puntos: +1 punto
Válido hasta: 14:45
```

### 2. Usuario Presenta Material

**Pasos:**
1. Usuario va al kiosco/ecopunto
2. Entrega el material físicamente
3. Muestra el código de 6 dígitos al promotor

### 3. Promotor Valida Token

**Pasos:**
1. Promotor verifica que el material es correcto
2. Ingresa el código de 6 dígitos en su dashboard
3. Click en "Validar y Acreditar Puntos"
4. El sistema:
   - Verifica que el token existe
   - Verifica que no esté expirado
   - Verifica que no haya sido usado
   - Acredita los puntos al usuario
   - Marca el token como validado

**Resultado exitoso:**
```
✓ Token validado y puntos acreditados exitosamente

Usuario: Juan Pérez
Material: Lata de Aluminio
Puntos Acreditados: +1 punto
Total del usuario: 15 puntos
```

## Tipos de Material y Puntos

| Material | Código | Puntos | Descripción |
|----------|--------|--------|-------------|
| Aceite Vegetal Usado | `avu` | 20 | 1 Litro de AVU |
| Lata de Aluminio | `lata` | 1 | 1 Lata |
| Botella de Plástico | `botella` | 1 | 1 Botella |

## Estructura de la Base de Datos

### Tabla: `recycling_tokens`

```sql
CREATE TABLE recycling_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_code TEXT NOT NULL UNIQUE,
  material_type TEXT NOT NULL, -- 'avu', 'lata', 'botella'
  points_value INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'validated', 'expired', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES staff_accounts(id),
  validation_location TEXT
);
```

### Tabla: `material_points_config`

```sql
CREATE TABLE material_points_config (
  material_type TEXT PRIMARY KEY,
  points_per_unit INTEGER NOT NULL,
  unit_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## API Endpoints

### POST /api/tokens/generate

Genera un nuevo token de reciclaje.

**Request:**
```json
{
  "material_type": "lata"
}
```

**Response Exitoso (201):**
```json
{
  "success": true,
  "token": {
    "id": "uuid",
    "code": "A3B9K2",
    "material_type": "lata",
    "points_value": 1,
    "expires_at": "2025-10-26T15:00:00Z",
    "unit_description": "1 Lata de Aluminio"
  }
}
```

**Errores:**
- `401` - No autenticado
- `400` - Tipo de material inválido
- `500` - Error al generar token

### POST /api/tokens/validate

Valida un token y acredita puntos.

**Request:**
```json
{
  "token_code": "A3B9K2",
  "staff_id": "uuid-del-promotor"
}
```

**Response Exitoso (200):**
```json
{
  "success": true,
  "message": "Token validado y puntos acreditados exitosamente",
  "validation": {
    "user_name": "Juan Pérez",
    "user_email": "juan@example.com",
    "material_type": "lata",
    "points_credited": 1,
    "previous_points": 14,
    "new_points": 15,
    "validated_by": "kioskero1",
    "validated_at": "2025-10-26T14:30:00Z"
  }
}
```

**Errores:**
- `400` - Faltan parámetros
- `403` - Staff no válido o inactivo
- `404` - Token no encontrado
- `400` - Token ya validado/expirado/cancelado
- `500` - Error al acreditar puntos

## Estados del Token

### 1. **pending** (Pendiente)
- Token recién creado
- Aún no validado
- Puede ser validado

### 2. **validated** (Validado)
- Token fue validado por un promotor
- Puntos ya acreditados
- No puede volver a usarse

### 3. **expired** (Expirado)
- Han pasado más de 15 minutos desde su creación
- No puede ser validado
- Usuario debe generar uno nuevo

### 4. **cancelled** (Cancelado)
- Usuario canceló el token
- No puede ser validado

## Seguridad y Prevención de Fraude

### Validaciones del Sistema

1. **Token Único:** Cada código es único y solo se puede usar una vez
2. **Expiración:** Tokens válidos por 15 minutos solamente
3. **Verificación de Estado:** No se pueden validar tokens ya usados o expirados
4. **Trazabilidad:** Se registra quién validó el token y cuándo
5. **Autenticación:** Solo staff autenticado puede validar tokens

### Límites y Restricciones

- Un usuario puede tener múltiples tokens pendientes
- Un token solo puede validarse una vez
- Los tokens expirados se marcan automáticamente
- Se registra la ubicación/nombre del promotor que validó

## Casos de Uso

### Caso 1: Validación Exitosa

```
1. Usuario: Selecciona "Lata de Aluminio"
2. Sistema: Genera token "X9Y3Z1"
3. Usuario: Va al kiosco con su lata
4. Promotor: Recibe la lata
5. Promotor: Ingresa "X9Y3Z1"
6. Sistema: ✓ Válida y acredita 1 punto
7. Usuario: Recibe notificación de puntos acreditados
```

### Caso 2: Token Expirado

```
1. Usuario: Genera token "A1B2C3"
2. Usuario: No va al kiosco en 15 minutos
3. Promotor: Intenta validar "A1B2C3"
4. Sistema: ✗ "Este token ha expirado"
5. Usuario: Debe generar un nuevo token
```

### Caso 3: Token Ya Validado

```
1. Usuario: Genera token "D4E5F6"
2. Promotor: Valida "D4E5F6" exitosamente
3. Otro promotor: Intenta validar "D4E5F6" nuevamente
4. Sistema: ✗ "Este token ya fue validado anteriormente"
```

## Instrucciones de Configuración

### 1. Ejecutar Migración

```sql
-- En Supabase SQL Editor
-- Ejecutar: migrations/create-tokens-system.sql
```

Esto creará:
- Tabla `recycling_tokens`
- Tabla `material_points_config`
- Función `generate_token_code()`
- Función `expire_old_tokens()`
- Políticas RLS

### 2. Verificar Configuración de Puntos

```sql
SELECT * FROM material_points_config;
```

Deberías ver:
```
| material_type | points_per_unit | unit_description              |
|---------------|----------------|-------------------------------|
| avu           | 20             | 1 Litro de Aceite Vegetal Usado |
| lata          | 1              | 1 Lata de Aluminio            |
| botella       | 1              | 1 Botella de Plástico         |
```

### 3. Probar el Flujo

**Como Usuario:**
1. Login en `/login`
2. Click en "Canjear"
3. Seleccionar material
4. Ver el código generado

**Como Promotor:**
1. Login en `/promotor/login`
2. Ingresar el código del usuario
3. Click en "Validar y Acreditar Puntos"
4. Ver confirmación

## Mantenimiento

### Limpiar Tokens Expirados

Ejecutar periódicamente (por ejemplo, con un cron job):

```sql
SELECT expire_old_tokens();
```

Esto marca todos los tokens pendientes que hayan expirado.

### Ver Estadísticas de Tokens

```sql
-- Tokens por estado
SELECT status, COUNT(*) as count
FROM recycling_tokens
GROUP BY status;

-- Tokens validados por promotor
SELECT
  sa.username,
  COUNT(*) as validations,
  SUM(rt.points_value) as total_points
FROM recycling_tokens rt
JOIN staff_accounts sa ON rt.validated_by = sa.id
WHERE rt.status = 'validated'
GROUP BY sa.username
ORDER BY validations DESC;

-- Material más reciclado
SELECT
  material_type,
  COUNT(*) as count,
  SUM(points_value) as total_points
FROM recycling_tokens
WHERE status = 'validated'
GROUP BY material_type
ORDER BY count DESC;
```

## Mejoras Futuras

1. **Notificaciones Push:** Notificar al usuario cuando sus puntos se acrediten
2. **Historial de Tokens:** Mostrar tokens anteriores en el dashboard del usuario
3. **QR Code:** Generar QR code además del código alfanumérico
4. **Geolocalización:** Verificar que el usuario esté cerca del ecopunto
5. **Estadísticas:** Dashboard con métricas de reciclaje
6. **Límites Diarios:** Prevenir fraude con límites de tokens por día
7. **Validación por Foto:** Opción de adjuntar foto del material

## Solución de Problemas

### Token no se genera

**Síntoma:** Al seleccionar material, no aparece el modal
**Solución:**
- Verificar que la migración fue ejecutada
- Verificar consola del navegador (F12) para errores
- Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté configurada

### Token no se puede validar

**Síntoma:** Error al ingresar código en dashboard de promotor
**Solución:**
- Verificar que el código sea correcto (6 caracteres)
- Verificar que no haya expirado (15 minutos)
- Verificar que el promotor esté autenticado
- Verificar consola para errores de API

### Puntos no se acreditan

**Síntoma:** Token valida pero puntos no aparecen
**Solución:**
- Refrescar el dashboard del usuario
- Verificar en base de datos que el update se ejecutó
- Ver logs de la API de validación

---

## Resumen del Flujo

```
┌─────────────────┐
│  Usuario        │
│  Selecciona     │  →  Genera Token (A3B9K2)
│  Material       │      Válido: 15 min
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  Usuario va al  │
│  Kiosco con     │  →  Muestra código al promotor
│  Material       │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  Promotor       │
│  Ingresa código │  →  Sistema valida
│  A3B9K2         │      ✓ Token válido
└─────────────────┘      ✓ No expirado
         │               ✓ No usado
         ↓
┌─────────────────┐
│  Sistema        │
│  Acredita       │  →  Usuario: +1 punto
│  Puntos         │      Token: marcado como "validated"
└─────────────────┘
```

---

**¡El sistema de tokens está listo para usar!** 🎉
