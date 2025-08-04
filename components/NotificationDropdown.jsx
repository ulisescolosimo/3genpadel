'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from '@/hooks/useNotifications'

export default function NotificationDropdown() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()

  const formatNotificationTime = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now - created) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays}d`
    
    return created.toLocaleDateString('es-ES')
  }

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'liga':
        return '🏆'
      case 'ranking':
        return '🥇'
      case 'academia':
        return '📚'
      case 'sistema':
        return '🔔'
      default:
        return '📢'
    }
  }

  // El hook useNotifications ya maneja la verificación del usuario
  if (!notifications) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
                 <Button
           variant="ghost"
           size="sm"
           className="relative h-10 w-10 rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
         >
           <Bell className="h-7 w-7 text-white/70 hover:text-[#E2FF1B] transition-colors" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 max-h-96" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-medium">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Marcar como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No tienes notificaciones
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-3 cursor-pointer ${!notification.leida ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notification.leida ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {notification.titulo}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.mensaje}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatNotificationTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.leida && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 