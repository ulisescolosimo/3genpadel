# Sistema de Notificaciones - 3gen Padel

## Descripción

Se ha implementado un sistema completo de notificaciones para la aplicación 3gen Padel que incluye:

- **Notificaciones en tiempo real** con icono de campanita en el header
- **Panel de administración** para enviar notificaciones individuales o masivas
- **Base de datos optimizada** con políticas de seguridad
- **API REST** para gestión de notificaciones

## Componentes Implementados

### 1. Componente de Notificaciones (`components/NotificationDropdown.jsx`)
- Icono de campanita con badge de notificaciones no leídas
- Dropdown con lista de notificaciones
- Funcionalidad para marcar como leídas
- Actualización en tiempo real

### 2. Hook Personalizado (`hooks/useNotifications.js`)
- Gestión de estado de notificaciones
- Suscripción en tiempo real a cambios
- Funciones para marcar como leídas
- Optimización de rendimiento

### 3. API de Notificaciones (`app/api/notifications/route.js`)
- Endpoint POST para crear notificaciones
- Endpoint GET para obtener notificaciones
- Validación de datos
- Soporte para notificaciones individuales y masivas

### 4. Panel de Administración (`app/admin/notificaciones/page.jsx`)
- Interfaz para enviar notificaciones individuales
- Interfaz para notificaciones masivas
- Selección de usuarios
- Tipos de notificaciones con iconos

### 5. Base de Datos (`database/notifications.sql`)
- Tabla `notificaciones` con índices optimizados
- Políticas RLS (Row Level Security)
- Funciones para crear notificaciones
- Triggers para actualización automática

## Instalación

### 1. Ejecutar Script SQL
```sql
-- Ejecutar el contenido de database/notifications.sql en Supabase
```

### 2. Verificar Componentes
- El componente `NotificationDropdown` ya está integrado en el header
- El enlace a notificaciones ya está en el panel de administración

### 3. Configuración de Supabase
- Asegurarse de que las políticas RLS estén habilitadas
- Verificar que las funciones estén creadas correctamente

## Tipos de Notificaciones

| Tipo | Icono | Descripción |
|------|-------|-------------|
| `general` | 📢 | Notificaciones generales |
| `liga` | 🏆 | Notificaciones relacionadas con ligas |
| `ranking` | 🥇 | Notificaciones de rankings |
| `academia` | 📚 | Notificaciones de academia |
| `sistema` | 🔔 | Notificaciones del sistema |

## Uso

### Para Usuarios
1. Las notificaciones aparecen automáticamente en el header cuando hay nuevas
2. Hacer clic en el icono de campanita para ver las notificaciones
3. Hacer clic en una notificación para marcarla como leída
4. Usar "Marcar como leídas" para marcar todas

### Para Administradores
1. Ir a `/admin/notificaciones`
2. Elegir entre notificación individual o masiva
3. Seleccionar usuario (para individuales)
4. Elegir tipo de notificación
5. Escribir título y mensaje
6. Enviar notificación

## Características Técnicas

### Tiempo Real
- Suscripción a cambios en la tabla `notificaciones`
- Actualización automática del contador
- Nuevas notificaciones aparecen instantáneamente

### Seguridad
- Políticas RLS para acceso controlado
- Solo admins pueden crear notificaciones
- Usuarios solo ven sus propias notificaciones

### Rendimiento
- Índices optimizados en la base de datos
- Límite de 10 notificaciones por carga
- Actualización eficiente del estado local

## Estructura de la Base de Datos

```sql
CREATE TABLE notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('liga', 'ranking', 'academia', 'sistema', 'general')),
  leida BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### POST /api/notifications
```json
{
  "titulo": "Título de la notificación",
  "mensaje": "Mensaje de la notificación",
  "tipo": "general",
  "usuario_id": "uuid-del-usuario", // Solo para individuales
  "es_masiva": false
}
```

### GET /api/notifications?usuario_id=uuid&limit=10&offset=0
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "titulo": "Título",
      "mensaje": "Mensaje",
      "tipo": "general",
      "leida": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Próximos Pasos

1. **Notificaciones Push**: Implementar notificaciones push del navegador
2. **Email**: Enviar notificaciones por email
3. **Filtros**: Agregar filtros por tipo de notificación
4. **Historial**: Página completa de historial de notificaciones
5. **Plantillas**: Sistema de plantillas para notificaciones comunes

## Troubleshooting

### Problemas Comunes

1. **No aparecen notificaciones**
   - Verificar que el usuario esté autenticado
   - Revisar las políticas RLS en Supabase
   - Verificar la conexión en tiempo real

2. **Error al crear notificaciones**
   - Verificar que el usuario sea admin
   - Revisar los logs de la API
   - Verificar que las funciones SQL estén creadas

3. **No se actualiza el contador**
   - Verificar la suscripción en tiempo real
   - Revisar el hook useNotifications
   - Verificar que el usuario tenga permisos

### Logs Útiles
```javascript
// En el navegador
console.log('Notificaciones:', notifications)
console.log('Contador no leídas:', unreadCount)

// En Supabase
// Revisar logs de funciones y políticas RLS
``` 