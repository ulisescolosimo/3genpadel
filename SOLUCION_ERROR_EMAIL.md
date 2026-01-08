# Solución: Error al Enviar Email de Recuperación de Contraseña

Si estás recibiendo el error `{"code":"unexpected_failure","message":"Error sending recovery email"}`, sigue estos pasos para solucionarlo:

## Posibles Causas y Soluciones

### 1. URL de Redirección No Configurada en Supabase ⚠️ **MÁS COMÚN**

**Problema:** La URL de redirección no está en la lista de URLs permitidas en Supabase. Esto causa el error 500 "Error sending recovery email".

**Solución:**
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** > **URL Configuration**
3. En **Redirect URLs**, agrega las siguientes URLs (una por línea):
   ```
   http://localhost:3000/**
   http://localhost:3000/restablecer-contrasena
   https://tu-dominio.com/**
   https://tu-dominio.com/restablecer-contrasena
   ```
4. Reemplaza `tu-dominio.com` con tu dominio de producción
5. En **Site URL**, asegúrate de tener configurado:
   ```
   http://localhost:3000 (para desarrollo)
   https://tu-dominio.com (para producción)
   ```
6. Haz clic en **Save**
7. **IMPORTANTE:** Espera unos segundos y recarga la página para asegurarte de que los cambios se guardaron

### 2. Configuración de Email No Habilitada

**Problema:** El servicio de email no está configurado correctamente en Supabase.

**Solución:**
1. Ve a **Authentication** > **Providers** en Supabase Dashboard
2. Verifica que **Email** esté habilitado
3. Si usas un proveedor de email personalizado (SMTP), verifica la configuración:
   - Ve a **Settings** > **Auth** > **SMTP Settings**
   - Verifica que todos los campos estén correctamente configurados
   - Prueba la conexión SMTP

### 3. Usuario No Existe en Supabase Auth

**Problema:** El email no está registrado en Supabase Auth (solo existe en la tabla `usuarios` pero no en Auth).

**Solución:**
- El usuario debe tener una cuenta creada en Supabase Auth
- Si el usuario fue creado manualmente en la base de datos, necesita activar su cuenta primero
- Usa la página de activación de cuenta (`/activar-cuenta`) para crear la cuenta en Auth

### 4. Límite de Rate Limiting

**Problema:** Se han enviado demasiados emails de recuperación en poco tiempo.

**Solución:**
- Espera unos minutos antes de intentar nuevamente
- Supabase limita la cantidad de emails que se pueden enviar por hora

### 5. Template de Email No Configurado

**Problema:** El template de email de recuperación de contraseña no está configurado correctamente.

**Solución:**
1. Ve a **Authentication** > **Email Templates** en Supabase Dashboard
2. Selecciona **Reset password**
3. Verifica que el template tenga el contenido correcto
4. Asegúrate de que la variable `{{ .ConfirmationURL }}` esté presente
5. Consulta el archivo `EMAIL_TEMPLATES.md` en este proyecto para ver los templates recomendados

## Verificación Paso a Paso

### Paso 1: Verificar Configuración de URLs

```bash
# En Supabase Dashboard:
# Authentication > URL Configuration > Redirect URLs
# Debe incluir:
# - http://localhost:3000/restablecer-contrasena (desarrollo)
# - https://tu-dominio.com/restablecer-contrasena (producción)
```

### Paso 2: Verificar que el Usuario Existe

Puedes verificar si un usuario existe en Supabase Auth usando la API:

```javascript
// En la consola del navegador o en una herramienta de desarrollo
const { data, error } = await supabase.auth.admin.listUsers()
// Buscar el email en la lista
```

O verifica en Supabase Dashboard:
- **Authentication** > **Users**
- Busca el email del usuario

### Paso 3: Probar el Envío de Email

1. Ve a la página de login: `/login`
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email que SÍ existe en Supabase Auth
4. Verifica la consola del navegador para ver errores detallados
5. Revisa los logs en Supabase Dashboard > **Logs** > **Auth Logs**

### Paso 4: Verificar Logs de Supabase

1. Ve a **Logs** > **Auth Logs** en Supabase Dashboard
2. Busca errores relacionados con el envío de emails
3. Los logs mostrarán detalles específicos del error

## Configuración Recomendada

### Variables de Entorno

Asegúrate de tener estas variables configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### URLs de Redirección en Supabase

En **Authentication** > **URL Configuration**, configura:

**Site URL:**
```
http://localhost:3000 (desarrollo)
https://tu-dominio.com (producción)
```

**Redirect URLs:**
```
http://localhost:3000/**
https://tu-dominio.com/**
http://localhost:3000/restablecer-contrasena
https://tu-dominio.com/restablecer-contrasena
http://localhost:3000/auth/callback
https://tu-dominio.com/auth/callback
```

## Solución Temporal

Si necesitas una solución temporal mientras resuelves el problema de configuración, puedes:

1. **Usar la página de activación de cuenta** para usuarios nuevos
2. **Contactar al administrador** para restablecer la contraseña manualmente
3. **Verificar manualmente** que el usuario tenga una cuenta en Auth antes de intentar recuperar la contraseña

## Contacto y Soporte

Si después de seguir estos pasos el problema persiste:

1. Revisa los logs de Supabase para más detalles
2. Verifica la documentación oficial de Supabase: https://supabase.com/docs/guides/auth
3. Contacta con el soporte de Supabase si es necesario

## Notas Adicionales

- Supabase puede devolver éxito incluso si el email no existe (por seguridad)
- El email puede tardar unos minutos en llegar
- Verifica la carpeta de spam si no recibes el email
- Algunos proveedores de email bloquean emails automáticos, verifica la configuración SMTP

