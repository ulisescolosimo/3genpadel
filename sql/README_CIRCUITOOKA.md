# 🎾 Circuitooka - Scripts de Base de Datos

Este directorio contiene los scripts SQL para crear el esquema de base de datos del sistema Circuitooka 3GEN 2026.

## 📋 Archivos

1. **`circuitooka_schema.sql`** - Esquema completo de base de datos
   - Todas las tablas (1.1.1 a 1.1.11)
   - Índices
   - Funciones básicas (1.2.1 a 1.2.5)
   - Triggers para updated_at

2. **`circuitooka_rls_policies.sql`** - Políticas de seguridad (RLS)
   - Row Level Security habilitado en todas las tablas
   - Políticas para usuarios y administradores (1.3.1 a 1.3.4)
   - **Incluye políticas públicas para rankings**: Permite acceso público a inscripciones activas y partidos jugados para que los rankings sean visibles sin autenticación

3. **`circuitooka_initial_data.sql`** - Datos iniciales
   - Divisiones base (1.4.1)
   - Primera etapa de prueba (1.4.2)
   - Configuración por defecto (1.4.3)

4. **`circuitooka_add_promedio_global.sql`** - Agrega campos de promedio global a usuarios
   - Agrega `promedio_global`, `partidos_totales_jugados`, `partidos_totales_ganados` a la tabla `usuarios`
   - El promedio global se calcula a partir de TODOS los partidos del jugador en todas las divisiones

5. **`circuitooka_add_division_config.sql`** - Agrega soporte para configuración por división
   - Permite tener configuración específica por división además de la configuración general por etapa
   - La configuración por división tiene prioridad sobre la configuración general
   - Útil para personalizar cupos de ascenso/descenso y playoffs por división

6. **`circuitooka_rankings_publicos.sql`** - Políticas adicionales para rankings públicos (OPCIONAL)
   - Si ya ejecutaste `circuitooka_rls_policies.sql` antes de la actualización, ejecuta este script para agregar las políticas públicas
   - Si ejecutaste `circuitooka_rls_policies.sql` después de la actualización, este script no es necesario

## 🚀 Instrucciones de Ejecución

### Opción 1: Usando Supabase CLI

Si tienes Supabase CLI configurado:

```bash
# Ejecutar el esquema
psql -h [tu-host] -U postgres -d postgres -f sql/circuitooka_schema.sql

# Ejecutar las políticas RLS
psql -h [tu-host] -U postgres -d postgres -f sql/circuitooka_rls_policies.sql

# Ejecutar los datos iniciales
psql -h [tu-host] -U postgres -d postgres -f sql/circuitooka_initial_data.sql
```

### Opción 2: Desde el Dashboard de Supabase

1. Ve al Dashboard de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido de cada archivo en orden:
   - Primero: `circuitooka_schema.sql`
   - Segundo: `circuitooka_rls_policies.sql`
   - Tercero: `circuitooka_initial_data.sql`
4. Ejecuta cada script

### Opción 3: Usando el cliente SQL de tu preferencia

Puedes ejecutar los scripts usando cualquier cliente SQL que se conecte a tu base de datos PostgreSQL/Supabase.

## ⚠️ Orden de Ejecución

**IMPORTANTE**: Ejecuta los scripts en este orden:

1. ✅ `circuitooka_schema.sql` (primero)
2. ✅ `circuitooka_rls_policies.sql` (segundo - **ya incluye políticas públicas para rankings**)
3. ✅ `circuitooka_initial_data.sql` (tercero)
4. ✅ `circuitooka_add_promedio_global.sql` (cuarto - opcional pero recomendado)
5. ✅ `circuitooka_add_division_config.sql` (quinto - opcional, permite configuración por división)
6. ✅ `circuitooka_rankings_publicos.sql` (solo si ejecutaste `circuitooka_rls_policies.sql` antes de la actualización)

## 📝 Notas

- Las funciones de cálculo de promedios (`calcular_promedio_jugador`, `obtener_posicion_ranking`) están creadas como esqueletos y serán completadas en la Fase 2.
- Las políticas RLS asumen que existe una tabla `usuarios` con un campo `rol` que puede ser 'admin' o 'user'.
- La función `es_admin()` usa `auth.uid()` de Supabase para obtener el usuario autenticado actual.

## 🔍 Verificación

Después de ejecutar los scripts, puedes verificar que todo se creó correctamente:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'circuitooka_%'
ORDER BY table_name;

-- Verificar divisiones
SELECT * FROM circuitooka_divisiones;

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'circuitooka_%';
```

## 🐛 Solución de Problemas

### Error: "relation usuarios does not exist"
- Asegúrate de que la tabla `usuarios` existe en tu base de datos antes de ejecutar los scripts.

### Error: "function auth.uid() does not exist"
- Esto es normal si no estás usando Supabase. Necesitarás ajustar las políticas RLS para usar tu sistema de autenticación.

### Error: "duplicate key value violates unique constraint"
- Algunos datos iniciales pueden ya existir. Los scripts usan `ON CONFLICT DO NOTHING` para evitar errores, pero si persiste, revisa los datos existentes.

## 📚 Próximos Pasos

Después de ejecutar estos scripts, continúa con:
- **Fase 2**: Backend y Lógica de Negocio
- Completar las funciones de cálculo de promedios
- Implementar las APIs REST

