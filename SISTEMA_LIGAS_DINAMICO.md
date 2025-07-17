# Sistema de Ligas Dinámico

## Descripción

El sistema de ligas ha sido completamente refactorizado para ser dinámico y basado en la base de datos. Ahora puedes crear múltiples ligas con diferentes categorías y configuraciones sin necesidad de modificar el código.

## Estructura de la Base de Datos

### Tablas Principales

1. **`ligas`** - Información general de cada liga
   - `id` - Identificador único
   - `nombre` - Nombre de la liga
   - `fecha_inicio` - Fecha de inicio
   - `estado` - 'abierta' o 'cerrada'
   - `descripcion` - Descripción de la liga
   - `formato` - Formato de juego
   - `horarios` - Horarios disponibles
   - `costo_inscripcion` - Costo de inscripción por equipo
   - `costo_partido` - Costo por partido por jugador
   - `cronograma` - Cronograma detallado
   - `importante` - Información importante

2. **`liga_categorias`** - Categorías disponibles por liga
   - `id` - Identificador único
   - `liga_id` - Referencia a la liga
   - `categoria` - Categoría (C1-C8)
   - `max_inscripciones` - Máximo de inscripciones permitidas

3. **`ligainscripciones`** - Inscripciones de equipos
   - `id` - Identificador único
   - `liga_categoria_id` - Referencia a la categoría
   - `titular_1_nombre`, `titular_1_apellido` - Primer titular
   - `titular_2_nombre`, `titular_2_apellido` - Segundo titular
   - `suplente_1_nombre`, `suplente_1_apellido` - Primer suplente
   - `suplente_2_nombre`, `suplente_2_apellido` - Segundo suplente
   - `contacto_celular` - Teléfono de contacto
   - `comprobante_url` - URL del comprobante de pago
   - `comprobante_filename` - Nombre del archivo
   - `aclaraciones` - Aclaraciones adicionales
   - `estado` - 'pendiente', 'aprobada', 'rechazada'

## Funcionalidades

### 1. Listado Dinámico de Ligas (`/inscripciones/ligas`)

- Muestra todas las ligas disponibles desde la base de datos
- Filtros por período (Agosto, Septiembre, etc.)
- Estado de cada liga (Abierta, Cerrada, Completa)
- Contador de inscripciones actuales vs máximo permitido
- Información detallada de cada liga

### 2. Inscripción Dinámica (`/inscripciones/ligas/[id]`)

- Formulario adaptativo basado en la liga seleccionada
- Categorías disponibles dinámicamente
- Validación de cupos en tiempo real
- Información específica de cada liga
- Manejo de archivos para comprobantes

### 3. Control de Cupos

El sistema incluye un trigger que previene exceder el máximo de inscripciones por categoría:

```sql
CREATE OR REPLACE FUNCTION validar_max_inscripciones_configurable()
RETURNS TRIGGER AS $$
DECLARE
  limite INTEGER;
BEGIN
  SELECT max_inscripciones INTO limite
  FROM liga_categorias
  WHERE id = NEW.liga_categoria_id;

  IF (
    SELECT COUNT(*) 
    FROM ligainscripciones 
    WHERE liga_categoria_id = NEW.liga_categoria_id
  ) >= limite THEN
    RAISE EXCEPTION 'Se alcanzó el máximo de % inscripciones para esta categoría de liga.', limite;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Cómo Usar

### 1. Crear una Nueva Liga

1. Insertar en la tabla `ligas`:
```sql
INSERT INTO ligas (nombre, fecha_inicio, estado, descripcion, formato, horarios, costo_inscripcion, costo_partido, cronograma, importante) 
VALUES ('Mi Nueva Liga', '2025-12-01', 'abierta', 'Descripción...', 'Formato...', 'Horarios...', 20000, 12000, 'Cronograma...', 'Importante...');
```

2. Crear categorías para la liga:
```sql
INSERT INTO liga_categorias (liga_id, categoria, max_inscripciones) 
VALUES 
  (LASTVAL(), 'C6', 16),
  (LASTVAL(), 'C7', 16),
  (LASTVAL(), 'C8', 16);
```

### 2. Gestionar Inscripciones

- Las inscripciones se crean automáticamente desde el formulario web
- El estado se puede cambiar manualmente en la base de datos
- Los archivos se almacenan en Supabase Storage

### 3. Monitorear Cupos

```sql
-- Ver inscripciones por categoría
SELECT 
  lc.categoria,
  COUNT(li.id) as inscripciones_actuales,
  lc.max_inscripciones,
  lc.max_inscripciones - COUNT(li.id) as cupos_disponibles
FROM liga_categorias lc
LEFT JOIN ligainscripciones li ON lc.id = li.liga_categoria_id
WHERE lc.liga_id = 1
GROUP BY lc.id, lc.categoria, lc.max_inscripciones;
```

## Ventajas del Sistema Dinámico

1. **Escalabilidad**: Puedes crear tantas ligas como necesites
2. **Flexibilidad**: Cada liga puede tener diferentes configuraciones
3. **Mantenimiento**: No requiere cambios de código para nuevas ligas
4. **Control**: Gestión completa de cupos y estados
5. **Automatización**: Validaciones automáticas de límites

## Archivos Modificados

- `app/inscripciones/ligas/page.jsx` - Listado dinámico de ligas
- `app/inscripciones/ligas/[id]/page.jsx` - Formulario de inscripción dinámico
- `sample_data.sql` - Datos de ejemplo para pruebas

## Próximos Pasos

1. Ejecutar `sample_data.sql` para insertar datos de prueba
2. Probar el sistema con las ligas de ejemplo
3. Crear nuevas ligas según sea necesario
4. Configurar el panel de administración para gestionar ligas 