import { GoogleGenerativeAI } from '@google/generative-ai'

// Verificar que la API key esté configurada
const apiKey = process.env.GOOGLE_API_KEY
if (!apiKey) {
  throw new Error('GOOGLE_API_KEY no está configurada en las variables de entorno')
}

// Inicializar Google Generative AI
const genAI = new GoogleGenerativeAI(apiKey)

// Tipos para la respuesta
export type RecyclingTipCategory = 'general' | 'specific' | 'encouragement'

export interface RecyclingTipResult {
  tip: string
  category: RecyclingTipCategory
}

// Función para generar consejos de reciclaje usando Google Gemini 2.5 Flash
export async function generateRecyclingTip(
  neighborhood: string,
  recentActivity: string,
  userPoints?: number
): Promise<RecyclingTipResult> {
  try {
    // Obtener el modelo Gemini 2.5 Flash (más reciente y estable)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    })

    const prompt = `Eres un asistente especializado en reciclaje para la ciudad de Posadas, Argentina.

Usuario:
- Barrio: ${neighborhood}
- Actividad reciente: ${recentActivity}
${userPoints ? `- Puntos acumulados: ${userPoints}` : ''}

Genera UN consejo personalizado y práctico sobre reciclaje que:
1. Sea específico para su actividad reciente
2. Considere el contexto de Posadas (clima subtropical, materiales comunes en Argentina)
3. Sea breve (máximo 2-3 oraciones)
4. Sea motivador y amigable
5. Incluya acciones concretas que pueda hacer

Ejemplos del tono deseado:
- "¡Excelente trabajo separando plásticos! Para maximizar tu impacto, enjuaga bien las botellas antes de llevarlas al ecopunto. Esto evita contaminación y hace más eficiente el reciclaje."
- "Veo que reciclas cartón frecuentemente. Un tip: si llueve, guarda el cartón en un lugar seco. El cartón mojado es difícil de reciclar y pierde valor."

Devuelve solo el consejo, sin introducciones ni títulos.`

    // Generar contenido con Google Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Determinar categoría basada en el contenido
    let category: RecyclingTipCategory = 'general'
    if (text.toLowerCase().includes('excelente') || text.toLowerCase().includes('¡') || text.toLowerCase().includes('felicit')) {
      category = 'encouragement'
    } else if (recentActivity.length > 20) {
      category = 'specific'
    }

    return {
      tip: text,
      category: category,
    }
  } catch (error) {
    console.error('Error generating recycling tip:', error)
    throw error
  }
}
