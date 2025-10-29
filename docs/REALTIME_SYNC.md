# Sincronización en Tiempo Real - Tacho Virtual

## Problema Reportado

**Usuario:** "DICE LATAS ESCANEADAS 4 PERO EN ENVASES EN TU TACHO DICE 3"

### ¿Qué estaba pasando?

Había dos problemas:

1. **El contador estaba hardcodeado:**
   ```typescript
   const [packageCount] = useState(3) // ❌ Siempre mostraba 3
   ```

2. **No se actualizaba en tiempo real:**
   - Escaneabas una lata en `/dashboard/scan`
   - Volvías a `/dashboard`
   - El número NO se actualizaba automáticamente

## Solución Implementada

### 1. Contador Dinámico

Ahora se calcula sumando todos los materiales del tacho virtual:

```typescript
// ✅ Se calcula desde el tacho virtual
const [packageCount, setPackageCount] = useState(0)

// Cuando se carga el tacho
const total = data.materials.avu + data.materials.lata + data.materials.botella
setPackageCount(total) // Suma de todos los materiales
```

**Ejemplo:**
- AVU: 0
- Latas: 4
- Botellas: 0
- **Total: 4** ✅

### 2. Actualización en Tiempo Real

Agregamos suscripción Realtime de Supabase:

```typescript
// Escuchar cambios en la tabla user_virtual_bin
const binChannel = supabase
  .channel("user-virtual-bin")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "user_virtual_bin",
    filter: `user_id=eq.${user.id}`,
  }, async () => {
    // Recargar tacho automáticamente
    const data = await fetch('/api/user/virtual-bin')
    setVirtualBin(data.materials)
    setPackageCount(total)
  })
  .subscribe()
```

**Flujo:**
1. Escaneas lata en `/dashboard/scan` → Se agrega a la BD
2. Supabase detecta el cambio
3. Notifica al dashboard en tiempo real
4. El contador se actualiza automáticamente ✨

## Configuración Requerida

### Para que funcione en tiempo real necesitas:

#### Opción A: Re-ejecutar la migración completa

Si **NO** has ejecutado `create-virtual-bin.sql` aún:

```sql
-- Ejecuta en Supabase SQL Editor
-- migrations/create-virtual-bin.sql (versión actualizada)
```

Ya incluye la línea de Realtime.

#### Opción B: Solo habilitar Realtime

Si **YA** ejecutaste `create-virtual-bin.sql` anteriormente:

```sql
-- Ejecuta solo esto en Supabase SQL Editor
-- migrations/enable-virtual-bin-realtime.sql

ALTER PUBLICATION supabase_realtime ADD TABLE user_virtual_bin;
```

#### Verificar que funcionó

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'user_virtual_bin';
```

Deberías ver:
```
| schemaname | tablename          |
|------------|-------------------|
| public     | user_virtual_bin  |
```

## Cómo Funciona

### Antes (Sin Realtime)

```
1. Escaneas lata → Se guarda en BD ✅
2. Vuelves a /dashboard
3. El número NO se actualiza ❌
4. Tienes que recargar la página (F5) 🔄
```

### Ahora (Con Realtime)

```
1. Escaneas lata → Se guarda en BD ✅
2. Supabase detecta el cambio 📡
3. Notifica al dashboard 🔔
4. El número se actualiza solo ✨ (sin recargar)
```

## Estados Sincronizados

Ahora estos valores siempre coinciden:

| Ubicación | Valor | Fuente |
|-----------|-------|--------|
| `/dashboard/scan` | Latas escaneadas | localStorage (canCount) |
| `/dashboard` | Envases en tu Tacho | Tacho Virtual (BD) |
| `/dashboard` → "Canjear" | "X en tu tacho" | Tacho Virtual (BD) |

**Ejemplo consistente:**
- Escaneas 4 latas
- "Latas escaneadas": **4** ✅
- "Envases en tu Tacho": **4** ✅
- "Canjear" → "4 en tu tacho" ✅

## Fuentes de Datos

### LocalStorage (Temporal)

- **Qué guarda:** Peso acumulado y conteo de latas
- **Ubicación:** Navegador del usuario
- **Propósito:** Progreso hacia 1kg
- **Variables:**
  - `accumulated_weight_${user.id}` - Peso en gramos
  - `can_count_${user.id}` - Número de latas

**Se usa en:** Modal de "Progreso"

### Tacho Virtual (Base de Datos)

- **Qué guarda:** Materiales listos para canjear
- **Ubicación:** Supabase (tabla `user_virtual_bin`)
- **Propósito:** Mostrar qué hay en el tacho
- **Columnas:**
  - `material_type` - 'avu', 'lata', 'botella'
  - `quantity` - Cantidad de cada material

**Se usa en:**
- Card "Envases en tu Tacho"
- Modal "Canjear" (visualización con opacity)

## Casos de Uso

### Caso 1: Escanear y Ver Cambio Inmediato

```
Usuario A:
1. Abre /dashboard → Ve "0 Envases"
2. Va a /dashboard/scan
3. Escanea 1 lata → ✅ Guardado
4. Vuelve a /dashboard
5. Ve "1 Envase" automáticamente ✨ (sin recargar)
```

### Caso 2: Múltiples Escaneos

```
Usuario B:
1. Escanea lata #1 → Tacho: 1
2. Dashboard se actualiza → "1 Envase"
3. Escanea lata #2 → Tacho: 2
4. Dashboard se actualiza → "2 Envases"
5. Escanea lata #3 → Tacho: 3
6. Dashboard se actualiza → "3 Envases"
```

### Caso 3: Diferentes Materiales

```
Usuario C:
1. Escanea 2 latas → Tacho: {lata: 2}
2. Dashboard: "2 Envases"
3. (Hipotético) Escanea 1 botella → Tacho: {lata: 2, botella: 1}
4. Dashboard: "3 Envases" (suma de todos)
```

## Troubleshooting

### El número no se actualiza en tiempo real

**Síntoma:**
- Escaneas lata
- Vuelves a dashboard
- El número NO cambia hasta que recargas (F5)

**Solución:**
1. Verifica que ejecutaste `enable-virtual-bin-realtime.sql`
2. Verifica en Supabase:
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
3. Busca `user_virtual_bin` en los resultados
4. Si NO aparece, ejecuta:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE user_virtual_bin;
   ```

### El número es diferente del localStorage

**Síntoma:**
- "Latas escaneadas" (localStorage): 4
- "Envases en tu Tacho" (BD): 3

**Causa:**
- El localStorage y la BD están desincronizados
- Puede pasar si hubo un error al agregar al tacho

**Solución:**
1. Abre consola del navegador (F12)
2. Ejecuta:
   ```javascript
   fetch('/api/user/virtual-bin')
     .then(r => r.json())
     .then(d => console.log('Tacho BD:', d.materials))

   console.log('localStorage latas:',
     localStorage.getItem(`can_count_${user?.id}`))
   ```
3. Compara los valores
4. Si no coinciden, limpia localStorage:
   ```javascript
   localStorage.removeItem(`can_count_${user?.id}`)
   localStorage.removeItem(`accumulated_weight_${user?.id}`)
   ```
5. Recarga la página

### Error en consola sobre Realtime

**Síntoma:**
```
Error: Could not connect to Realtime server
```

**Causa:**
- Realtime no está habilitado en tu proyecto Supabase
- Límites del plan gratuito

**Solución:**
1. Ve a Supabase Dashboard → Settings → API
2. Verifica que "Realtime" esté habilitado
3. En plan gratuito hay límite de conexiones simultáneas
4. Si excediste el límite, el sistema seguirá funcionando pero sin actualizaciones automáticas

## Mejoras Futuras

### Unificar Fuentes de Datos

Actualmente tenemos dos fuentes:
- **localStorage:** Para progreso de acumulación (1kg)
- **Base de datos:** Para tacho virtual

**Propuesta:**
- Migrar todo a la base de datos
- Eliminar localStorage
- Una sola fuente de verdad

**Beneficios:**
- No más desincronización
- Datos persistentes entre dispositivos
- Más fácil de mantener

### Sincronización Offline

**Propuesta:**
- Permitir escanear sin conexión
- Guardar en cola local
- Sincronizar cuando vuelva la conexión

**Beneficios:**
- Funciona sin internet
- Mejor experiencia de usuario

---

## Resumen

**Antes:**
```
Latas escaneadas: 4
Envases en tu Tacho: 3 ❌ (hardcodeado)
```

**Ahora:**
```
Latas escaneadas: 4
Envases en tu Tacho: 4 ✅ (calculado dinámicamente)
```

**Con Realtime:**
```
Escaneas → ⚡ Se actualiza solo → ✨ Sin recargar
```

¡El sistema ahora está sincronizado! 🎉
