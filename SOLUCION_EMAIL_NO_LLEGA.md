# Solución: El Email de Recuperación No Llega desde Supabase

Si el email de recuperación no está llegando, sigue estos pasos para diagnosticar y solucionar el problema:

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar Logs de Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Logs** → **Auth Logs**
4. Busca entradas relacionadas con "recover" o "password reset"
5. Revisa si hay errores específicos

**Qué buscar:**
- Si ves errores de SMTP → El servicio de email no está configurado
- Si ves "rate limit" → Has enviado demasiados emails
- Si ves "invalid redirect" → La URL no está configurada

### Paso 2: Verificar Configuración SMTP

#### Opción A: Usar Servicio por Defecto de Supabase (Limitado)

1. Ve a **Settings** → **Auth** → **SMTP Settings**
2. Si está vacío, Supabase usa su servicio por defecto
3. **⚠️ IMPORTANTE:** En proyectos gratuitos, el servicio por defecto puede no funcionar o tener limitaciones severas
4. **Solución:** Configura SMTP personalizado (recomendado)

#### Opción B: Configurar SMTP Personalizado (Recomendado)

**Para Gmail:**

1. Ve a **Settings** → **Auth** → **SMTP Settings**
2. Habilita **Enable Custom SMTP**
3. Configura:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: tu-email@gmail.com
   Password: [App Password de Gmail - NO tu contraseña normal]
   Sender email: tu-email@gmail.com
   Sender name: 3gen Padel
   ```

4. **Cómo obtener App Password de Gmail:**
   - Ve a tu cuenta de Google → Seguridad
   - Habilita "Verificación en 2 pasos" si no está habilitada
   - Ve a "Contraseñas de aplicaciones"
   - Genera una nueva contraseña para "Correo"
   - Usa esa contraseña (16 caracteres) en Supabase

**Para SendGrid (Recomendado para producción):**

1. Crea una cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key en SendGrid
3. En Supabase, configura:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [tu API Key de SendGrid]
   Sender email: tu-email@tudominio.com
   Sender name: 3gen Padel
   ```

**Para otros proveedores:**
- Consulta la documentación de tu proveedor de email para obtener los datos SMTP

### Paso 3: Verificar Template de Email

1. Ve a **Authentication** → **Email Templates**
2. Selecciona **Reset password** en el menú desplegable
3. Verifica que:
   - El template tenga contenido HTML
   - Incluya la variable `{{ .ConfirmationURL }}`
   - El Subject tenga texto

4. Si está vacío, copia el template de `EMAIL_TEMPLATES.md` en este proyecto

### Paso 4: Verificar URLs de Redirección

1. Ve a **Authentication** → **URL Configuration**
2. En **Site URL**, debe estar:
   ```
   http://localhost:3000
   ```
3. En **Redirect URLs**, debe incluir:
   ```
   http://localhost:3000/**
   http://localhost:3000/restablecer-contrasena
   http://localhost:3000/auth/callback
   ```
4. Guarda y espera 10-15 segundos

### Paso 5: Verificar Carpeta de Spam

1. Revisa la carpeta de spam/correo no deseado
2. Busca emails de "noreply@mail.app.supabase.io" o tu dominio configurado
3. Si está en spam, marca como "No es spam"

### Paso 6: Verificar Rate Limiting

1. Supabase limita la cantidad de emails que se pueden enviar
2. Si has enviado muchos emails de prueba, espera 15-30 minutos
3. Intenta nuevamente después de esperar

### Paso 7: Probar con Otro Email

1. Prueba con un email diferente
2. Algunos proveedores de email bloquean emails automáticos
3. Prueba con Gmail, Outlook, o Yahoo

## 🛠️ Soluciones por Tipo de Error

### ⚠️ Error: "535 5.7.8 Error: authentication failed" (MÁS COMÚN)

**Causa:** Las credenciales SMTP (usuario/contraseña) son incorrectas o la autenticación falló.

**Solución paso a paso:**

1. **Ve a Supabase Dashboard → Settings → Auth → SMTP Settings**

2. **Si usas Gmail:**
   - ❌ **NO uses tu contraseña normal de Gmail**
   - ✅ **DEBES usar una App Password**
   - Cómo obtener App Password:
     1. Ve a tu cuenta de Google → [Seguridad](https://myaccount.google.com/security)
     2. Habilita "Verificación en 2 pasos" si no está habilitada
     3. Ve a "Contraseñas de aplicaciones" (o busca "App passwords")
     4. Genera una nueva contraseña para "Correo"
     5. Copia la contraseña de 16 caracteres (sin espacios)
     6. Pégala en el campo "Password" de Supabase SMTP Settings

3. **Verifica la configuración:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: tu-email@gmail.com (el email completo, no solo el nombre)
   Password: [App Password de 16 caracteres]
   Sender email: tu-email@gmail.com
   Sender name: 3gen Padel
   ```

4. **Guarda y espera 10-15 segundos**

5. **Prueba nuevamente**

**Si el error persiste:**
- Verifica que el email en "Username" sea exactamente el mismo que usaste para generar la App Password
- Asegúrate de que la App Password sea reciente (no expirada)
- Verifica que "Verificación en 2 pasos" esté habilitada en tu cuenta de Google

### Error: "SMTP connection failed"
**Causa:** Configuración SMTP incorrecta (Host, Port, etc.)
**Solución:**
- Verifica que el Host y Port sean correctos
- Para Gmail: `smtp.gmail.com` puerto `587`
- Verifica que el puerto 587 esté abierto (no bloqueado por firewall)
- Prueba con otro proveedor de email si el problema persiste

### Error: "Rate limit exceeded"
**Causa:** Demasiados emails enviados
**Solución:**
- Espera 15-30 minutos
- En proyectos gratuitos, el límite es muy bajo
- Considera configurar SMTP personalizado para evitar límites

### Error: "Invalid redirect URL"
**Causa:** URL no está en la lista de permitidas
**Solución:**
- Agrega la URL exacta en Redirect URLs
- Asegúrate de incluir `http://` o `https://`
- No incluyas espacios al final

### No hay error pero el email no llega
**Posibles causas:**
1. **Servicio de email por defecto no funciona** (común en proyectos gratuitos)
   - **Solución:** Configura SMTP personalizado

2. **Email bloqueado por el proveedor**
   - **Solución:** Prueba con otro proveedor de email

3. **Template de email mal configurado**
   - **Solución:** Verifica que el template tenga `{{ .ConfirmationURL }}`

4. **El email está en spam**
   - **Solución:** Revisa carpeta de spam

## ✅ Configuración Recomendada para Producción

1. **Usa SMTP personalizado** (no el servicio por defecto)
2. **Configura un dominio personalizado** para los emails
3. **Usa un servicio profesional** como SendGrid, Mailgun, o AWS SES
4. **Configura SPF y DKIM** en tu dominio para evitar spam
5. **Monitorea los logs** regularmente

## 🧪 Prueba Rápida

Para verificar si el problema es de configuración:

1. Ve a Supabase Dashboard → **Authentication** → **Users**
2. Busca un usuario de prueba
3. Haz clic en los tres puntos → **Send password reset email**
4. Si esto tampoco funciona, el problema es de configuración SMTP

## 📞 Si Nada Funciona

1. Verifica que todas las variables de entorno estén correctas
2. Revisa los logs de Supabase para errores específicos
3. Contacta con el soporte de Supabase si el problema persiste
4. Considera usar un servicio de email externo como alternativa

## 🔗 Recursos Útiles

- [Documentación de Supabase sobre Email](https://supabase.com/docs/guides/auth/auth-smtp)
- [Configuración de Gmail SMTP](https://support.google.com/a/answer/176600)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)

