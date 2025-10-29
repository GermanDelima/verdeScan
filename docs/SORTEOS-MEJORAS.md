# Sistema de Sorteos Mejorado - VerdeScan

## Resumen de Mejoras

Se ha implementado un sistema completo y atractivo de sorteos con las siguientes características:

### 1. Cards Informativas y Llamativas

✅ **Diseño visual mejorado** con:
- Gradientes de colores según categoría del premio
- Iconos específicos para cada tipo de premio (pizza, helado, libros, cine, plantas, etc.)
- Animaciones sutiles y efectos hover
- Badges informativos con patrocinador
- Contador de días restantes con colores según urgencia

### 2. Sistema de Múltiples Costos

✅ **Boletos con diferentes precios**:
- **100 puntos**: Premios básicos (cine, kit de jardinería)
- **200 puntos**: Premios intermedios (descuentos en pizzería, librería)
- **300 puntos**: Premios premium (helado artesanal)
- **500 puntos**: Premios especiales (pack sustentable completo)

### 3. Categorías de Premios

✅ **Tres categorías principales**:

#### 🌿 Eco (Verde)
- Productos sustentables
- Abono orgánico y plantines
- Kits de reciclaje
- Bicicletas

#### 🏪 Comercio Local (Azul)
- Premios de comercios locales
- Pizzerías, heladerías, librerías, cines
- Apoyo a negocios de Posadas

#### 💰 Descuentos (Naranja)
- Cupones y vouchers
- Descuentos porcentuales
- Beneficios en comercios

### 4. Premios Implementados

1. **Kit de Jardinería Ecológica** (100 pts)
   - 5 Bolsas de Abono + 10 Plantines
   - Sponsor: Vivero Posadas Verde

2. **Descuento en Pizzería La Famiglia** (200 pts)
   - 30% OFF en Pizza Grande
   - Sponsor: Pizzería La Famiglia

3. **Heladería Artesanal** (300 pts)
   - 4kg de Helado Artesanal
   - Sponsor: Heladería Del Pueblo

4. **Librería Cultural Posadas** (200 pts)
   - Voucher $15.000 en Librería
   - Sponsor: Librería Cultural

5. **Cine Posadas - Entradas Dobles** (100 pts)
   - 2 Entradas + 2 Combos de Cine
   - Sponsor: Cine Posadas

6. **Pack Sustentable Premium** (500 pts)
   - Bicicleta + Kit de Reciclaje
   - Sponsor: Municipalidad de Posadas

### 5. Sistema de Puntos

✅ **Descuento automático**:
- Los puntos se descuentan automáticamente al comprar boletos
- Validación de puntos disponibles antes de comprar
- Límite de boletos según puntos disponibles

✅ **NO afecta al ranking**:
- Los puntos gastados en sorteos NO reducen la posición en el ranking de barrios
- Los usuarios pueden participar sin preocuparse por perder posiciones

### 6. Modal de Confirmación Mejorado

✅ **Experiencia de compra completa**:
- Confirmación visual con iconos y colores
- Muestra todos los números de boleto generados
- Información del premio y patrocinador
- Fecha del sorteo
- Puntos restantes
- Recordatorio sobre el ranking

## Archivos Modificados

1. **src/app/dashboard/raffles/page.tsx**
   - Componente principal del sistema de sorteos
   - Cards con diseño mejorado
   - Sistema de categorías y colores
   - Modal de confirmación rediseñado

2. **supabase-raffles-update.sql**
   - Script SQL para actualizar la tabla `raffles`
   - Agrega columnas: `category`, `sponsor`, `image_url`
   - Incluye datos de ejemplo

## Cómo Usar

### Para Usuarios

1. Acceder a la sección "Sorteos" en el dashboard
2. Revisar los premios disponibles con sus costos
3. Seleccionar cantidad de boletos deseada
4. Comprar boletos con Posadas Points
5. Recibir números de boleto únicos
6. Esperar al sorteo automático en la fecha indicada

### Para Administradores

1. Ejecutar el script `supabase-raffles-update.sql` en Supabase
2. Los sorteos se crearán automáticamente con los datos de ejemplo
3. Personalizar premios, costos y fechas según necesidad
4. Agregar sponsors y categorías a nuevos sorteos

## Base de Datos

### Columnas de la tabla `raffles`:

```sql
- id: UUID (Primary Key)
- title: TEXT (Título del sorteo)
- description: TEXT (Descripción detallada)
- prize: TEXT (Nombre del premio)
- ticket_cost: INTEGER (Costo por boleto: 100, 200, 300, 500)
- draw_date: TIMESTAMPTZ (Fecha del sorteo)
- status: TEXT (Estado: 'active', 'completed', 'cancelled')
- category: TEXT (Categoría: 'eco', 'commerce', 'discount')
- sponsor: TEXT (Nombre del patrocinador/comercio)
- image_url: TEXT (URL de imagen del premio - opcional)
- created_at: TIMESTAMPTZ
```

## Características Técnicas

### Iconos Dinámicos
- Leaf, Sprout: Premios ecológicos
- Pizza, IceCream, Book, Film: Comercios específicos
- Store: Comercio general
- Percent: Descuentos
- Gift: Premio genérico

### Colores por Categoría
- **Eco**: Verde/Esmeralda
- **Comercio**: Azul/Cian
- **Descuento**: Naranja/Ámbar

### Validaciones
- Puntos insuficientes
- Cantidad mínima de boletos (1)
- Cantidad máxima según puntos disponibles
- Sorteos solo en estado 'active'

## Próximos Pasos Sugeridos

1. ✅ Implementar sistema de notificaciones por email
2. ✅ Agregar historial de boletos comprados
3. ✅ Crear panel de administración para sorteos
4. ✅ Implementar sistema de sorteo automático
5. ✅ Agregar galería de imágenes de premios
6. ✅ Crear estadísticas de participación

## Notas Importantes

- Los puntos gastados en sorteos NO afectan el ranking de barrios
- Cada boleto tiene un número único de 6 dígitos
- Los sorteos se realizan automáticamente en la fecha indicada
- Los usuarios son notificados si ganan
- Los premios deben ser reclamados en el comercio patrocinador

---

**Desarrollado para VerdeScan** 🌱♻️
Sistema de incentivos para reciclaje comunitario en Posadas, Misiones, Argentina.
