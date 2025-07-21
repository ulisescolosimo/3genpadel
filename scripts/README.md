# Scripts de Administración

## Migración de Consolidación de Tablas

### Descripción
Scripts para consolidar las tablas `jugador` y `usuarios` en una sola tabla `usuarios`, eliminando la redundancia de datos.

### Archivos de Migración
- `migrate-consolidate-tables.sql` - Script SQL para la migración de la base de datos
- `run-migration.js` - Script automatizado para ejecutar la migración
- `update-code-after-migration.js` - Script para actualizar el código después de la migración
- `MIGRATION_README.md` - Documentación completa de la migración

### Uso
```bash
# 1. Verificar estado actual
node scripts/run-migration.js check

# 2. Ejecutar migración (después de hacer backup)
node scripts/run-migration.js migrate

# 3. Actualizar código
node scripts/update-code-after-migration.js update
```

**⚠️ IMPORTANTE**: Lee `MIGRATION_README.md` antes de ejecutar la migración.

---

## Crear Administrador

El script `create-admin.js` te permite crear fácilmente una cuenta de administrador para el panel de administración.

### Requisitos Previos

1. **Variables de entorno configuradas**:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase (no la anon key)

2. **Obtener la Service Role Key**:
   - Ve al panel de Supabase
   - Settings > API
   - Copia la "service_role" key (no la "anon" key)

### Uso del Script

```bash
node scripts/create-admin.js <email> <password> <nombre>
```

#### Ejemplo:
```bash
node scripts/create-admin.js admin@ejemplo.com "MiContraseña123" "Juan Pérez"
```

### Validaciones

El script incluye las siguientes validaciones:
- La contraseña debe tener al menos 6 caracteres
- El email debe ser válido
- Verifica si ya existe un administrador con ese email

### Proceso del Script

1. **Crea el usuario en Supabase Auth** con email y contraseña
2. **Confirma automáticamente el email** (no requiere verificación manual)
3. **Inserta un registro en la tabla `usuarios`** con rol 'admin'
4. **Muestra la información del administrador creado**

### Acceso al Panel

Una vez creado el administrador, puedes acceder al panel en:
```
http://tu-dominio.com/admin/login
```

### Solución de Problemas

#### Error: "Faltan las variables de entorno"
- Asegúrate de tener configuradas las variables de entorno
- Verifica que estés usando la Service Role Key, no la Anon Key

#### Error: "Ya existe un administrador"
- El script verifica si ya existe un admin con ese email
- Si existe, cancela la operación para evitar duplicados

#### Error: "La contraseña debe tener al menos 6 caracteres"
- Supabase requiere contraseñas de mínimo 6 caracteres
- Usa una contraseña más larga y segura

### Seguridad

- **Nunca compartas la Service Role Key**
- **Usa contraseñas fuertes** (mínimo 8 caracteres, mayúsculas, minúsculas, números)
- **Cambia la contraseña regularmente**
- **Usa emails únicos** para cada administrador

### Estructura de la Base de Datos

El script crea registros en:

1. **Supabase Auth**: Tabla de usuarios autenticados
2. **Tabla `usuarios`**: Perfil del usuario con rol 'admin'

```sql
-- Estructura esperada de la tabla usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  nombre TEXT,
  rol TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
``` 