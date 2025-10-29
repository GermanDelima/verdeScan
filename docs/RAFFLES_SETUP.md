# Configuración de Sorteos en Posadas Recicla

## Resumen
Este documento explica cómo configurar y gestionar los sorteos conectados a Supabase en la aplicación Posadas Recicla.

## Estado Actual
✅ **La página de sorteos ya está conectada a Supabase**

El archivo [src/app/dashboard/raffles/page.tsx](../src/app/dashboard/raffles/page.tsx) ya está configurado para:
- Obtener sorteos activos desde la tabla `raffles` en Supabase
- Mostrar solo sorteos con estado `active`
- Ordenar por fecha de sorteo ascendente
- Permitir a los usuarios comprar boletos con sus puntos
- **✨ NUEVO:** Mostrar una sección minimalista "Mis Participaciones" con los sorteos en los que el usuario tiene boletos comprados

## Configuración de Base de Datos

### 1. Ejecutar la migración SQL

Para configurar las políticas de seguridad RLS y agregar sorteos de ejemplo, ejecuta el siguiente script en el SQL Editor de Supabase:

```bash
# El archivo está ubicado en:
migrations/setup-raffles-policies.sql
```

Este script realiza las siguientes acciones:

1. **Habilita Row Level Security (RLS)** en las tablas `raffles` y `raffle_tickets`
2. **Crea políticas de seguridad para raffles**:
   - Todos los usuarios pueden ver sorteos activos
   - Solo administradores pueden crear, actualizar o eliminar sorteos
3. **Crea políticas de seguridad para raffle_tickets**:
   - Los usuarios pueden ver sus propios boletos
   - Los usuarios pueden insertar sus propios boletos (al comprar)
   - Los administradores pueden ver todos los boletos
4. **Inserta 6 sorteos de ejemplo** con diferentes categorías y costos

### 2. Estructura de la tabla raffles

La tabla `raffles` tiene los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del sorteo (generado automáticamente) |
| `title` | TEXT | Título del sorteo |
| `description` | TEXT | Descripción detallada del premio |
| `prize` | TEXT | Nombre corto del premio |
| `ticket_cost` | INTEGER | Costo en puntos por boleto (ej: 100, 200, 500) |
| `draw_date` | TIMESTAMPTZ | Fecha y hora del sorteo |
| `status` | TEXT | Estado: 'active', 'completed', 'cancelled' |
| `category` | TEXT | Categoría: 'eco', 'commerce', 'discount' |
| `sponsor` | TEXT | Nombre del patrocinador |
| `image_url` | TEXT | URL de imagen del premio (opcional) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

## Gestión de Sorteos

### Crear un nuevo sorteo

Puedes crear sorteos desde el SQL Editor de Supabase o desde un panel de administración:

```sql
INSERT INTO raffles (
  title,
  description,
  prize,
  ticket_cost,
  draw_date,
  status,
  category,
  sponsor
)
VALUES (
  'Bicicleta Ecológica',
  'Bicicleta urbana nueva con kit de luces LED y casco incluido',
  'Bicicleta + Accesorios',
  300,
  NOW() + INTERVAL '15 days',
  'active',
  'eco',
  'Bicicletas Posadas'
);
```

### Ver sorteos activos

```sql
SELECT id, title, ticket_cost, draw_date, status, category
FROM raffles
WHERE status = 'active'
ORDER BY draw_date ASC;
```

### Finalizar un sorteo

Cuando se realiza el sorteo, cambia el estado a 'completed':

```sql
UPDATE raffles
SET status = 'completed'
WHERE id = 'ID_DEL_SORTEO';
```

## Categorías de Sorteos

La aplicación soporta tres categorías con diseños personalizados:

1. **eco** (Verde) 🌱
   - Premios relacionados con sostenibilidad y medio ambiente
   - Ejemplos: plantas, bicicletas, kits de reciclaje

2. **commerce** (Azul) 🏪
   - Premios de comercios locales
   - Ejemplos: vouchers, productos de tiendas

3. **discount** (Naranja) 🏷️
   - Descuentos y cupones
   - Ejemplos: descuentos en restaurantes, servicios

## Precios Recomendados por Boleto

- **100 puntos**: Premios pequeños (entradas de cine, descuentos menores)
- **200 puntos**: Premios medianos (vouchers, productos específicos)
- **300 puntos**: Premios grandes (electrodomésticos, kits completos)
- **500 puntos**: Premios premium (bicicletas, packs especiales)

## Verificación y Pruebas

### 1. Verifica las variables de entorno

Asegúrate de que tu archivo `.env.local` contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 2. Prueba la conexión

1. Inicia sesión en la aplicación
2. Navega a `/dashboard/raffles`
3. Deberías ver los sorteos activos desde Supabase
4. Si no hay sorteos, verás un mensaje indicándolo

### 3. Consola del navegador

Abre la consola del navegador (F12) para ver:
- Posibles errores de conexión
- Detalles de las consultas a Supabase
- Errores de políticas RLS

## Solución de Problemas

### No se muestran los sorteos

1. **Verifica que RLS esté configurado correctamente**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'raffles';
   ```

2. **Verifica las políticas**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'raffles';
   ```

3. **Verifica que existan sorteos activos**:
   ```sql
   SELECT * FROM raffles WHERE status = 'active';
   ```

### Error de permisos

Si ves errores de "permission denied":
- Verifica que las políticas RLS estén activas
- Asegúrate de que la política de SELECT permita acceso público a sorteos activos

### Los sorteos aparecen pero no se pueden comprar boletos

Verifica que:
1. El usuario tiene suficientes puntos
2. La tabla `raffle_tickets` existe y tiene las políticas RLS correctas
3. El usuario está autenticado correctamente

## Funcionalidad "Mis Participaciones"

### ¿Qué es?
Es una sección minimalista que muestra los sorteos en los que el usuario ha comprado boletos. Se actualiza automáticamente después de cada compra.

### Características:
- 📊 **Resumen compacto**: Cada tarjeta muestra el sorteo, patrocinador, número de boletos comprados y días restantes
- 🎨 **Diseño por categoría**: Usa los mismos colores e íconos que los sorteos (eco, commerce, discount)
- ⏰ **Indicador de urgencia**:
  - Rojo: ≤ 3 días
  - Amarillo: ≤ 7 días
  - Azul: > 7 días
- ✅ **Actualización automática**: Se refresca al comprar nuevos boletos
- 👁️ **Solo visible cuando tienes participaciones**: No se muestra si no has comprado boletos

### Ejemplo de visualización:
```
Mis Participaciones                    2 sorteos
┌─────────────────────────────────────────┐
│ 🌱 Kit de Jardinería Ecológica         │
│    Vivero Posadas Verde                │
│    🎟️ 3 boletos              5d        │
└─────────────────────────────────────────┘
```

## Próximos Pasos

1. **Panel de Administración**: Crear una interfaz para que los admins gestionen sorteos sin usar SQL
2. **Notificaciones**: Enviar emails cuando un usuario gana un sorteo
3. **Historial**: Mostrar sorteos pasados y ganadores
4. **Estadísticas**: Dashboard con métricas de participación
5. **Ver números de boleto**: Agregar un modal para ver los números específicos de cada participación

## Referencias

- [Documentación de Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Código de la página de sorteos](../src/app/dashboard/raffles/page.tsx)
- [Esquema de base de datos](../migrations/schema-consolidated.sql)
