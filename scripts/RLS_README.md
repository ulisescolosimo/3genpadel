# Configuración de Políticas RLS (Row Level Security)

Este directorio contiene los archivos necesarios para configurar las políticas de seguridad de nivel de fila (RLS) en Supabase.

## Problema

El error `"new row violates row-level security policy"` indica que las políticas RLS están bloqueando las operaciones de actualización en la tabla `usuarios`.

## Solución

### Opción 1: Aplicar desde el Dashboard de Supabase (Recomendado)

1. Ve a tu **Dashboard de Supabase**
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `rls-policies.sql`
4. Ejecuta el script

### Opción 2: Usar el script automatizado

1. Asegúrate de tener las variables de entorno configuradas:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

2. Ejecuta el script:
   ```bash
   node scripts/apply-rls-policies.js
   ```

## Políticas Aplicadas

### Para Usuarios Regulares
- **SELECT**: Pueden ver su propio perfil
- **UPDATE**: Pueden actualizar su propio perfil (incluyendo `avatar_url`)
- **INSERT**: Pueden crear su propio perfil

### Para Administradores
- **SELECT**: Pueden ver todos los perfiles
- **UPDATE**: Pueden actualizar todos los perfiles
- **INSERT**: Pueden crear perfiles para otros usuarios

## Verificación

Después de aplicar las políticas, puedes verificar que funcionan:

1. Ve a **Authentication > Policies** en tu dashboard de Supabase
2. Busca la tabla `usuarios`
3. Deberías ver las políticas listadas

## Campos Permitidos para Actualización

Los usuarios pueden actualizar estos campos de su propio perfil:
- `nombre`
- `apellido`
- `telefono`
- `nivel`
- `fecha_nacimiento`
- `dni`
- `avatar_url` ⭐ (nuevo campo para imágenes de perfil)

## Notas Importantes

- Las políticas usan `auth.uid()::text = id::text` para comparar el ID del usuario autenticado
- Los administradores tienen acceso completo a todos los perfiles
- RLS debe estar habilitado en la tabla `usuarios`

## Troubleshooting

Si sigues teniendo problemas:

1. **Verifica que RLS esté habilitado**:
   ```sql
   ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
   ```

2. **Verifica las políticas existentes**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'usuarios';
   ```

3. **Elimina políticas conflictivas** (si las hay):
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON usuarios;
   ```

4. **Verifica el formato del ID**: Asegúrate de que el `id` en la tabla `usuarios` sea del mismo tipo que `auth.uid()` 