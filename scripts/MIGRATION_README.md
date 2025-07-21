# Migración: Consolidación de Tablas jugador y usuarios

## Descripción

Esta migración consolida las tablas `jugador` y `usuarios` en una sola tabla `usuarios`, eliminando la redundancia de datos y simplificando la estructura de la base de datos.

## Problema Actual

Actualmente tienes dos tablas que almacenan información de usuarios:

1. **`usuarios`**: Perfil principal del usuario (auth, rol, etc.)
2. **`jugador`**: Información específica del jugador (ranking, DNI, etc.)

Esto crea:
- Duplicación de datos
- Complejidad en las consultas
- Riesgo de inconsistencias
- Mantenimiento innecesario

## Solución

Consolidar todo en la tabla `usuarios` agregando los campos faltantes:
- `ranking_puntos`
- `cuenta_activada`
- `dni`
- `foto`
- `password`

## Pasos de Migración

### 1. Backup (IMPORTANTE)

Antes de ejecutar la migración, haz un backup completo de tu base de datos:

```bash
# En Supabase Dashboard > Settings > Database > Backups
# O usando la CLI de Supabase
supabase db dump --data-only > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar Estado Actual

```bash
node scripts/run-migration.js check
```

### 3. Ejecutar Migración

**Opción A: Usando el script automatizado**
```bash
node scripts/run-migration.js migrate
```

**Opción B: Manual (recomendado para producción)**
1. Ve al SQL Editor de Supabase
2. Copia el contenido de `scripts/migrate-consolidate-tables.sql`
3. Ejecuta el script paso a paso

### 4. Verificar Migración

```bash
node scripts/run-migration.js check
```

## Cambios en la Base de Datos

### Antes
```
usuarios (id, email, nombre, apellido, rol, jugador_id)
jugador (id, email, nombre, apellido, dni, ranking_puntos, auth_id)
ligainscripciones (titular_1_id -> jugador.id, titular_2_id -> jugador.id, ...)
```

### Después
```
usuarios (id, email, nombre, apellido, rol, dni, ranking_puntos, cuenta_activada, ...)
ligainscripciones (titular_1_id -> usuarios.id, titular_2_id -> usuarios.id, ...)
```

## Actualización del Código

Después de la migración, necesitas actualizar el código para usar solo la tabla `usuarios`:

### 1. Cambiar todas las referencias de `jugador` a `usuarios`

```javascript
// Antes
const { data } = await supabase
  .from('jugador')
  .select('*')
  .eq('email', user.email)

// Después
const { data } = await supabase
  .from('usuarios')
  .select('*')
  .eq('email', user.email)
```

### 2. Actualizar joins en ligainscripciones

```javascript
// Antes
.select(`
  titular_1:jugador!ligainscripciones_titular_1_id_fkey (
    id, nombre, apellido, email
  )
`)

// Después
.select(`
  titular_1:usuarios!ligainscripciones_titular_1_id_fkey (
    id, nombre, apellido, email
  )
`)
```

### 3. Actualizar campos específicos

```javascript
// Antes
jugador.ranking_puntos
jugador.dni
jugador.cuenta_activada

// Después
usuario.ranking_puntos
usuario.dni
usuario.cuenta_activada
```

## Archivos que Necesitan Actualización

1. `app/perfil/page.jsx`
2. `app/inscripciones/ligas/[id]/page.jsx`
3. `app/admin/inscripciones-ligas/page.jsx`
4. `app/admin/inscripciones-ligas/detalle/[id]/page.jsx`
5. `app/admin/inscripciones-ligas/categorias/page.jsx`
6. `app/admin/inscripciones-ligas/categoria/[id]/page.jsx`
7. `app/admin/dashboard/page.jsx`
8. `app/admin/activaciones-cuentas/page.jsx`
9. `app/auth/callback/page.jsx`
10. `app/api/activar-cuenta/route.js`
11. `app/api/check-users/route.js`
12. `app/activar-cuenta/page.jsx`

## Rollback

Si necesitas revertir la migración:

1. Restaurar el backup de la base de datos
2. Revertir los cambios en el código
3. Ejecutar las consultas de rollback (si las tienes)

## Verificación Post-Migración

1. Verificar que todos los usuarios tienen sus datos completos
2. Verificar que las inscripciones a ligas funcionan correctamente
3. Verificar que el panel de administración funciona
4. Verificar que el perfil de usuario funciona
5. Verificar que la activación de cuentas funciona

## Beneficios de la Consolidación

1. **Simplicidad**: Una sola tabla para toda la información del usuario
2. **Consistencia**: No hay riesgo de datos desincronizados
3. **Mantenimiento**: Menos código para mantener
4. **Performance**: Menos joins en las consultas
5. **Claridad**: Estructura más clara y fácil de entender

## Notas Importantes

- La migración es **irreversible** sin backup
- Ejecuta en un entorno de desarrollo primero
- Prueba todas las funcionalidades después de la migración
- Actualiza el código inmediatamente después de la migración
- Considera hacer la migración en horario de bajo tráfico

## Soporte

Si encuentras problemas durante la migración:

1. Verifica que tienes un backup válido
2. Revisa los logs de error
3. Ejecuta las consultas paso a paso en el SQL Editor
4. Contacta al equipo de desarrollo si es necesario 