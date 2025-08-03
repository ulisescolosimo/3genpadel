# Sistema de Jugadores Ranking

## Descripción

Este sistema permite gestionar jugadores de ranking que pueden o no estar registrados en la web. Es ideal para manejar datos de Excel donde tienes puntos de muchos usuarios, algunos registrados y otros no.

## Características Principales

### 🎯 Funcionalidades Implementadas

#### 1. Panel de Administración (`/admin/jugadores-ranking`)
- **Gestión completa**: Crear, editar, eliminar jugadores de ranking
- **Importación masiva**: Importar datos desde Excel con formato simple
- **Exportación**: Exportar datos a CSV
- **Vinculación de usuarios**: Vincular jugadores con usuarios registrados
- **Filtros avanzados**: Por categoría, estado de vinculación, búsqueda
- **Estadísticas**: Total jugadores, vinculados, sin vincular, con puntos

#### 2. API de Importación (`/api/import-jugadores-ranking`)
- **POST**: Importar jugadores masivamente
- **DELETE**: Eliminar todos los jugadores de una categoría
- **Validación**: Verificación de datos y estructura
- **Prevención de duplicados**: Evita importar categorías existentes

#### 3. Integración con Ranking Público (`/ranking`)
- **Combinación automática**: Muestra jugadores registrados + jugadores ranking
- **Ordenamiento por puntos**: Ranking unificado
- **Indicadores visuales**: Badges para distinguir tipos de jugadores
- **Estadísticas**: Partidos jugados, win rate, etc.

## Estructura de Base de Datos

### Nueva Tabla: `jugadores_ranking`

```sql
CREATE TABLE public.jugadores_ranking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  puntos integer DEFAULT 0,
  categoria text,
  usuario_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT jugadores_ranking_pkey PRIMARY KEY (id),
  CONSTRAINT jugadores_ranking_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);
```

### Campos Principales
- `nombre`, `apellido`: Nombre completo del jugador
- `puntos`: Puntos de ranking
- `categoria`: Categoría del jugador (ej: "8VA", "7MA")
- `usuario_id`: ID del usuario registrado (NULL si no está registrado)

## Cómo Usar el Sistema

### 1. Acceder al Panel de Administración

1. Ve a `/admin/jugadores-ranking`
2. Inicia sesión como administrador
3. Verás el panel completo de gestión

### 2. Importar Datos desde Excel

#### Formato Esperado
```
Re 17
Moreno 17
Barbieri 17
Epstein 17
Ostapechuk 14
```

#### Pasos para Importar
1. Copia los datos de tu Excel
2. Ve al panel de administración
3. Haz clic en "Importar"
4. Selecciona la categoría (ej: "8VA")
5. Pega los datos en el campo de texto
6. Haz clic en "Importar"

### 3. Vincular con Usuarios Registrados

1. En la tabla de jugadores, busca los que no están vinculados
2. Haz clic en el ícono de enlace (🔗)
3. Selecciona el usuario correspondiente
4. El jugador quedará vinculado

### 4. Ver el Ranking Público

1. Ve a `/ranking`
2. Verás todos los jugadores combinados
3. Los jugadores de ranking aparecen con badges especiales

## Ejemplo de Uso

### Datos de Ejemplo (Categoría 8VA)

```javascript
// Script para insertar datos de ejemplo
const datos8VA = [
  { nombre: "Re", apellido: "Re", puntos: 17 },
  { nombre: "Moreno", apellido: "Moreno", puntos: 17 },
  { nombre: "Barbieri", apellido: "Barbieri", puntos: 17 },
  // ... más jugadores
]

// Ejecutar en la consola del navegador
fetch('/api/import-jugadores-ranking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jugadores: datos8VA,
    categoria: '8VA'
  })
})
```

## Funcionalidades Avanzadas

### Filtros Disponibles
- **Por categoría**: Filtrar jugadores por categoría específica
- **Vinculados/Sin vincular**: Ver solo jugadores vinculados o no
- **Búsqueda**: Buscar por nombre o apellido

### Estadísticas en Tiempo Real
- **Total jugadores**: Número total de jugadores
- **Vinculados**: Jugadores con usuario registrado
- **Sin vincular**: Jugadores sin usuario registrado
- **Con puntos**: Jugadores que tienen puntos > 0

### Exportación de Datos
- **Formato CSV**: Exporta todos los datos a CSV
- **Incluye vínculos**: Muestra si están vinculados y con quién
- **Ordenado por puntos**: Datos ordenados de mayor a menor

## Ventajas del Sistema

### ✅ Beneficios
1. **Flexibilidad**: Maneja jugadores registrados y no registrados
2. **Escalabilidad**: Fácil importación masiva desde Excel
3. **Integración**: Se integra perfectamente con el ranking existente
4. **Gestión visual**: Interfaz intuitiva para administradores
5. **Vinculación dinámica**: Puedes vincular jugadores cuando se registren

### 🔄 Flujo de Trabajo
1. **Importar datos** desde Excel
2. **Revisar y editar** jugadores individualmente
3. **Vincular** con usuarios cuando se registren
4. **Ver resultados** en el ranking público
5. **Exportar** datos actualizados

## Notas Técnicas

### Caché del Ranking
- El ranking público tiene caché de 5 minutos
- Se actualiza automáticamente al importar datos
- Optimizado para rendimiento

### Validaciones
- Verificación de formato de datos
- Prevención de duplicados por categoría
- Validación de puntos (números positivos)

### Seguridad
- Solo administradores pueden acceder al panel
- Validación de permisos en todas las operaciones
- Sanitización de datos de entrada

## Próximas Mejoras

### 🚀 Funcionalidades Futuras
1. **Importación directa de Excel**: Subir archivos .xlsx
2. **Sincronización automática**: Conectar con sistemas externos
3. **Historial de cambios**: Trackear modificaciones
4. **Notificaciones**: Alertas cuando se registren jugadores vinculados
5. **API pública**: Endpoints para integraciones externas

---

## Soporte

Para dudas o problemas:
1. Revisa la consola del navegador para errores
2. Verifica que los datos tengan el formato correcto
3. Asegúrate de tener permisos de administrador
4. Contacta al equipo de desarrollo si persisten los problemas 