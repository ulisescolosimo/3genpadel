'use client'

import { useState } from 'react'
import { Bell, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function NotificationDropdown({ isMobile = false }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [expandedNotifications, setExpandedNotifications] = useState(new Set())

  const toggleNotification = (notificationId) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

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
        return '🎾'
      case 'sistema':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (tipo) => {
    switch (tipo) {
      case 'liga':
        return 'border-l-4 border-l-blue-500'
      case 'ranking':
        return 'border-l-4 border-l-yellow-500'
      case 'academia':
        return 'border-l-4 border-l-green-500'
      case 'sistema':
        return 'border-l-4 border-l-purple-500'
      default:
        return 'border-l-4 border-l-gray-500'
    }
  }

  // El hook useNotifications ya maneja la verificación del usuario
  if (!notifications) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "sm"}
          className={`relative ${isMobile ? 'h-10 w-10' : 'h-10 w-10'} rounded-full focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 group`}
        >
          <Bell className={`${isMobile ? 'h-6 w-6' : 'h-7 w-7'} text-white/70 group-hover:text-[#E2FF1B] transition-all duration-200`} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 -right-1 ${isMobile ? 'h-5 w-5' : 'h-5 w-5'} rounded-full p-0 text-xs flex items-center justify-center animate-pulse`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className={`${isMobile ? 'w-[calc(100vw-2rem)] max-h-[80vh]' : 'w-96 max-h-[600px]'} bg-black/95 backdrop-blur-md border border-white/20 shadow-2xl`}
        align={isMobile ? "center" : "end"}
        forceMount
      >
        <DropdownMenuLabel className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-[#E2FF1B]" />
            <span className="font-semibold text-white text-lg">Notificaciones</span>
            {unreadCount > 0 && (
              <Badge className="bg-[#E2FF1B] text-black text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs bg-black/50 text-[#E2FF1B] hover:bg-black/70 border border-[#E2FF1B]/30 transition-all duration-200"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <div className={`${isMobile ? 'max-h-[calc(80vh-120px)]' : 'max-h-[500px]'} overflow-y-auto`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2FF1B] mx-auto mb-3"></div>
              <p className="text-white/60 text-sm">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No tienes notificaciones</p>
              <p className="text-white/40 text-xs mt-1">Las notificaciones aparecerán aquí</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const isExpanded = expandedNotifications.has(notification.id)
                
                return (
                  <div
                    key={notification.id}
                    className={`mb-2 rounded-lg transition-all duration-200 ${
                      !notification.leida 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white/2 border border-white/5'
                    } ${getNotificationColor(notification.tipo)}`}
                  >
                    <div 
                      className="p-4 cursor-pointer hover:bg-white/5 transition-all duration-200"
                      onClick={() => toggleNotification(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getNotificationIcon(notification.tipo)}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.leida 
                                ? 'text-white' 
                                : 'text-white/70'
                            }`}>
                              {notification.titulo}
                            </p>
                            <div className="flex items-center gap-2">
                              {!notification.leida && (
                                <div className="w-2 h-2 bg-[#E2FF1B] rounded-full animate-pulse" />
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-white/50" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-white/50" />
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-xs text-white/60 mt-1 ${
                            isExpanded ? '' : 'line-clamp-2'
                          }`}>
                            {notification.mensaje}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-white/40">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                            
                            {!notification.leida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-xs bg-[#E2FF1B]/10 text-[#E2FF1B] hover:bg-[#E2FF1B]/20 border border-[#E2FF1B]/30 transition-all duration-200"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Marcar leída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <Button 
              variant="ghost" 
              className="w-full text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 