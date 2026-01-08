'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Login con Supabase Auth (email y contraseña)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (authError) {
        throw new Error('Credenciales incorrectas')
      }

      // 2. Verificar que el usuario esté en la tabla usuarios y tenga rol 'admin'
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .eq('rol', 'admin')
        .single()

      if (usuarioError || !usuario) {
        // Si no es admin, cerrar sesión y mostrar error
        await supabase.auth.signOut()
        throw new Error('No tienes permisos de administrador')
      }

      // 3. Guardar sesión de admin en localStorage
      localStorage.setItem('admin', JSON.stringify({ 
        id: usuario.id,
        email: usuario.email || data.user.email,
        nombre: usuario.nombre || 'Administrador'
      }))

      // 4. Redirigir a circuito3gen
      router.push('/admin/circuito3gen')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Panel de Administración</h1>
            <p className="text-gray-400">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                placeholder="admin@ejemplo.com"
                className="w-full p-3 rounded bg-gray-800/50 border border-gray-700 text-white"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full p-3 rounded bg-gray-800/50 border border-gray-700 text-white"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#E2FF1B] text-black hover:bg-[#E2FF1B]/90 font-medium p-3 rounded"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 