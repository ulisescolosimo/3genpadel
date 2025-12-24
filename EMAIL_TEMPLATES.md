# Templates de Email para Supabase

Este archivo contiene los templates de email personalizados para el proyecto 3gen Padel. Estos templates deben configurarse en el dashboard de Supabase en **Authentication > Email Templates**.

## Configuración en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Authentication** > **Email Templates**
3. Selecciona el tipo de email que deseas configurar
4. Copia y pega el template correspondiente
5. Guarda los cambios

---

## 1. Confirmación de Email (Confirm signup)

**Cuándo se envía:** Cuando un usuario se registra y necesita confirmar su email.

**Variables disponibles:**
- `{{ .ConfirmationURL }}` - URL de confirmación
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de confirmación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio

### Template HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a 3gen Padel</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #E2FF1B; font-size: 28px; font-weight: bold;">¡Bienvenido a 3gen Padel!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Se ha creado una cuenta para ti. Para activar tu cuenta y establecer tu contraseña, haz clic en el siguiente enlace:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #E2FF1B; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Establecer Contraseña
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Este enlace expirará en 24 horas.</strong>
              </p>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si no solicitaste esta cuenta, puedes ignorar este email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Saludos,<br>
                <strong style="color: #000000;">Equipo de 3gen Padel</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer adicional -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 3gen Padel. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template de Texto Plano:

```
¡Bienvenido a 3gen Padel!

Se ha creado una cuenta para ti. Para activar tu cuenta y establecer tu contraseña, visita el siguiente enlace:

{{ .ConfirmationURL }}

Este enlace expirará en 24 horas.

Si no solicitaste esta cuenta, puedes ignorar este email.

Saludos,
Equipo de 3gen Padel
```

---

## 2. Recuperación de Contraseña (Reset password)

**Cuándo se envía:** Cuando un usuario solicita restablecer su contraseña.

**Variables disponibles:**
- `{{ .ConfirmationURL }}` - URL de restablecimiento
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de restablecimiento
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio

### Template HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Contraseña - 3gen Padel</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #E2FF1B; font-size: 28px; font-weight: bold;">Recuperar Contraseña</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en 3gen Padel.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Para establecer una nueva contraseña, haz clic en el siguiente enlace:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #E2FF1B; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Restablecer Contraseña
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Este enlace expirará en 1 hora.</strong>
              </p>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no será cambiada.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Saludos,<br>
                <strong style="color: #000000;">Equipo de 3gen Padel</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer adicional -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 3gen Padel. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template de Texto Plano:

```
Recuperar Contraseña - 3gen Padel

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Para establecer una nueva contraseña, visita el siguiente enlace:

{{ .ConfirmationURL }}

Este enlace expirará en 1 hora.

Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no será cambiada.

Saludos,
Equipo de 3gen Padel
```

---

## 3. Cambio de Email (Change email address)

**Cuándo se envía:** Cuando un usuario solicita cambiar su dirección de email.

**Variables disponibles:**
- `{{ .ConfirmationURL }}` - URL de confirmación
- `{{ .Email }}` - Nuevo email del usuario
- `{{ .Token }}` - Token de confirmación
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio

### Template HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Cambio de Email - 3gen Padel</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #E2FF1B; font-size: 28px; font-weight: bold;">Confirmar Cambio de Email</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Has solicitado cambiar tu dirección de email a: <strong>{{ .Email }}</strong>
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Para confirmar este cambio, haz clic en el siguiente enlace:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #E2FF1B; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Confirmar Cambio de Email
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Este enlace expirará en 24 horas.</strong>
              </p>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si no solicitaste este cambio, puedes ignorar este email de forma segura.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Saludos,<br>
                <strong style="color: #000000;">Equipo de 3gen Padel</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer adicional -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 3gen Padel. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template de Texto Plano:

```
Confirmar Cambio de Email - 3gen Padel

Has solicitado cambiar tu dirección de email a: {{ .Email }}

Para confirmar este cambio, visita el siguiente enlace:

{{ .ConfirmationURL }}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, puedes ignorar este email de forma segura.

Saludos,
Equipo de 3gen Padel
```

---

## 4. Invitación por Email (Magic Link)

**Cuándo se envía:** Cuando se envía un enlace mágico para iniciar sesión.

**Variables disponibles:**
- `{{ .ConfirmationURL }}` - URL de inicio de sesión
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de inicio de sesión
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio

### Template HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iniciar Sesión - 3gen Padel</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #E2FF1B; font-size: 28px; font-weight: bold;">Iniciar Sesión</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Haz clic en el siguiente enlace para iniciar sesión en tu cuenta de 3gen Padel:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="background-color: #E2FF1B; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Iniciar Sesión
                </a>
              </div>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                <strong>Este enlace expirará en 1 hora.</strong>
              </p>
              
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Si no solicitaste iniciar sesión, puedes ignorar este email de forma segura.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Saludos,<br>
                <strong style="color: #000000;">Equipo de 3gen Padel</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer adicional -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © 2024 3gen Padel. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template de Texto Plano:

```
Iniciar Sesión - 3gen Padel

Haz clic en el siguiente enlace para iniciar sesión en tu cuenta:

{{ .ConfirmationURL }}

Este enlace expirará en 1 hora.

Si no solicitaste iniciar sesión, puedes ignorar este email de forma segura.

Saludos,
Equipo de 3gen Padel
```

---

## Notas Importantes

1. **Variables de Supabase:** Asegúrate de usar las variables correctas con la sintaxis `{{ .VariableName }}`
2. **Colores del proyecto:** Los templates usan el color principal `#E2FF1B` (amarillo/verde lima) y fondo negro `#000000`
3. **Responsive:** Los templates están diseñados para ser responsive y funcionar bien en dispositivos móviles
4. **Pruebas:** Siempre prueba los emails después de configurarlos en Supabase
5. **Personalización:** Puedes ajustar los textos, colores y estilos según tus necesidades

---

## Instrucciones de Configuración

1. Accede a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Authentication** > **Email Templates**
3. Selecciona el tipo de email que deseas configurar:
   - **Confirm signup** - Para confirmación de registro
   - **Reset password** - Para recuperación de contraseña
   - **Change email address** - Para cambio de email
   - **Magic Link** - Para enlaces mágicos de inicio de sesión
4. Copia el template HTML correspondiente y pégalo en el campo **Body**
5. Copia el template de texto plano y pégalo en el campo **Subject** (si aplica)
6. Haz clic en **Save** para guardar los cambios
7. Prueba el flujo completo para verificar que los emails se envían correctamente

