'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function AdminConfiguracion() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    nombre_sitio: '',
    descripcion_sitio: '',
    email_contacto: '',
    telefono_contacto: '',
    direccion: '',
    redes_sociales: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    terminos_condiciones: '',
    politica_privacidad: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .single()

      if (error) throw error

      if (data) {
        setConfig({
          ...data,
          redes_sociales: data.redes_sociales || {
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: ''
          }
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching config:', err)
      setError('Error al cargar la configuración')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSocialMediaChange = (platform, value) => {
    setConfig(prev => ({
      ...prev,
      redes_sociales: {
        ...prev.redes_sociales,
        [platform]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert([config])

      if (error) throw error

      toast.success('Configuración guardada correctamente')
    } catch (err) {
      console.error('Error saving config:', err)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 mt-1">Gestiona la configuración general del sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Información General</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Nombre del Sitio</label>
                <Input
                  name="nombre_sitio"
                  value={config.nombre_sitio}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Descripción del Sitio</label>
                <Textarea
                  name="descripcion_sitio"
                  value={config.descripcion_sitio}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Información de Contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Email de Contacto</label>
                <Input
                  type="email"
                  name="email_contacto"
                  value={config.email_contacto}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Teléfono de Contacto</label>
                <Input
                  name="telefono_contacto"
                  value={config.telefono_contacto}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Dirección</label>
                <Input
                  name="direccion"
                  value={config.direccion}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Redes Sociales</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Facebook</label>
                <Input
                  name="facebook"
                  value={config.redes_sociales.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Instagram</label>
                <Input
                  name="instagram"
                  value={config.redes_sociales.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Twitter</label>
                <Input
                  name="twitter"
                  value={config.redes_sociales.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">YouTube</label>
                <Input
                  name="youtube"
                  value={config.redes_sociales.youtube}
                  onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Términos y Condiciones</label>
                <Textarea
                  name="terminos_condiciones"
                  value={config.terminos_condiciones}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white h-32"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Política de Privacidad</label>
                <Textarea
                  name="politica_privacidad"
                  value={config.politica_privacidad}
                  onChange={handleInputChange}
                  className="mt-1 bg-gray-800 border-gray-700 text-white h-32"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 