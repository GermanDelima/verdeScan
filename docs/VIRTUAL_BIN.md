# Sistema de Tacho Virtual

## Descripción General

El Sistema de Tacho Virtual permite a los usuarios visualizar qué materiales han escaneado y tienen listos para canjear. Los materiales escaneados se almacenan en una "tacho virtual" y se muestran visualmente en el modal "Canjear" con diferentes niveles de intensidad de color.

## Flujo del Usuario

### 1. Escanear Materiales

**Ubicación:** `/dashboard/scan`

Cuando el usuario escanea un código de barras de un material reciclable:

1. El sistema identifica el material (actualmente solo latas de cerveza)
2. Se agrega automáticamente al tacho virtual del usuario
3. El usuario puede ver cuántas unidades ha escaneado

**Ejemplo:**
```
Usuario escanea 3 latas de cerveza
→ Se agregan 3 unidades de "lata" al tacho virtual
```

### 2. Visualizar el Tacho

**Ubicación:** `/dashboard` → Botón "Canjear"

Cuando el usuario abre el modal "Canjear":

1. Se cargan los materiales del tacho virtual
2. Los materiales escaneados (disponibles) se muestran con **color normal** (opacity: 100%)
3. Los materiales NO escaneados se muestran **difuminados** (opacity: 30%)
4. Se muestra la cantidad disponible de cada material

**Visualización:**

```
✅ Lata de Aluminio (normal)
   "3 en tu tacho - 1 punto por lata"

⚪ Aceite Vegetal Usado (difuminado)
   "20 puntos por litro"

⚪ Botella de Plástico (difuminado)
   "1 punto por botella"
```

### 3. Generar Token para Canjear

Cuando el usuario selecciona un material:

1. Se genera un token único (OTP) de 6 caracteres
2. El token es válido por 15 minutos
3. El usuario lleva el material físico + el código al promotor/ecopunto
4. El promotor valida el código y acredita los puntos

**IMPORTANTE:** El token NO reduce automáticamente el tacho virtual. Los materiales se mantienen en el tacho hasta que el promotor valide la entrega física.

## Estructura de la Base de Datos

### Tabla: `user_virtual_bin`

```sql
CREATE TABLE user_virtual_bin (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  material_type TEXT NOT NULL CHECK (material_type IN ('avu', 'lata', 'botella')),
  quantity INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, material_type)
);
```

**Campos:**
- `id`: Identificador único del registro
- `user_id`: ID del usuario propietario
- `material_type`: Tipo de material ('avu', 'lata', 'botella')
- `quantity`: Cantidad de unidades en el tacho
- `last_scanned_at`: Última vez que se escaneó este material

**Restricción UNIQUE:**
Cada usuario solo puede tener un registro por tipo de material. Al escanear más del mismo material, se incrementa la cantidad.

## APIs Implementadas

### GET /api/user/virtual-bin

Obtiene el tacho virtual del usuario autenticado.

**Request:**
```typescript
// No requiere parámetros (usa auth token)
```

**Response (200):**
```json
{
  "success": true,
  "virtualBin": {
    "lata": 3,
    "avu": 0,
    "botella": 0
  },
  "materials": {
    "avu": 0,
    "lata": 3,
    "botella": 0
  }
}
```

**Errores:**
- `401` - Usuario no autenticado
- `500` - Error del servidor

### POST /api/user/virtual-bin/add

Agrega materiales al tacho virtual.

**Request:**
```json
{
  "material_type": "lata",
  "quantity": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Material agregado al tacho virtual",
  "virtualBin": {
    "lata": 4
  },
  "materials": {
    "avu": 0,
    "lata": 4,
    "botella": 0
  }
}
```

**Errores:**
- `401` - Usuario no autenticado
- `400` - Tipo de material inválido
- `500` - Error al agregar material

## Funciones de Base de Datos

### `add_to_virtual_bin(p_user_id UUID, p_material_type TEXT, p_quantity INTEGER)`

Agrega o incrementa la cantidad de un material en el tacho.

**Lógica:**
```sql
INSERT INTO user_virtual_bin (user_id, material_type, quantity)
VALUES (p_user_id, p_material_type, p_quantity)
ON CONFLICT (user_id, material_type)
DO UPDATE SET
  quantity = user_virtual_bin.quantity + p_quantity,
  last_scanned_at = NOW();
```

**Comportamiento:**
- Si el material NO existe → crea un nuevo registro
- Si el material existe → incrementa la cantidad

### `remove_from_virtual_bin(p_user_id UUID, p_material_type TEXT, p_quantity INTEGER)`

Remueve materiales del tacho (usado al canjear).

**Lógica:**
```sql
-- Verifica que haya suficiente cantidad
-- Reduce la cantidad
-- Si llega a 0, elimina el registro
```

**Retorna:**
- `TRUE` - Se removió exitosamente
- `FALSE` - No hay suficiente cantidad

### `get_total_bin_items(p_user_id UUID)`

Obtiene el total de envases en el tacho.

**Retorna:**
```sql
SUM(quantity) de todos los materiales del usuario
```

## Integración con el Sistema de Escaneo

### Archivo: `src/app/dashboard/scan/page.tsx`

Cuando se escanea un código de barras:

```typescript
// Agregar al tacho virtual
await fetch('/api/user/virtual-bin/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    material_type: 'lata',
    quantity: 1
  }),
})
```

**Flujo:**
1. Usuario escanea código de barras
2. Se valida el GTIN (código de producto)
3. Se incrementa peso acumulado (localStorage)
4. **Se agrega 1 unidad al tacho virtual**
5. Se muestra confirmación

## Integración con el Modal Canjear

### Archivo: `src/app/dashboard/page.tsx`

#### Cargar Tacho Virtual

```typescript
const [virtualBin, setVirtualBin] = useState({
  avu: 0,
  lata: 0,
  botella: 0
})

useEffect(() => {
  const loadVirtualBin = async () => {
    const response = await fetch('/api/user/virtual-bin')
    const data = await response.json()
    if (data.success) {
      setVirtualBin(data.materials)
    }
  }
  loadVirtualBin()
}, [user])
```

#### Mostrar Materiales con Diferente Opacidad

```typescript
<button
  className={`... ${
    virtualBin.lata > 0 ? 'opacity-100' : 'opacity-30'
  }`}
>
  <Beer className="h-12 w-12 text-amber-700" />
  <p>Lata de Aluminio</p>
  <p className="text-xs">
    {virtualBin.lata > 0
      ? `${virtualBin.lata} en tu tacho - 1 punto por lata`
      : '1 punto por lata'
    }
  </p>
</button>
```

**Resultado Visual:**
- `opacity-100`: Material disponible, color normal vibrante
- `opacity-30`: Material NO disponible, color difuminado/apagado

## Tipos de Material

| Tipo | Código | Puntos | Descripción |
|------|--------|--------|-------------|
| Aceite Vegetal Usado | `avu` | 20 | 1 Litro de AVU |
| Lata de Aluminio | `lata` | 1 | 1 Lata de 355ml |
| Botella de Plástico | `botella` | 1 | 1 Botella PET |

## Consideraciones Importantes

### Sincronización

1. **Al escanear:** Se agrega inmediatamente al tacho virtual
2. **Al abrir Canjear:** Se recarga el estado del tacho desde la API
3. **Al generar token:** NO se reduce el tacho (el material sigue disponible)
4. **Al validar token:** El promotor confirma la entrega física

### Prevención de Fraude

El tacho virtual es solo un **indicador visual** de lo que el usuario dice haber escaneado. La validación real ocurre cuando:

1. El usuario genera un token
2. El usuario lleva el **material físico** al promotor
3. El promotor **verifica físicamente** el material
4. El promotor valida el token para acreditar puntos

Si el usuario genera un token pero no entrega el material:
- El token expira en 15 minutos
- NO se acreditan puntos
- El promotor puede rechazar la validación

### Limitaciones Actuales

1. **No hay reducción automática:** Cuando se genera un token, el material NO se remueve del tacho automáticamente
2. **Confianza del usuario:** Se asume que el usuario solo genera tokens cuando tiene el material físico
3. **Escaneo manual:** El usuario debe escanear cada unidad individualmente

### Mejoras Futuras

1. **Reducir tacho al validar token:**
   - Cuando el promotor valida, llamar a `remove_from_virtual_bin()`
   - Sincronizar en tiempo real con el dashboard del usuario

2. **Límites de generación:**
   - No permitir generar más tokens de los que hay en el tacho
   - Ejemplo: Si tienes 3 latas, solo puedes generar tokens por 3 latas

3. **Historial de escaneos:**
   - Mostrar cuándo se escaneó cada material
   - Registro de validaciones anteriores

4. **Notificaciones:**
   - Avisar cuando se acreditan puntos
   - Recordar tokens pendientes de validar

## Ejemplo Completo

### Escenario: Usuario escanea 5 latas

**Paso 1: Escanear**
```
Usuario va a /dashboard/scan
Escanea 5 códigos de barras de latas
→ Tacho virtual: { lata: 5, avu: 0, botella: 0 }
```

**Paso 2: Ver en Canjear**
```
Usuario vuelve a /dashboard
Presiona "Canjear"
→ Ve la lata con color NORMAL ✅
→ Ve "5 en tu tacho - 1 punto por lata"
→ Aceite y botella aparecen DIFUMINADOS ⚪
```

**Paso 3: Generar Token**
```
Usuario selecciona "Lata de Aluminio"
→ Se genera token: "A3B9K2"
→ Material sigue en el tacho: { lata: 5 }
```

**Paso 4: Validar con Promotor**
```
Usuario va al kiosco con sus 5 latas
Muestra código "A3B9K2"
Promotor valida el código
→ Usuario recibe +5 puntos
→ Token marcado como "validated"
```

## Archivos Modificados

### Migraciones
- `migrations/create-virtual-bin.sql` - Tabla y funciones de base de datos

### TypeScript Types
- `src/supabase/types.ts` - Definición de `user_virtual_bin`

### APIs
- `src/app/api/user/virtual-bin/route.ts` - GET tacho virtual
- `src/app/api/user/virtual-bin/add/route.ts` - POST agregar material

### Frontend
- `src/app/dashboard/page.tsx` - Modal Canjear con visualización del tacho
- `src/app/dashboard/scan/page.tsx` - Integración al escanear

## Solución de Problemas

### El tacho no se actualiza al escanear

**Síntoma:** Escaneé latas pero el modal Canjear las muestra difuminadas

**Solución:**
1. Verificar que la migración `create-virtual-bin.sql` fue ejecutada
2. Revisar consola del navegador (F12) para errores de API
3. Verificar que el usuario está autenticado
4. Recargar la página y volver a abrir el modal

### Las latas aparecen difuminadas aunque escaneé

**Síntoma:** El modal muestra opacity-30 en todas las opciones

**Solución:**
1. Abrir consola del navegador (F12)
2. Ejecutar: `fetch('/api/user/virtual-bin').then(r => r.json()).then(console.log)`
3. Ver si el API retorna las cantidades correctas
4. Si retorna `{lata: 0}`, verificar que el escaneo esté llamando a `/api/user/virtual-bin/add`

### Error al agregar al tacho

**Síntoma:** Error 500 al escanear código de barras

**Solución:**
1. Verificar que la función `add_to_virtual_bin` existe en Supabase
2. Verificar permisos RLS en la tabla `user_virtual_bin`
3. Ver logs de Supabase para detalles del error

---

**¡El sistema de tacho virtual está listo!** 🎉

El usuario ahora puede ver visualmente qué materiales ha escaneado y tiene listos para canjear.
