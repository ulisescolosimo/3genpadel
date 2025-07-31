# Funcionalidad de Contraseña Maestra

Esta funcionalidad permite a los administradores acceder a cualquier cuenta de usuario usando el email de la cuenta + una contraseña maestra.

## Configuración

### 1. Variables de Entorno

Agrega la siguiente variable de entorno a tu archivo `.env.local`:

```bash
# Contraseña maestra para acceso administrativo
MASTER_PASSWORD=tu_contraseña_maestra_segura
```

**⚠️ IMPORTANTE**: 
- Usa una contraseña fuerte y segura
- No compartas esta contraseña
- En producción, considera usar un sistema más robusto como JWT tokens

### 2. Configuración de Supabase

Asegúrate de tener configuradas las siguientes variables de entorno para Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Uso

### Para Administradores

1. **Acceder al panel de administración**
   - Ve a `/admin/login`
   - Inicia sesión con tus credenciales de administrador

2. **Usar la contraseña maestra**
   - En el dashboard, haz clic en "Acceso Maestro" en la sección de "Acciones Rápidas"
   - O ve directamente a `/admin/master-access`

3. **Ingresar credenciales**
   - Email de la cuenta que quieres acceder
   - Contraseña maestra configurada

4. **Confirmar acceso**
   - Se mostrará la información del usuario
   - Confirma el acceso

5. **Navegar como el usuario**
   - Serás redirigido al perfil del usuario
   - Verás un banner amarillo indicando que estás en "Modo Administrador"

6. **Salir del modo impersonación**
   - Haz clic en "Salir" en el banner amarillo
   - O ve a cualquier página del admin

## Características de Seguridad

### ✅ Implementadas

- **Verificación de contraseña maestra**: Solo administradores con la contraseña correcta pueden usar esta funcionalidad
- **Tokens temporales**: Los tokens de acceso expiran en 5 minutos
- **Verificación de usuario**: Se verifica que el usuario existe tanto en Auth como en la tabla usuarios
- **Banner de impersonación**: Siempre visible cuando se está impersonando a un usuario
- **Limpieza automática**: Los tokens expirados se limpian automáticamente

### 🔒 Recomendaciones de Seguridad

1. **Contraseña maestra fuerte**: Usa una contraseña compleja y única
2. **Logs de auditoría**: Considera implementar logs de todas las acciones de impersonación
3. **Límites de uso**: Considera implementar límites de cuántas veces se puede usar por día
4. **Notificaciones**: Considera notificar al usuario cuando alguien accede a su cuenta
5. **JWT tokens**: En producción, considera usar JWT tokens firmados en lugar de tokens simples

## Estructura de Archivos

```
app/
├── api/
│   └── admin-access/
│       └── route.js              # API endpoint para acceso maestro
├── admin/
│   ├── master-access/
│   │   └── page.jsx              # Página de acceso maestro
│   └── impersonate/
│       └── page.jsx              # Página de confirmación de impersonación
components/
├── AuthProvider.jsx              # Modificado para manejar impersonación
├── ImpersonationBanner.jsx       # Banner de impersonación
└── ...
```

## API Endpoints

### POST `/api/admin-access`

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "masterPassword": "contraseña_maestra"
}
```

**Response (éxito):**
```json
{
  "success": true,
  "message": "Acceso concedido",
  "user": {
    "id": "user_id",
    "email": "usuario@ejemplo.com",
    "nombre": "Nombre",
    "apellido": "Apellido",
    "rol": "user"
  },
  "accessToken": "base64_encoded_token",
  "expires": 1234567890
}
```

**Response (error):**
```json
{
  "error": "Mensaje de error"
}
```

## Flujo de Funcionamiento

1. **Solicitud de acceso**: Admin ingresa email + contraseña maestra
2. **Verificación**: Se verifica la contraseña maestra y la existencia del usuario
3. **Generación de token**: Se crea un token temporal de acceso
4. **Confirmación**: Admin confirma el acceso en la página de impersonación
5. **Impersonación**: Se guarda la información del usuario en localStorage
6. **Navegación**: Admin puede navegar como el usuario seleccionado
7. **Banner**: Se muestra un banner indicando el modo administrador
8. **Salida**: Admin puede salir del modo impersonación en cualquier momento

## Troubleshooting

### Problemas Comunes

1. **"Contraseña maestra incorrecta"**
   - Verifica que la variable `MASTER_PASSWORD` esté configurada correctamente
   - Reinicia el servidor después de cambiar la variable

2. **"Usuario no encontrado"**
   - Verifica que el email existe en la tabla `usuarios`
   - Verifica que el usuario existe en Supabase Auth

3. **"Token de acceso expirado"**
   - Los tokens expiran en 5 minutos
   - Intenta el acceso nuevamente

4. **Banner no aparece**
   - Verifica que el componente `ImpersonationBanner` esté importado en el layout
   - Verifica que el `AuthProvider` esté configurado correctamente

### Logs de Debug

Para debuggear, revisa la consola del navegador y los logs del servidor. Los endpoints incluyen logs detallados de las operaciones.

## Consideraciones de Producción

1. **Seguridad**: Implementa rate limiting y monitoreo de uso
2. **Auditoría**: Registra todas las acciones de impersonación
3. **Notificaciones**: Considera notificar a los usuarios sobre accesos administrativos
4. **Backup**: Implementa un sistema de backup para tokens de acceso
5. **Monitoreo**: Implementa alertas para uso inusual de la funcionalidad 