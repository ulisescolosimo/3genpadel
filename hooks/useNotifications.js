import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.leida).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, leida: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', user.id)
        .eq('leida', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, leida: true }))
      )
      setUnreadCount(0)
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  // Suscripción en tiempo real a nuevas notificaciones
  useEffect(() => {
    if (!user) return

    // Cargar notificaciones iniciales
    fetchNotifications()

    // Suscribirse a cambios en la tabla de notificaciones
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Nueva notificación recibida:', payload.new)
          setNotifications(prev => [payload.new, ...prev.slice(0, 9)])
          setUnreadCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notificación actualizada:', payload.new)
          setNotifications(prev => 
            prev.map(n => 
              n.id === payload.new.id ? payload.new : n
            )
          )
          // Recalcular contador de no leídas
          setNotifications(prev => {
            const newNotifications = prev.map(n => 
              n.id === payload.new.id ? payload.new : n
            )
            setUnreadCount(newNotifications.filter(n => !n.leida).length)
            return newNotifications
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
} 