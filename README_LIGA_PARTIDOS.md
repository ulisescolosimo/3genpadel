# Implementación de Sistema de Partidos para Ligas

## 📋 Resumen

Se ha implementado un sistema completo para gestionar partidos dentro de las ligas de pádel, incluyendo:

- **Tabla `liga_partidos`** para almacenar los partidos
- **Páginas de administración** para gestionar partidos
- **Visualización de brackets** para torneos
- **Sistema automático de puntos** para jugadores

## 🗄️ Base de Datos

### Tabla `liga_partidos`

```sql
CREATE TABLE public.liga_partidos (
  id SERIAL PRIMARY KEY,
  liga_categoria_id INTEGER NOT NULL REFERENCES public.liga_categorias(id) ON DELETE CASCADE,
  ronda VARCHAR NOT NULL, -- Ej: "Octavos", "Cuartos", "Semis", "Final"
  equipo_a_id INTEGER NOT NULL REFERENCES public.ligainscripciones(id) ON DELETE CASCADE,
  equipo_b_id INTEGER NOT NULL REFERENCES public.ligainscripciones(id) ON DELETE CASCADE,
  equipo_ganador_id INTEGER REFERENCES public.ligainscripciones(id) ON DELETE SET NULL,
  puntos_por_jugador INTEGER DEFAULT 3 CHECK (puntos_por_jugador >= 0),
  fecha TIMESTAMP,
  estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Características principales:

- **Relaciones**: Conecta con `liga_categorias` e `ligainscripciones`
- **Rondas**: Permite definir la estructura del torneo (Octavos, Cuartos, Semis, Final)
- **Puntos automáticos**: Sistema que suma puntos a los jugadores del equipo ganador
- **Estados**: Control del progreso del partido (pendiente, jugado, cancelado)

## 🚀 Instalación

### 1. Ejecutar el script SQL

```bash
# Ejecutar el archivo SQL en tu base de datos Supabase
psql -h [tu-host] -U [tu-usuario] -d [tu-db] -f liga_partidos_table.sql
```

### 2. Verificar la implementación

```bash
# Verificar que la tabla se creó correctamente
\dt liga_partidos

# Verificar los triggers
\dg
```

## 📁 Archivos Creados

### Páginas de Administración

1. **`app/admin/ligas/page.jsx`** - Dashboard principal de gestión de ligas
2. **`app/admin/ligas/partidos/page.jsx`** - Gestión de partidos
3. **`app/admin/ligas/brackets/page.jsx`** - Visualización de brackets
4. **`app/admin/ligas/categorias/page.jsx`** - Gestión de categorías (ya existía)

### Componentes Actualizados

1. **`components/AdminHeader.jsx`** - Agregados enlaces a las nuevas páginas

### Archivos SQL

1. **`liga_partidos_table.sql`** - Script completo de la tabla

## 🎯 Funcionalidades Implementadas

### 1. Gestión de Partidos (`/admin/ligas/partidos`)

- ✅ Crear nuevos partidos
- ✅ Editar partidos existentes
- ✅ Eliminar partidos
- ✅ Asignar ganadores
- ✅ Definir puntos por partido
- ✅ Programar fechas
- ✅ Filtros por categoría y estado

### 2. Visualización de Brackets (`/admin/ligas/brackets`)

- ✅ Vista organizada por rondas
- ✅ Identificación visual de ganadores
- ✅ Estadísticas del torneo
- ✅ Filtros por categoría

### 3. Dashboard de Ligas (`/admin/ligas`)

- ✅ Estadísticas generales
- ✅ Enlaces rápidos a funcionalidades
- ✅ Lista de ligas activas
- ✅ Partidos recientes

### 4. Sistema Automático de Puntos

- ✅ Trigger que suma puntos automáticamente
- ✅ Actualización de `ranking_puntos` en tabla `usuarios`
- ✅ Solo se ejecuta cuando se define un ganador

## 🔧 Configuración

### Variables de Entorno

No se requieren nuevas variables de entorno.

### Permisos de Base de Datos

Asegúrate de que tu usuario de Supabase tenga permisos para:

- Crear tablas
- Crear triggers
- Crear funciones
- Ejecutar UPDATE en la tabla `usuarios`

## 📊 Uso del Sistema

### 1. Crear un Partido

1. Ir a `/admin/ligas/partidos`
2. Hacer clic en "Nuevo Partido"
3. Seleccionar categoría
4. Elegir ronda (Octavos, Cuartos, etc.)
5. Seleccionar equipos A y B
6. Definir puntos por jugador
7. Programar fecha (opcional)
8. Guardar

### 2. Cargar Resultado

1. Editar el partido creado
2. Cambiar estado a "jugado"
3. Seleccionar equipo ganador
4. Guardar (los puntos se suman automáticamente)

### 3. Ver Brackets

1. Ir a `/admin/ligas/brackets`
2. Seleccionar categoría
3. Ver estructura del torneo por rondas

## 🔄 Flujo de Trabajo Típico

1. **Crear Liga** → `/admin/ligas/categorias`
2. **Aprobar Inscripciones** → `/admin/inscripciones-ligas`
3. **Crear Partidos** → `/admin/ligas/partidos`
4. **Cargar Resultados** → `/admin/ligas/partidos`
5. **Ver Progreso** → `/admin/ligas/brackets`

## 🎨 Características de la UI

- **Diseño responsivo** para móviles y desktop
- **Filtros avanzados** por categoría, estado y búsqueda
- **Badges visuales** para estados y rondas
- **Cards interactivas** con hover effects
- **Modales** para formularios
- **Iconografía** consistente con Lucide React

## 🔍 Consultas Útiles

### Obtener partidos de una categoría

```sql
SELECT * FROM liga_partidos 
WHERE liga_categoria_id = [ID_CATEGORIA]
ORDER BY ronda, created_at;
```

### Obtener puntos de un jugador

```sql
SELECT ranking_puntos FROM usuarios 
WHERE id = [ID_JUGADOR];
```

### Estadísticas de partidos

```sql
SELECT 
  estado,
  COUNT(*) as total
FROM liga_partidos 
GROUP BY estado;
```

## 🚨 Consideraciones Importantes

### Seguridad

- Los triggers se ejecutan automáticamente
- Validaciones en la base de datos (CHECK constraints)
- Relaciones con CASCADE para mantener integridad

### Rendimiento

- Índices creados para optimizar consultas
- Triggers optimizados para evitar loops
- Paginación en listas grandes

### Mantenimiento

- Backup antes de ejecutar el script SQL
- Probar en ambiente de desarrollo primero
- Monitorear el rendimiento de los triggers

## 🐛 Solución de Problemas

### Error: "Trigger no se ejecuta"

- Verificar que la función `sumar_puntos_equipo_ganador()` existe
- Confirmar que el trigger está activo
- Revisar logs de Supabase

### Error: "No se pueden crear partidos"

- Verificar que existen inscripciones aprobadas
- Confirmar que la categoría existe
- Revisar permisos de usuario

### Error: "Puntos no se suman"

- Verificar que `equipo_ganador_id` no es NULL
- Confirmar que el estado es 'jugado'
- Revisar que los jugadores existen en la tabla `usuarios`

## 📈 Próximas Mejoras Sugeridas

1. **Notificaciones** automáticas a jugadores
2. **Reportes** de estadísticas avanzadas
3. **API endpoints** para frontend público
4. **Sistema de empates** para partidos
5. **Historial** de cambios en partidos
6. **Exportación** de brackets a PDF
7. **Integración** con calendario externo

## 📞 Soporte

Para dudas o problemas:

1. Revisar logs de Supabase
2. Verificar permisos de usuario
3. Confirmar que todos los archivos están en su lugar
4. Probar en ambiente de desarrollo

---

**¡El sistema está listo para usar! 🎉** 