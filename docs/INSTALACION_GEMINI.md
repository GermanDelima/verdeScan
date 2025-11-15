# Instalación de Consejos de Reciclaje con IA (Google Gemini 2.5 Flash)

Esta guía te ayudará a configurar la funcionalidad de consejos personalizados de reciclaje con IA integrada en el dashboard.

## 📁 Archivos Creados

Los siguientes archivos han sido creados en tu proyecto:

- `src/lib/ai/personalized-recycling-tips.ts` - Lógica de generación con Google Gemini AI
- `src/app/api/recycling-tip/route.ts` - API Route para el servicio
- `src/components/dashboard/recycling-tips.tsx` - Componente del formulario
- `src/app/dashboard/page.tsx` - Integración en el dashboard (modificado)
- `package.json` - Dependencias actualizadas (modificado)

## 🚀 Paso 1: Instalar Dependencias

**IMPORTANTE**: Cierra VS Code, terminales y cualquier proceso que pueda estar usando archivos del proyecto.

### Opción A: Instalación Normal
```bash
npm install
```

### Opción B: Si hay problemas de permisos en Windows
1. Cierra completamente VS Code
2. Abre CMD o PowerShell **como Administrador**
3. Navega a la carpeta del proyecto:
   ```bash
   cd C:\Users\Iqual\Desktop\posadas-recicla
   ```
4. Ejecuta:
   ```bash
   npm install
   ```

### Opción C: Forzar instalación limpia
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

## 🔑 Paso 2: Configurar API Key de Google AI

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Create API Key"
4. Copia la API key generada

5. Crea un archivo `.env.local` en la raíz del proyecto (si no existe):
```env
# Tus variables existentes de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Variable para Google AI
GOOGLE_API_KEY=tu_api_key_aqui
```

⚠️ **IMPORTANTE**: El archivo `.env.local` NO debe subirse a Git. Está en `.gitignore`.

## ✅ Paso 3: Verificar Instalación

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Abre el navegador en `http://localhost:3000/dashboard`

3. Deberías ver una nueva tarjeta "Consejo Personalizado del Día" con:
   - Tu barrio (obtenido del perfil)
   - Un campo de texto para describir tu actividad de reciclaje
   - Un botón "Generar Consejo"

## 🧪 Paso 4: Probar la Funcionalidad

1. En el campo de texto, describe tu actividad de reciclaje. Ejemplo:
   ```
   Esta semana separé botellas de plástico y cartón, pero no sé qué hacer con las latas.
   ```

2. Haz clic en "Generar Consejo"

3. El sistema debería:
   - Mostrar un spinner de carga
   - Generar un consejo personalizado usando IA
   - Mostrar el consejo en una caja verde

## 🔧 Solución de Problemas

### Error: "API key not configured"
- Verifica que el archivo `.env.local` existe en la raíz del proyecto
- Verifica que la variable `GOOGLE_API_KEY` está correctamente configurada
- Reinicia el servidor de desarrollo (`Ctrl+C` y luego `npm run dev`)

### Error: "Configuración de API incorrecta"
- Verifica que tu API key de Google AI es válida
- Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) y genera una nueva si es necesario

### Error 404: modelo no encontrado
- Asegúrate de que el código use el modelo `gemini-2.5-flash`
- Este es el modelo más reciente y estable de Google Gemini

### Error de TypeScript
- Si ves errores de tipos, ejecuta:
```bash
npm run dev
```
- Next.js debería compilar correctamente

### El componente no aparece
- Verifica que estás en la ruta `/dashboard` (no `/dashboard/scan` u otra)
- Verifica que las importaciones en `src/app/dashboard/page.tsx` están correctas
- Revisa la consola del navegador (F12) para ver errores

## 📝 Notas Adicionales

- **Modelo de IA**: Usa Google Gemini 2.5 Flash (más reciente, rápido y eficiente)
- **API**: Usa `@google/generative-ai` (biblioteca oficial de Google)
- **Contexto**: El consejo considera tu barrio, actividad reciente y puntos
- **Privacidad**: Los datos solo se envían a Google AI para generar el consejo
- **Límites**: Google AI tiene límites gratuitos generosos, pero considera los [términos de uso](https://ai.google.dev/pricing)

## 🎯 Funcionalidad Implementada

✅ Integración con Google Gemini 2.5 Flash
✅ API Route en Next.js para invocar el servicio
✅ Componente de formulario con validación
✅ Integración en el dashboard
✅ Manejo de errores y estados de carga
✅ Diseño responsive y accesible
✅ Consejos personalizados basados en ubicación y actividad

## 🔄 Dependencias Necesarias

Solo necesitas una dependencia para esta funcionalidad:

```json
{
  "@google/generative-ai": "^0.24.1"
}
```

Esta biblioteca oficial de Google proporciona acceso directo a la API de Gemini sin necesidad de frameworks adicionales.
