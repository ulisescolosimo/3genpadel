# Configuración de Recuperación de Contraseña en Supabase

Si estás recibiendo el error `{"code":"unexpected_failure","message":"Error sending recovery email"}`, sigue estos pasos **en orden**:

## ✅ Paso 1: Configurar URLs de Redirección

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration**
4. En **Site URL**, asegúrate de tener:
   ```
   http://localhost:3000
   ```
   (Para producción, usa tu dominio: `https://tu-dominio.com`)

5. En **Redirect URLs**, agrega estas URLs (una por línea):
   ```
   http://localhost:3000/**
   http://localhost:3000/restablecer-contrasena
   http://localhost:3000/auth/callback
   ```
   (Para producción, reemplaza `localhost:3000` con tu dominio)

6. Haz clic en **Save**
7. **Espera 10-15 segundos** y recarga la página para verificar que se guardó

## ✅ Paso 2: Verificar Configuración de Email

### Opción A: Usar el Servicio de Email por Defecto de Supabase

1. Ve a **Settings** → **Auth** → **SMTP Settings**
2. Si está vacío o deshabilitado, Supabase usa su servicio por defecto
3. **Nota:** El servicio por defecto tiene límites y puede no funcionar en proyectos gratuitos

### Opción B: Configurar SMTP Personalizado (Recomendado)

1. Ve a **Settings** → **Auth** → **SMTP Settings**
2. Habilita **Enable Custom SMTP**
3. Configura tu proveedor de email:
   - **Gmail**: Usa App Password (no tu contraseña normal)
   - **SendGrid**: Usa API Key
   - **Mailgun**: Usa API Key
   - **Otros**: Consulta la documentación de tu proveedor

4. Configuración típica:
   ```
   Host: smtp.gmail.com (para Gmail)
   Port: 587
   Username: tu-email@gmail.com
   Password: tu-app-password
   Sender email: tu-email@gmail.com
   Sender name: 3gen Padel
   ```

5. Haz clic en **Save**
6. Prueba la conexión si hay un botón de prueba

## ✅ Paso 3: Configurar Template de Email

1. Ve a **Authentication** → **Email Templates**
2. Selecciona **Reset password** en el menú desplegable
3. Verifica que el template tenga contenido
4. Si está vacío, copia el template del archivo `EMAIL_TEMPLATES.md` en este proyecto
5. Asegúrate de que incluya la variable `{{ .ConfirmationURL }}`
6. Haz clic en **Save**

## ✅ Paso 4: Verificar que el Usuario Existe

1. Ve a **Authentication** → **Users**
2. Busca el email del usuario
3. Verifica que el usuario exista y esté confirmado
4. Si el usuario solo tiene OAuth (Google), no podrá recuperar contraseña tradicional

## ✅ Paso 5: Probar el Envío

1. Ve a tu aplicación en `http://localhost:3000/login`
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email que exista en Supabase Auth
4. Haz clic en "Enviar enlace de recuperación"
5. Verifica los logs en Supabase Dashboard → **Logs** → **Auth Logs**

## ⚠️ IMPORTANTE: Cómo Funciona el Flujo

**NO puedes visitar directamente esta URL:**
```
https://uxmxfycucxuftsaeiicd.supabase.co/auth/v1/recover?redirect_to=...
```

**Esa URL es un endpoint de API que requiere:**
- Método: POST (no GET)
- Body: `{"email": "usuario@email.com"}`
- Headers: Authorization con el API key

**El flujo correcto es:**
1. Usuario ingresa su email en el formulario de recuperación
2. La aplicación hace POST a `/auth/v1/recover` con el email
3. Supabase envía un email al usuario con un enlace especial
4. El usuario hace clic en el enlace del email
5. Ese enlace lo redirige a `/restablecer-contrasena` con un token
6. El usuario puede establecer su nueva contraseña

**El enlace que recibirá el usuario en el email será algo como:**
```
http://localhost:3000/restablecer-contrasena#access_token=...&type=recovery
```

## 🔍 Verificación de Errores

### Si el error persiste:

1. **Revisa los logs de Supabase:**
   - Ve a **Logs** → **Auth Logs**
   - Busca errores relacionados con el envío de email
   - Los logs mostrarán el error específico

2. **Verifica el estado del servicio de email:**
   - Ve a **Settings** → **Auth** → **SMTP Settings**
   - Verifica que no haya errores de conexión
   - Si usas Gmail, asegúrate de tener "Less secure app access" habilitado o usar App Password

3. **Verifica rate limits:**
   - Supabase limita la cantidad de emails que se pueden enviar
   - Si has enviado muchos emails, espera unos minutos

4. **Verifica que la URL esté correctamente configurada:**
   - La URL debe coincidir exactamente (incluyendo http/https)
   - No debe tener espacios al final
   - Debe estar en la lista de Redirect URLs

## 📝 Notas Importantes

- **Usuarios OAuth:** Si un usuario se registró solo con Google, no puede recuperar contraseña porque no tiene una. Debe iniciar sesión con Google.

- **Proyectos gratuitos:** El servicio de email por defecto de Supabase puede tener limitaciones. Se recomienda configurar SMTP personalizado.

- **Tiempo de propagación:** Los cambios en Supabase pueden tardar unos segundos en aplicarse. Espera 10-15 segundos después de guardar.

- **Carpeta de spam:** Si el email se envía correctamente pero no llega, verifica la carpeta de spam.

## 🆘 Si Nada Funciona

1. Verifica que todas las variables de entorno estén configuradas:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

2. Contacta con el soporte de Supabase si el problema persiste después de verificar todos los pasos anteriores.

3. Como alternativa temporal, puedes usar la funcionalidad de "activar cuenta" para usuarios nuevos.

