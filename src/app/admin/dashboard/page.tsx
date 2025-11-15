"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase/client"
import type { Database } from "@/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  UserPlus,
  Trash2,
  Users,
  Store,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Package,
  Edit,
  Barcode,
  XCircle,
  Gift,
  Calendar,
  Ticket
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type StaffAccount = {
  id: string
  username: string
  account_type: 'promotor' | 'ecopunto'
  created_at: string
  is_active: boolean
}

type Product = {
  id: string
  gtin: string
  name: string
  weight: number
  category: string
  points_per_kg: number
  active: boolean
  created_at: string
}

type Raffle = {
  id: string
  title: string
  description: string
  prize: string
  ticket_cost: number
  draw_date: string
  status: string
  category: string
  sponsor: string
  image_url: string | null
  created_at: string
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<StaffAccount[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // Tab activo
  const [activeTab, setActiveTab] = useState<'accounts' | 'products' | 'raffles'>('accounts')

  // Estado del formulario de cuentas
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [accountType, setAccountType] = useState<'promotor' | 'ecopunto'>('promotor')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estado de productos
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Estado del formulario de productos
  const [productGtin, setProductGtin] = useState("")
  const [productName, setProductName] = useState("")
  const [productWeight, setProductWeight] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [productPoints, setProductPoints] = useState("50")
  const [productActive, setProductActive] = useState(true)
  const [creatingProduct, setCreatingProduct] = useState(false)

  // Estado de sorteos
  const [raffles, setRaffles] = useState<Raffle[]>([])
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null)

  // Estado del formulario de sorteos
  const [raffleTitle, setRaffleTitle] = useState("")
  const [raffleDescription, setRaffleDescription] = useState("")
  const [rafflePrize, setRafflePrize] = useState("")
  const [raffleTicketCost, setRaffleTicketCost] = useState("100")
  const [raffleDrawDate, setRaffleDrawDate] = useState("")
  const [raffleStatus, setRaffleStatus] = useState("active")
  const [raffleCategory, setRaffleCategory] = useState("")
  const [raffleSponsor, setRaffleSponsor] = useState("")
  const [raffleImageUrl, setRaffleImageUrl] = useState("")
  const [creatingRaffle, setCreatingRaffle] = useState(false)

  // Verificar autenticación y permisos
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/admin/login')
          return
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || !userData || (userData as any).role !== 'admin') {
          router.push('/admin/login')
          return
        }

        setIsAdmin(true)
        await loadAccounts()
        await loadProducts()
        await loadRaffles()
      } catch (err) {
        console.error('Error al verificar autenticación:', err)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Cargar cuentas
  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      if (!response.ok) {
        throw new Error('Error al cargar cuentas')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Error al cargar cuentas:', err)
      setError('Error al cargar las cuentas')
    }
  }

  // Crear cuenta
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          account_type: accountType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cuenta')
      }

      setSuccess(`Cuenta creada exitosamente: ${username}`)
      setUsername("")
      setPassword("")
      setAccountType('promotor')
      await loadAccounts()
    } catch (err) {
      console.error('Error al crear cuenta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCreating(false)
    }
  }

  // Eliminar cuenta
  const handleDeleteAccount = async (id: string, username: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la cuenta "${username}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar cuenta')
      }

      setSuccess(`Cuenta "${username}" eliminada exitosamente`)
      await loadAccounts()
    } catch (err) {
      console.error('Error al eliminar cuenta:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // Cerrar sesión
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // ============= FUNCIONES DE PRODUCTOS =============

  // Cargar productos
  const loadProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (!response.ok) {
        throw new Error('Error al cargar productos')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error al cargar productos:', err)
      setError('Error al cargar los productos')
    }
  }

  // Limpiar formulario de productos
  const clearProductForm = () => {
    setProductGtin("")
    setProductName("")
    setProductWeight("")
    setProductCategory("")
    setProductPoints("50")
    setProductActive(true)
    setEditingProduct(null)
  }

  // Crear o actualizar producto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingProduct(true)
    setError(null)
    setSuccess(null)

    try {
      const productData = {
        gtin: productGtin,
        name: productName,
        weight: parseFloat(productWeight),
        category: productCategory,
        points_per_kg: parseInt(productPoints),
        active: productActive,
      }

      let response
      if (editingProduct) {
        // Actualizar producto existente
        response = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })
      } else {
        // Crear nuevo producto
        response = await fetch('/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar producto')
      }

      setSuccess(editingProduct
        ? `Producto "${productName}" actualizado exitosamente`
        : `Producto "${productName}" creado exitosamente`
      )
      clearProductForm()
      await loadProducts()
    } catch (err) {
      console.error('Error al guardar producto:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCreatingProduct(false)
    }
  }

  // Editar producto (cargar datos en el formulario)
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductGtin(product.gtin)
    setProductName(product.name)
    setProductWeight(product.weight.toString())
    setProductCategory(product.category)
    setProductPoints(product.points_per_kg.toString())
    setProductActive(product.active)

    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Eliminar producto
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar producto')
      }

      setSuccess(`Producto "${name}" eliminado exitosamente`)
      await loadProducts()
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  // ============= FUNCIONES DE SORTEOS =============

  // Cargar sorteos
  const loadRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('draw_date', { ascending: false })

      if (error) throw error
      setRaffles(data || [])
    } catch (err) {
      console.error('Error al cargar sorteos:', err)
      setError('Error al cargar los sorteos')
    }
  }

  // Limpiar formulario de sorteos
  const clearRaffleForm = () => {
    setRaffleTitle("")
    setRaffleDescription("")
    setRafflePrize("")
    setRaffleTicketCost("100")
    setRaffleDrawDate("")
    setRaffleStatus("active")
    setRaffleCategory("")
    setRaffleSponsor("")
    setRaffleImageUrl("")
    setEditingRaffle(null)
  }

  // Crear o actualizar sorteo
  const handleSaveRaffle = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingRaffle(true)
    setError(null)
    setSuccess(null)

    try {
      const raffleData: Database['public']['Tables']['raffles']['Update'] = {
        title: raffleTitle,
        description: raffleDescription,
        prize: rafflePrize,
        ticket_cost: parseInt(raffleTicketCost),
        draw_date: new Date(raffleDrawDate).toISOString(),
        status: raffleStatus,
        category: raffleCategory || null,
        sponsor: raffleSponsor || null,
        image_url: raffleImageUrl || null,
      }

      if (editingRaffle) {
        // Actualizar sorteo existente
        const { error } = await (supabase
          .from('raffles') as any)
          .update(raffleData)
          .eq('id', editingRaffle.id)

        if (error) throw error
        setSuccess(`Sorteo "${raffleTitle}" actualizado exitosamente`)
      } else {
        // Crear nuevo sorteo
        const { error } = await (supabase
          .from('raffles') as any)
          .insert([raffleData])

        if (error) throw error
        setSuccess(`Sorteo "${raffleTitle}" creado exitosamente`)
      }

      clearRaffleForm()
      await loadRaffles()
    } catch (err) {
      console.error('Error al guardar sorteo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCreatingRaffle(false)
    }
  }

  // Editar sorteo (cargar datos en el formulario)
  const handleEditRaffle = (raffle: Raffle) => {
    setEditingRaffle(raffle)
    setRaffleTitle(raffle.title)
    setRaffleDescription(raffle.description)
    setRafflePrize(raffle.prize)
    setRaffleTicketCost(raffle.ticket_cost.toString())
    // Convertir fecha ISO a formato datetime-local
    const date = new Date(raffle.draw_date)
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setRaffleDrawDate(localDate)
    setRaffleStatus(raffle.status)
    setRaffleCategory(raffle.category)
    setRaffleSponsor(raffle.sponsor)
    setRaffleImageUrl(raffle.image_url || "")

    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Eliminar sorteo
  const handleDeleteRaffle = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el sorteo "${title}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess(`Sorteo "${title}" eliminado exitosamente`)
      await loadRaffles()
    } catch (err) {
      console.error('Error al eliminar sorteo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
              <p className="text-sm text-gray-600">
                {activeTab === 'accounts'
                  ? 'Gestión de cuentas de promotores y ecopuntos'
                  : activeTab === 'products'
                  ? 'Gestión de productos para escaneo'
                  : 'Gestión de sorteos y premios'
                }
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setActiveTab('accounts')}
            variant={activeTab === 'accounts' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Cuentas
          </Button>
          <Button
            onClick={() => setActiveTab('products')}
            variant={activeTab === 'products' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Productos
          </Button>
          <Button
            onClick={() => setActiveTab('raffles')}
            variant={activeTab === 'raffles' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Sorteos
          </Button>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Contenido de Cuentas */}
        {activeTab === 'accounts' && (
          <div>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulario de creación */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Crear Nueva Cuenta
                  </CardTitle>
                  <CardDescription>
                    Crea una cuenta de promotor o ecopunto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nombre de Usuario</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="usuario123"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={creating}
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountType">Tipo de Cuenta</Label>
                      <Select
                        value={accountType}
                        onValueChange={(value: 'promotor' | 'ecopunto') => setAccountType(value)}
                        disabled={creating}
                      >
                        <SelectTrigger id="accountType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="promotor">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Promotor / Kioskero
                            </div>
                          </SelectItem>
                          <SelectItem value="ecopunto">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              Ecopunto
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={creating}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Crear Cuenta
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de cuentas */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cuentas Activas ({accounts.length})
                  </CardTitle>
                  <CardDescription>
                    Gestiona las cuentas existentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {accounts.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <Users className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                        <p className="text-sm">No hay cuentas creadas todavía</p>
                      </div>
                    ) : (
                      accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full p-2 ${
                              account.account_type === 'promotor'
                                ? 'bg-blue-100'
                                : 'bg-purple-100'
                            }`}>
                              {account.account_type === 'promotor' ? (
                                <Users className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Store className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{account.username}</p>
                              <p className="text-xs text-gray-500 capitalize">
                                {account.account_type === 'promotor' ? 'Promotor / Kioskero' : 'Ecopunto'}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleDeleteAccount(account.id, account.username)}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {accounts.filter(a => a.account_type === 'promotor').length}
                      </p>
                      <p className="text-sm text-gray-600">Promotores / Kioskeros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Store className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {accounts.filter(a => a.account_type === 'ecopunto').length}
                      </p>
                      <p className="text-sm text-gray-600">Ecopuntos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
                      <p className="text-sm text-gray-600">Total de Cuentas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

    {/* Contenido de Productos */}
    {activeTab === 'products' && (
      <div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario de productos */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Editar Producto
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5" />
                    Agregar Nuevo Producto
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {editingProduct
                  ? 'Modifica los datos del producto'
                  : 'Agrega un nuevo producto escaneable al sistema'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gtin">Código GTIN / Código de Barras</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="gtin"
                      type="text"
                      placeholder="7790139000462"
                      value={productGtin}
                      onChange={(e) => setProductGtin(e.target.value)}
                      required
                      disabled={creatingProduct}
                      pattern="\d{13}"
                      maxLength={13}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">13 dígitos (EAN-13 / GTIN-13)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productName">Nombre del Producto</Label>
                  <Input
                    id="productName"
                    type="text"
                    placeholder="Lata de Cerveza 355ml"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    disabled={creatingProduct}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productWeight">Peso (gramos)</Label>
                    <Input
                      id="productWeight"
                      type="number"
                      placeholder="14"
                      value={productWeight}
                      onChange={(e) => setProductWeight(e.target.value)}
                      required
                      disabled={creatingProduct}
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productPoints">Puntos por kg</Label>
                    <Input
                      id="productPoints"
                      type="number"
                      placeholder="50"
                      value={productPoints}
                      onChange={(e) => setProductPoints(e.target.value)}
                      required
                      disabled={creatingProduct}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCategory">Categoría</Label>
                  <Select
                    value={productCategory}
                    onValueChange={setProductCategory}
                    disabled={creatingProduct}
                  >
                    <SelectTrigger id="productCategory">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluminio">Aluminio</SelectItem>
                      <SelectItem value="Plástico">Plástico</SelectItem>
                      <SelectItem value="Vidrio">Vidrio</SelectItem>
                      <SelectItem value="Cartón">Cartón</SelectItem>
                      <SelectItem value="Papel">Papel</SelectItem>
                      <SelectItem value="Tetra Pak">Tetra Pak</SelectItem>
                      <SelectItem value="AVU">AVU (Aceite Vegetal Usado)</SelectItem>
                      <SelectItem value="Aceite">Aceite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="productActive"
                    checked={productActive}
                    onChange={(e) => setProductActive(e.target.checked)}
                    disabled={creatingProduct}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <Label htmlFor="productActive" className="cursor-pointer">
                    Producto activo (disponible para escaneo)
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creatingProduct}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {creatingProduct ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editingProduct ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Actualizar Producto
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Crear Producto
                      </>
                    )}
                  </Button>
                  {editingProduct && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearProductForm}
                      disabled={creatingProduct}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de productos */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Registrados ({products.length})
              </CardTitle>
              <CardDescription>
                Gestiona los productos disponibles para escaneo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {products.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                    <p className="text-sm">No hay productos registrados todavía</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {!product.active && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                          <p>
                            <span className="font-medium">GTIN:</span> {product.gtin}
                          </p>
                          <p>
                            <span className="font-medium">Categoría:</span> {product.category}
                          </p>
                          <p>
                            <span className="font-medium">Peso:</span> {product.weight}g |{' '}
                            <span className="font-medium">Puntos:</span> {product.points_per_kg}/kg
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditProduct(product)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas de productos */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  <p className="text-sm text-gray-600">Total Productos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.active).length}
                  </p>
                  <p className="text-sm text-gray-600">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-100 p-3">
                  <XCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => !p.active).length}
                  </p>
                  <p className="text-sm text-gray-600">Inactivos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-3">
                  <Barcode className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(products.map(p => p.category)).size}
                  </p>
                  <p className="text-sm text-gray-600">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )}

    {/* Contenido de Sorteos */}
    {activeTab === 'raffles' && (
      <div>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulario de sorteos */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingRaffle ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Editar Sorteo
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5" />
                    Crear Nuevo Sorteo
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {editingRaffle
                  ? 'Modifica los datos del sorteo'
                  : 'Crea un nuevo sorteo para los usuarios'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveRaffle} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="raffleTitle">Título del Sorteo</Label>
                  <Input
                    id="raffleTitle"
                    type="text"
                    placeholder="Kit de Jardinería Ecológica"
                    value={raffleTitle}
                    onChange={(e) => setRaffleTitle(e.target.value)}
                    required
                    disabled={creatingRaffle}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raffleDescription">Descripción</Label>
                  <textarea
                    id="raffleDescription"
                    placeholder="Descripción detallada del premio..."
                    value={raffleDescription}
                    onChange={(e) => setRaffleDescription(e.target.value)}
                    required
                    disabled={creatingRaffle}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rafflePrize">Premio (corto)</Label>
                  <Input
                    id="rafflePrize"
                    type="text"
                    placeholder="5 Bolsas de Abono + 10 Plantines"
                    value={rafflePrize}
                    onChange={(e) => setRafflePrize(e.target.value)}
                    required
                    disabled={creatingRaffle}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="raffleTicketCost">Costo por Boleto (puntos)</Label>
                    <Input
                      id="raffleTicketCost"
                      type="number"
                      placeholder="100"
                      value={raffleTicketCost}
                      onChange={(e) => setRaffleTicketCost(e.target.value)}
                      required
                      disabled={creatingRaffle}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raffleDrawDate">Fecha del Sorteo</Label>
                    <Input
                      id="raffleDrawDate"
                      type="datetime-local"
                      value={raffleDrawDate}
                      onChange={(e) => setRaffleDrawDate(e.target.value)}
                      required
                      disabled={creatingRaffle}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="raffleCategory">Categoría</Label>
                    <Select
                      value={raffleCategory}
                      onValueChange={setRaffleCategory}
                      disabled={creatingRaffle}
                    >
                      <SelectTrigger id="raffleCategory">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eco">Eco (Sostenibilidad)</SelectItem>
                        <SelectItem value="commerce">Commerce (Comercio local)</SelectItem>
                        <SelectItem value="discount">Discount (Descuentos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raffleStatus">Estado</Label>
                    <Select
                      value={raffleStatus}
                      onValueChange={setRaffleStatus}
                      disabled={creatingRaffle}
                    >
                      <SelectTrigger id="raffleStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raffleSponsor">Patrocinador</Label>
                  <Input
                    id="raffleSponsor"
                    type="text"
                    placeholder="Nombre del patrocinador"
                    value={raffleSponsor}
                    onChange={(e) => setRaffleSponsor(e.target.value)}
                    disabled={creatingRaffle}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raffleImageUrl">URL de Imagen (opcional)</Label>
                  <Input
                    id="raffleImageUrl"
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={raffleImageUrl}
                    onChange={(e) => setRaffleImageUrl(e.target.value)}
                    disabled={creatingRaffle}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={creatingRaffle}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {creatingRaffle ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : editingRaffle ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Actualizar Sorteo
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Crear Sorteo
                      </>
                    )}
                  </Button>
                  {editingRaffle && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearRaffleForm}
                      disabled={creatingRaffle}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lista de sorteos */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Sorteos Registrados ({raffles.length})
              </CardTitle>
              <CardDescription>
                Gestiona los sorteos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {raffles.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Gift className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                    <p className="text-sm">No hay sorteos registrados todavía</p>
                  </div>
                ) : (
                  raffles.map((raffle) => (
                    <div
                      key={raffle.id}
                      className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{raffle.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            raffle.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : raffle.status === 'completed'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {raffle.status === 'active' ? 'Activo' : raffle.status === 'completed' ? 'Completado' : 'Cancelado'}
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                          <p>
                            <span className="font-medium">Premio:</span> {raffle.prize}
                          </p>
                          <p>
                            <span className="font-medium">Categoría:</span> {raffle.category}
                          </p>
                          <p>
                            <span className="font-medium">Costo:</span> {raffle.ticket_cost} pts |{' '}
                            <span className="font-medium">Sorteo:</span> {new Date(raffle.draw_date).toLocaleDateString('es-AR')}
                          </p>
                          {raffle.sponsor && (
                            <p>
                              <span className="font-medium">Patrocinador:</span> {raffle.sponsor}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditRaffle(raffle)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDeleteRaffle(raffle.id, raffle.title)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas de sorteos */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{raffles.length}</p>
                  <p className="text-sm text-gray-600">Total Sorteos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {raffles.filter(r => r.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-100 p-3">
                  <Calendar className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {raffles.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-100 p-3">
                  <Ticket className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {raffles.reduce((sum, r) => sum + r.ticket_cost, 0) / (raffles.length || 1)}
                  </p>
                  <p className="text-sm text-gray-600">Promedio pts/boleto</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )}
      </div>
    </div>
  )
}
