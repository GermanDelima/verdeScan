// @ts-nocheck
"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/supabase/client"
import { Camera, CheckCircle, XCircle, AlertCircle, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const WEIGHT_THRESHOLD = 1000 // 1kg en gramos

type Product = {
  id: string
  gtin: string
  name: string
  weight: number
  category: string
  points_per_kg: number
  active: boolean
}

// Mapear categoría de producto a tipo de material del tacho virtual
function getCategoryMaterialType(category: string): 'lata' | 'botella' | 'avu' {
  const categoryLower = category.toLowerCase().trim()

  // Aceite vegetal usado - reconocer todas las variantes
  if (categoryLower === 'avu' ||
      categoryLower === 'acv' ||
      categoryLower === 'aceite' ||
      categoryLower.includes('aceite vegetal') ||
      categoryLower.includes('vegetal usado') ||
      categoryLower.includes('aceite usado')) {
    return 'avu'
  }

  // Plástico / PET / Botellas
  if (categoryLower === 'plastico' ||
      categoryLower === 'plástico' ||
      categoryLower === 'pet' ||
      categoryLower === 'botella' ||
      categoryLower.includes('plástico') ||
      categoryLower.includes('plastico') ||
      categoryLower.includes('botella')) {
    return 'botella'
  }

  // Aluminio / Latas / Metal (default para aluminio, papel, vidrio, tetrapack)
  // Estos van como "lata" por defecto, aunque podrías crear más categorías si necesitas
  return 'lata'
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  // Control de escaneo único - evita escaneos duplicados
  const lastScannedCodeRef = useRef<string | null>(null)
  const lastScanTimeRef = useRef<number>(0)
  const SCAN_COOLDOWN = 3000 // 3 segundos entre escaneos del mismo código
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Estados para acumulación de peso
  const [accumulatedWeight, setAccumulatedWeight] = useState(0)
  const [canCount, setCanCount] = useState(0)
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validating, setValidating] = useState(false)
  const [userPoints, setUserPoints] = useState(0)

  // Estado para el modal de permiso de cámara
  const [showCameraPermissionModal, setShowCameraPermissionModal] = useState(true)
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false)

  // Estado para productos
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentPointsPerKg, setCurrentPointsPerKg] = useState(50) // Puntos por kg del producto escaneado

  // Cargar productos desde la base de datos
  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)

      if (error) throw error

      // Convertir array a objeto con GTIN como key
      const productsMap: Record<string, Product> = {}
      if (data) {
        data.forEach((product: any) => {
          productsMap[product.gtin] = product
        })
      }

      setProducts(productsMap)
    } catch (error) {
      console.error('Error al cargar productos:', error)
      setResult({
        type: "error",
        message: "Error al cargar el catálogo de productos"
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  // Efecto para actualizar el cooldown restante
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastScanTimeRef.current > 0) {
        const elapsed = Date.now() - lastScanTimeRef.current
        const remaining = Math.max(0, SCAN_COOLDOWN - elapsed)
        setCooldownRemaining(remaining)
      } else {
        setCooldownRemaining(0)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [SCAN_COOLDOWN])

  // Cargar peso acumulado al montar
  useEffect(() => {
    loadAccumulatedWeight()
    loadUserPoints()
    loadProducts()

    return () => {
      // Cleanup: detener la cámara al desmontar
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  // Auto-iniciar escaneo después de aceptar permisos
  useEffect(() => {
    if (cameraPermissionGranted && !scanning) {
      startScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraPermissionGranted])

  const loadAccumulatedWeight = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener peso acumulado desde localStorage temporalmente
      const savedWeight = localStorage.getItem(`accumulated_weight_${user.id}`)
      const savedCount = localStorage.getItem(`can_count_${user.id}`)

      if (savedWeight) {
        setAccumulatedWeight(parseFloat(savedWeight))
      }
      if (savedCount) {
        setCanCount(parseInt(savedCount))
      }
    } catch (error) {
      console.error("Error loading accumulated weight:", error)
    }
  }

  const loadUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setUserPoints((data as any)?.points || 0)
    } catch (error) {
      console.error("Error loading user points:", error)
    }
  }

  const saveAccumulatedWeight = async (weight: number, count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      localStorage.setItem(`accumulated_weight_${user.id}`, weight.toString())
      localStorage.setItem(`can_count_${user.id}`, count.toString())
    } catch (error) {
      console.error("Error saving accumulated weight:", error)
    }
  }

  const handleAcceptCameraPermission = () => {
    setShowCameraPermissionModal(false)
    setCameraPermissionGranted(true)
  }

  const startScanning = async () => {
    try {
      setResult(null)
      setScanning(true)

      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setResult({
          type: "error",
          message: "No se encontró ninguna cámara en tu dispositivo"
        })
        setScanning(false)
        return
      }

      // Buscar cámara trasera (environment) específicamente
      let selectedDeviceId = videoInputDevices[0].deviceId

      // Intentar encontrar la cámara trasera
      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('trasera')
      )

      if (backCamera) {
        selectedDeviceId = backCamera.deviceId
      } else if (videoInputDevices.length > 1) {
        // Si hay más de una cámara y no pudimos identificar la trasera por el label,
        // asumimos que la segunda cámara es la trasera (común en móviles)
        selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId
      }

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        async (result) => {
          if (result) {
            const barcode = result.getText()
            await handleBarcodeScan(barcode)
            // No detenemos el escaneo, permitimos escaneos continuos
          }
        }
      )
    } catch (error) {
      console.error("Error al iniciar el escaneo:", error)
      setResult({
        type: "error",
        message: "Error al acceder a la cámara. Verifica los permisos."
      })
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setScanning(false)
    // Resetear control de escaneo al detener
    lastScannedCodeRef.current = null
    lastScanTimeRef.current = 0
  }

  const handleBarcodeScan = async (gtin: string) => {
    // Verificar si es un escaneo duplicado (mismo código escaneado recientemente)
    const now = Date.now()
    const timeSinceLastScan = now - lastScanTimeRef.current

    if (lastScannedCodeRef.current === gtin && timeSinceLastScan < SCAN_COOLDOWN) {
      // Ignorar escaneo duplicado
      console.log(`Ignorando escaneo duplicado de ${gtin} (último escaneo hace ${timeSinceLastScan}ms)`)
      return
    }

    // Actualizar último código escaneado y timestamp
    lastScannedCodeRef.current = gtin
    lastScanTimeRef.current = now

    // Verificar si el GTIN es válido
    const product = products[gtin]

    if (!product) {
      setResult({
        type: "error",
        message: `Código de barras no reconocido: ${gtin}. Producto no está en el catálogo.`
      })
      return
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      setResult({
        type: "error",
        message: "Debes iniciar sesión para escanear productos"
      })
      return
    }

    // Incrementar peso acumulado
    const newWeight = accumulatedWeight + product.weight
    const newCount = canCount + 1

    setAccumulatedWeight(newWeight)
    setCanCount(newCount)

    // Guardar los puntos por kg del producto (usar el del primer producto escaneado)
    if (canCount === 0) {
      setCurrentPointsPerKg(product.points_per_kg)
    }

    await saveAccumulatedWeight(newWeight, newCount)

    // Agregar al tacho virtual con el tipo de material correcto
    const materialType = getCategoryMaterialType(product.category)

    try {
      const response = await fetch('/api/user/virtual-bin/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          material_type: materialType,
          quantity: 1
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Error desconocido'
        try {
          const errorData = await response.json()
          console.error('Error al agregar al tacho virtual:', errorData)
          errorMessage = errorData.error || JSON.stringify(errorData)
        } catch (e) {
          console.error('No se pudo parsear error como JSON:', e)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }

        // Si es 401, es problema de autenticación
        if (response.status === 401) {
          setResult({
            type: "error",
            message: "⚠️ Sesión expirada. Por favor, cierra sesión y vuelve a entrar."
          })
        } else {
          setResult({
            type: "error",
            message: `Error al agregar al tacho virtual: ${errorMessage}`
          })
        }
        return
      }

      const data = await response.json()
      console.log('Material agregado al tacho virtual:', data)
    } catch (error) {
      console.error('Error al agregar al tacho virtual:', error)
      setResult({
        type: "error",
        message: `Error al agregar al tacho virtual: ${error instanceof Error ? error.message : 'Error desconocido'}`
      })
      return
    }

    setResult({
      type: "success",
      message: `✓ ${product.name} escaneada (+${product.weight}g)`
    })

    // Verificar si alcanzó 1kg
    if (newWeight >= WEIGHT_THRESHOLD) {
      setShowValidationDialog(true)
      stopScanning()
    }
  }

  const handleValidatePoints = async () => {
    setValidating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult({
          type: "error",
          message: "Debes iniciar sesión para validar puntos"
        })
        return
      }

      // Calcular kilogramos completos
      const kg = Math.floor(accumulatedWeight / WEIGHT_THRESHOLD)
      const pointsToAdd = kg * currentPointsPerKg
      const remainingWeight = accumulatedWeight % WEIGHT_THRESHOLD

      // Obtener puntos actuales del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points, total_earned_points")
        .eq("id", user.id)
        .single()

      if (userError) throw userError

      const currentPoints = (userData as any)?.points || 0
      const currentEarnedPoints = (userData as any)?.total_earned_points || 0
      const newPoints = currentPoints + pointsToAdd
      const newEarnedPoints = currentEarnedPoints + pointsToAdd

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from("users")
        .update({
          points: newPoints,
          total_earned_points: newEarnedPoints
        } as any)
        .eq("id", user.id)

      if (updateError) throw updateError

      // Registrar el escaneo
      const { error: scanError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          qr_code: `ALUMINUM-${Date.now()}`,
          points_earned: pointsToAdd,
          material_details: `${canCount} latas de aluminio (${kg}kg)`
        } as any)

      if (scanError) throw scanError

      // Actualizar estado
      setUserPoints(newPoints)
      setAccumulatedWeight(remainingWeight)
      setCanCount(Math.floor(remainingWeight / 14)) // Aproximar latas restantes
      await saveAccumulatedWeight(remainingWeight, Math.floor(remainingWeight / 14))

      setResult({
        type: "success",
        message: `¡Felicitaciones! Has ganado ${pointsToAdd} puntos por ${kg}kg de aluminio 🎉`
      })

      setShowValidationDialog(false)

      // Resetear control de escaneo después de validar
      lastScannedCodeRef.current = null
      lastScanTimeRef.current = 0
    } catch (error) {
      console.error("Error al validar puntos:", error)
      setResult({
        type: "error",
        message: "Error al validar los puntos. Intenta nuevamente."
      })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Scanner de código de barras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escáner de Código de Barras
          </CardTitle>
          <CardDescription>
            Posiciona el código de barras de la lata frente a la cámara
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ display: scanning ? "block" : "none" }}
            />
            {!scanning && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="mx-auto h-16 w-16 opacity-50" />
                  <p className="mt-4 text-sm opacity-75">
                    Presiona el botón para activar la cámara
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startScanning} className="flex-1" size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Iniciar Escaneo
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
                Detener Escaneo
              </Button>
            )}
          </div>

          {result && (
            <div
              className={`flex items-start gap-3 rounded-lg p-4 ${
                result.type === "success"
                  ? "bg-green-50 text-green-900"
                  : result.type === "error"
                  ? "bg-red-50 text-red-900"
                  : "bg-blue-50 text-blue-900"
              }`}
            >
              {result.type === "success" && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
              {result.type === "error" && <XCircle className="h-5 w-5 flex-shrink-0" />}
              {result.type === "info" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              <p className="font-medium">{result.message}</p>
            </div>
          )}

          {cooldownRemaining > 0 && scanning && (
            <div className="flex items-center gap-3 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Espera {Math.ceil(cooldownRemaining / 1000)} segundos antes de escanear otro producto
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-yellow-200">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-100"
                    style={{ width: `${(cooldownRemaining / SCAN_COOLDOWN) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Productos aceptados:</p>
                {loadingProducts ? (
                  <p className="mt-2 text-xs text-blue-700">Cargando catálogo...</p>
                ) : Object.keys(products).length === 0 ? (
                  <p className="mt-2 text-xs text-red-700">No hay productos disponibles en el catálogo</p>
                ) : (
                  <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {Object.values(products).map((product) => (
                      <li key={product.gtin}>
                        • {product.name} ({product.weight}g) - {product.category}
                        <span className="block text-xs text-blue-700">GTIN: {product.gtin}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

{/* Instrucciones */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <div>
              <p className="font-semibold">Escanea el código de barras</p>
              <p className="text-muted-foreground">Enfoca la cámara al código de barras de cada producto reciclable</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <div>
              <p className="font-semibold">Tacho virtual</p>
              <p className="text-muted-foreground">Cada vez que escaneás el código de barras, tus materiales se guardan en tu <strong>tacho virtual.</strong></p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <div>
              <p className="font-semibold">Valida y gana puntos</p>
              <p className="text-muted-foreground">Cuando vayas al Ecopunto a reciclarlos, podrás vaciar el tacho y sumar puntos por tu aporte al planeta.</p>
            </div>
          </div>         
        </CardContent>
      </Card>

      {/* Progreso de peso acumulado */}
      {accumulatedWeight > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-green-600" />
              Progreso de Acumulación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Peso acumulado</p>
                <p className="text-3xl font-bold text-green-600">
                  {accumulatedWeight}g
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(accumulatedWeight / WEIGHT_THRESHOLD * 100).toFixed(0)}% completado
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-600">Productos escaneados</p>
                <p className="text-3xl font-bold text-green-600">
                  {canCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.floor(accumulatedWeight / WEIGHT_THRESHOLD)}kg completado
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hacia tu próximo kg</span>
                <span className="font-semibold text-green-600">
                  {WEIGHT_THRESHOLD - (accumulatedWeight % WEIGHT_THRESHOLD)}g restantes
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                  style={{
                    width: `${((accumulatedWeight % WEIGHT_THRESHOLD) / WEIGHT_THRESHOLD) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

{/* Instrucciones */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">

          <div className="flex gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <div>
              <p className="font-semibold">Valida y gana puntos</p>
              <p className="text-muted-foreground">Cada producto suma su peso. <strong>para el bono de 50 puntos</strong> Sigue escaneando hasta llegar a 1kg</p>
              <p className="text-muted-foreground">Al llegar a 1kg, valida para ganar {currentPointsPerKg} puntos por el desafio</p>              
            </div>
          </div>         
        </CardContent>
      </Card>      

      {/* Dialog de validación */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">
              ¡Felicitaciones!
            </DialogTitle>
            <DialogDescription className="text-center">
              Has acumulado {accumulatedWeight}g de aluminio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
              <div className="text-center">
                <p className="text-sm text-green-700">Peso a validar</p>
                <p className="text-4xl font-bold text-green-900">
                  {Math.floor(accumulatedWeight / WEIGHT_THRESHOLD)}kg
                </p>
                <p className="mt-2 text-sm text-green-700">
                  {canCount} latas escaneadas
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">Puntos a ganar</p>
              <p className="text-3xl font-bold text-primary">
                +{Math.floor(accumulatedWeight / WEIGHT_THRESHOLD) * currentPointsPerKg}
              </p>
            </div>

            {accumulatedWeight % WEIGHT_THRESHOLD > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                <p>
                  <strong>Nota:</strong> Te quedarán {accumulatedWeight % WEIGHT_THRESHOLD}g acumulados para tu próximo kilogramo.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleValidatePoints}
              disabled={validating}
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {validating ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Validar y Ganar Puntos
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowValidationDialog(false)}
              variant="outline"
              size="lg"
              className="w-full"
              disabled={validating}
            >
              Seguir Acumulando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Permiso de Cámara */}
      {showCameraPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-800">
              VerdeScan quiere acceder a tu cámara.
            </h2>

            {/* Descripción */}
            <p className="text-base leading-relaxed text-gray-600">
              Es necesario que permitas el acceso a tu cámara para poder escanear tus latas o botellas de plástico de bebidas.
            </p>

            {/* Botón Aceptar */}
            <Button
              onClick={handleAcceptCameraPermission}
              className="w-full rounded-full bg-yellow-400 py-6 text-lg font-semibold text-gray-900 shadow-sm hover:bg-yellow-500"
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
