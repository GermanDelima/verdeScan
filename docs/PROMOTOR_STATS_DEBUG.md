# Debug: Sistema de Estadísticas del Promotor

## Problema Reportado
El tanque de AVU y los contadores no se actualizan después de validar tokens.

## Sistema Implementado

### Flujo de Datos
```
1. Usuario genera token de AVU/Lata/Botella
2. Promotor valida token en su dashboard
3. API /api/tokens/validate actualiza:
   - recycling_tokens.status = 'validated'
   - recycling_tokens.validated_by = staff_id
   - recycling_tokens.validated_at = timestamp
4. Frontend detecta validación exitosa
5. Frontend llama a /api/tokens/stats?staff_id={id}
6. API cuenta tokens validados por tipo
7. Interfaz se actualiza con los nuevos valores
```

## Checklist de Troubleshooting

### 1. Verificar que el token se guardó correctamente

Ejecuta en Supabase SQL Editor:

```sql
-- Ver los últimos tokens validados
SELECT
  id,
  token_code,
  material_type,
  status,
  validated_by,
  validated_at,
  validation_location
FROM recycling_tokens
WHERE status = 'validated'
ORDER BY validated_at DESC
LIMIT 10;
```

**Espera ver:**
- `status` = 'validated'
- `validated_by` debe tener el UUID del staff
- `validated_at` debe tener la fecha/hora
- `material_type` debe ser 'avu', 'lata', o 'botella'

### 2. Verificar el staff_id en el frontend

Abre la consola del navegador (F12) y busca estos logs:

```
📊 Stats API - Staff ID: {uuid}
📊 Tokens encontrados: {número}
📊 Tokens por tipo: [array de objetos]
✅ Estadísticas calculadas: {avu_liters, can_count, bottle_count}
```

También en el frontend:
```
Estadísticas cargadas: {objeto}
Validación exitosa, recargando estadísticas...
```

### 3. Verificar la sesión del promotor

En la consola del navegador, ejecuta:

```javascript
JSON.parse(localStorage.getItem('staff_session'))
```

Deberías ver:
```json
{
  "id": "uuid-del-staff",
  "username": "nombre-usuario",
  "account_type": "promotor",
  "loginTime": "timestamp"
}
```

### 4. Probar la API directamente

Abre en el navegador (reemplaza {staff_id} con tu UUID real):

```
http://localhost:3000/api/tokens/stats?staff_id={staff_id}
```

Deberías ver:
```json
{
  "avu_liters": 2,
  "can_count": 0,
  "bottle_count": 0,
  "total_validations": 2
}
```

### 5. Verificar que el material_type se guarda correctamente

```sql
-- Contar tokens validados por tipo
SELECT
  material_type,
  COUNT(*) as cantidad,
  array_agg(token_code) as codigos
FROM recycling_tokens
WHERE status = 'validated'
  AND validated_by = 'TU_STAFF_ID_AQUI'
GROUP BY material_type;
```

## Posibles Causas del Problema

### Causa 1: staff_id no coincide
- El `validated_by` en recycling_tokens no coincide con el `id` en staff_accounts
- **Solución**: Verificar que session.id sea correcto

### Causa 2: Estado del token no es 'validated'
- El token quedó en estado 'pending' o 'expired'
- **Solución**: Verificar que la validación se completó exitosamente

### Causa 3: useEffect no se dispara
- El componente no detecta el cambio en validationResult
- **Solución**: Ya implementado - ahora usa validationResult?.success

### Causa 4: Cache del navegador
- El navegador está sirviendo datos antiguos
- **Solución**: Hacer Hard Refresh (Ctrl + Shift + R)

## Verificación Manual Rápida

1. **Valida un token de AVU**
2. **Abre la consola del navegador (F12)**
3. **Busca estos logs:**
   ```
   Validación exitosa, recargando estadísticas...
   📊 Stats API - Staff ID: ...
   📊 Tokens encontrados: 2
   ✅ Estadísticas calculadas: { avu_liters: 2, ... }
   Estadísticas cargadas: { avu_liters: 2, ... }
   ```

4. **Si ves "Tokens encontrados: 0":**
   - Verifica en Supabase que el token tiene `validated_by` correcto
   - Verifica que el `staff_id` en la URL sea correcto

5. **Si ves "Tokens encontrados: 2" pero la UI muestra 0:**
   - Verifica que `setAvuLiters(data.avu_liters || 0)` se está ejecutando
   - Revisa si hay errores en la consola

## Script de Prueba SQL

```sql
-- Limpiar tokens de prueba anteriores (CUIDADO EN PRODUCCIÓN)
-- DELETE FROM recycling_tokens WHERE validated_at > NOW() - INTERVAL '1 hour';

-- Crear token de prueba para AVU
INSERT INTO recycling_tokens (
  user_id,
  token_code,
  material_type,
  points_value,
  status,
  expires_at
)
SELECT
  id,
  'TEST' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
  'avu',
  20,
  'pending',
  NOW() + INTERVAL '1 hour'
FROM users
LIMIT 1
RETURNING token_code;

-- Copiar el token_code generado y validarlo en el dashboard del promotor
```

## Logs Importantes

### Backend (Terminal donde corre Next.js)
```
📊 Stats API - Staff ID: abc123...
📊 Tokens encontrados: 2
📊 Tokens por tipo: [ { material_type: 'avu' }, { material_type: 'avu' } ]
✅ Estadísticas calculadas: { avu_liters: 2, can_count: 0, bottle_count: 0 }
```

### Frontend (Consola del navegador)
```
Validación exitosa, recargando estadísticas...
Estadísticas cargadas: {avu_liters: 2, can_count: 0, bottle_count: 0, total_validations: 2}
```

## Solución Implementada

1. **Mejora en useEffect**: Ahora usa `validationResult?.success` como dependencia
2. **Función loadStats**: Extraída para poder reutilizarla
3. **Logs de depuración**: Agregados en frontend y backend
4. **Indicador de carga**: Spinner mientras se cargan las estadísticas

## Si Todo Falla

Ejecuta este query para resetear y probar:

```sql
-- Ver tu staff_id
SELECT id, username, account_type FROM staff_accounts;

-- Ver tokens validados por ti
SELECT
  token_code,
  material_type,
  status,
  validated_by,
  validated_at
FROM recycling_tokens
WHERE validated_by = 'TU_STAFF_ID'
ORDER BY validated_at DESC;

-- Si no hay tokens, el problema está en la validación
-- Si hay tokens pero la API no los encuentra, el problema está en el staff_id
```

## Contacto de Soporte

Si el problema persiste:
1. Exporta los logs de la consola
2. Ejecuta los queries SQL de arriba
3. Comparte los resultados para debugging
