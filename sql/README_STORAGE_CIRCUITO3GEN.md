# Configuración de Storage para Circuito3Gen Inscripciones

Este documento explica cómo configurar el bucket de Storage y las políticas RLS necesarias para que los usuarios puedan subir comprobantes de pago.

## Pasos para Configurar

### 1. Crear el Bucket en Supabase

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Haz clic en **New bucket**
5. Configura el bucket con los siguientes valores:
   - **Name**: `circuito3gen-inscripciones`
   - **Public bucket**: Desactivado (privado)
   - Haz clic en **Create bucket**

### 2. Ejecutar las Políticas SQL

Ejecuta el archivo `storage_policies_circuito3gen.sql` en el SQL Editor de Supabase:

1. Ve a **SQL Editor** en el dashboard de Supabase
2. Crea una nueva query
3. Copia y pega el contenido de `storage_policies_circuito3gen.sql`
4. Ejecuta la query

Este archivo creará las políticas RLS necesarias para:
- Permitir a usuarios autenticados subir archivos (INSERT)
- Permitir a usuarios autenticados leer archivos (SELECT)
- Permitir a usuarios autenticados actualizar archivos (UPDATE)
- Permitir a usuarios autenticados eliminar archivos (DELETE)

### 3. Verificar las Políticas

Puedes verificar que las políticas se crearon correctamente ejecutando:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%circuito3gen%';
```

### 4. Verificar que el Bucket Existe

Puedes verificar que el bucket existe ejecutando:

```sql
SELECT * FROM storage.buckets WHERE name = 'circuito3gen-inscripciones';
```

## Solución de Problemas

### Error: "new row violates row-level security policy"

Este error indica que las políticas RLS no están configuradas correctamente. Asegúrate de:

1. ✅ El bucket `circuito3gen-inscripciones` existe
2. ✅ Las políticas SQL se ejecutaron correctamente
3. ✅ El usuario está autenticado (tiene una sesión activa)
4. ✅ El bucket no está configurado como público (debe ser privado con políticas RLS)

### Error: "Bucket not found"

El bucket no existe. Sigue el paso 1 para crearlo.

### Error: "Unauthorized"

Las políticas RLS no están configuradas o el usuario no está autenticado. Verifica:
- Que las políticas se ejecutaron correctamente
- Que el usuario tiene una sesión activa
- Que el token de autenticación es válido

## Notas Importantes

- El bucket debe ser **privado** (no público) para mayor seguridad
- Las políticas permiten a cualquier usuario autenticado subir archivos al bucket
- Los archivos se almacenan en la carpeta `comprobantes/` dentro del bucket
- Los nombres de archivo incluyen un timestamp para evitar colisiones

