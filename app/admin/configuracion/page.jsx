'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  AlertCircle,
  Loader2,
  Save,
  Trophy,
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminConfiguracion() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [config, setConfig] = useState({
    id: '31945174-ed96-4f54-a106-80067ab399c7',
    torneo_en_vivo: {
      activo: false,
      nombre: '',
      jugadores: [
        { nombre: '', apellido: '', ranking: '' },
        { nombre: '', apellido: '', ranking: '' }
      ],
      ubicacion: '',
      fecha: '',
      categoria: '',
      resultado: '',
      siguiente_partido: '',
      hora: '',
      link_en_vivo: ''
    }
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', '31945174-ed96-4f54-a106-80067ab399c7')
        .single()

      if (error) throw error

      if (data) {
        setConfig({
          id: '31945174-ed96-4f54-a106-80067ab399c7',
          torneo_en_vivo: data.torneo_en_vivo || {
            activo: false,
            nombre: '',
            jugadores: [
              { nombre: '', apellido: '', ranking: '' },
              { nombre: '', apellido: '', ranking: '' }
            ],
            ubicacion: '',
            fecha: '',
            categoria: '',
            resultado: '',
            siguiente_partido: '',
            hora: '',
            link_en_vivo: ''
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



  const handleTorneoEnVivoChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      torneo_en_vivo: {
        ...prev.torneo_en_vivo,
        [field]: value
      }
    }))
  }

  const handleJugadorChange = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      torneo_en_vivo: {
        ...prev.torneo_en_vivo,
        jugadores: prev.torneo_en_vivo.jugadores.map((jugador, i) => 
          i === index ? { ...jugador, [field]: value } : jugador
        )
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
      <div className="min-h-screen bg-black p-4 sm:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#E2FF1B]" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-red-500 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Configuración de Torneo en Vivo</h1>
            <p className="text-gray-400">Gestiona la notificación flotante de torneos en vivo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-[#E2FF1B]" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">Notificación de Torneo en Vivo</h2>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {/* Toggle para activar/desactivar */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-400">Activar notificación de torneo en vivo</Label>
                  <p className="text-xs text-gray-500 mt-1">Muestra una notificación flotante cuando hay un torneo en curso</p>
                </div>
                <Switch
                  checked={config.torneo_en_vivo.activo}
                  onCheckedChange={(checked) => handleTorneoEnVivoChange('activo', checked)}
                />
              </div>

                             {/* Campos del torneo - solo mostrar si está activo */}
                               {config.torneo_en_vivo.activo && (
                  <div className="space-y-4 sm:space-y-6 border-t border-gray-700 pt-4 sm:pt-6">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Nombre del Torneo</label>
                    <Input
                      value={config.torneo_en_vivo.nombre}
                      onChange={(e) => handleTorneoEnVivoChange('nombre', e.target.value)}
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                      placeholder="Ej: Torneo Internacional de Pádel"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Categoría</label>
                    <Input
                      value={config.torneo_en_vivo.categoria}
                      onChange={(e) => handleTorneoEnVivoChange('categoria', e.target.value)}
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                      placeholder="Ej: Open"
                    />
                  </div>

                  {/* Jugadores */}
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-3 block">Jugadores</label>
                    <div className="space-y-3">
                      {config.torneo_en_vivo.jugadores.map((jugador, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <label className="text-xs text-gray-500">Nombre</label>
                            <Input
                              value={jugador.nombre}
                              onChange={(e) => handleJugadorChange(index, 'nombre', e.target.value)}
                              className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                              placeholder="Nombre"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Apellido</label>
                            <Input
                              value={jugador.apellido}
                              onChange={(e) => handleJugadorChange(index, 'apellido', e.target.value)}
                              className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                              placeholder="Apellido"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Ranking</label>
                            <Input
                              value={jugador.ranking}
                              onChange={(e) => handleJugadorChange(index, 'ranking', e.target.value)}
                              className="mt-1 bg-gray-700 border-gray-600 text-white text-sm"
                              placeholder="Ej: Top 50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Ubicación</label>
                      <Input
                        value={config.torneo_en_vivo.ubicacion}
                        onChange={(e) => handleTorneoEnVivoChange('ubicacion', e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                        placeholder="Ej: Madrid, España"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Fecha</label>
                      <Input
                        value={config.torneo_en_vivo.fecha}
                        onChange={(e) => handleTorneoEnVivoChange('fecha', e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                        placeholder="Ej: 15-17 Marzo 2025"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Hora</label>
                      <Input
                        value={config.torneo_en_vivo.hora}
                        onChange={(e) => handleTorneoEnVivoChange('hora', e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                        placeholder="Ej: 18:30"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Resultado Actual</label>
                      <Input
                        value={config.torneo_en_vivo.resultado}
                        onChange={(e) => handleTorneoEnVivoChange('resultado', e.target.value)}
                        className="mt-1 bg-gray-800 border-gray-700 text-white"
                        placeholder="Ej: 1-0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Próximo Partido</label>
                    <Input
                      value={config.torneo_en_vivo.siguiente_partido}
                      onChange={(e) => handleTorneoEnVivoChange('siguiente_partido', e.target.value)}
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                      placeholder="Ej: Cuartos de Final"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Link para Ver en Vivo</label>
                    <Input
                      value={config.torneo_en_vivo.link_en_vivo}
                      onChange={(e) => handleTorneoEnVivoChange('link_en_vivo', e.target.value)}
                      className="mt-1 bg-gray-800 border-gray-700 text-white"
                      placeholder="Ej: https://www.worldpadeltour.com"
                    />
                  </div>
                </div>
              )}
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
      </div>
    </div>
  )
} 