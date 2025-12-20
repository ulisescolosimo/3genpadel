-- =====================================================
-- MIGRACIÓN: Agregar soporte para configuración por división
-- =====================================================
-- Este script agrega la capacidad de tener configuración específica por división
-- Mantiene compatibilidad con configuración por etapa como fallback

-- 1. Agregar columna division_id (nullable) a circuitooka_configuracion
ALTER TABLE circuitooka_configuracion
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES circuitooka_divisiones(id) ON DELETE CASCADE;

-- 2. Eliminar la restricción UNIQUE(etapa_id) y crear una nueva que permita múltiples configuraciones
-- Primero eliminamos la restricción existente
ALTER TABLE circuitooka_configuracion
DROP CONSTRAINT IF EXISTS circuitooka_configuracion_etapa_id_key;

-- 3. Crear nueva restricción única: etapa_id + division_id (permitiendo NULL en division_id)
-- Esto permite:
-- - Una configuración general por etapa (division_id = NULL)
-- - Configuraciones específicas por división (division_id != NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_etapa_division 
ON circuitooka_configuracion(etapa_id, COALESCE(division_id, '00000000-0000-0000-0000-000000000000'::UUID));

-- 4. Agregar índice para búsquedas por división
CREATE INDEX IF NOT EXISTS idx_configuracion_division ON circuitooka_configuracion(division_id);

-- 5. Comentarios actualizados
COMMENT ON COLUMN circuitooka_configuracion.division_id IS 'ID de la división para configuración específica. NULL = configuración general de la etapa';
COMMENT ON TABLE circuitooka_configuracion IS 'Configuración del circuito. Puede ser por etapa (division_id NULL) o específica por división';

-- 6. Actualizar función calcular_cupos_ascenso_descenso para buscar primero configuración por división
CREATE OR REPLACE FUNCTION calcular_cupos_ascenso_descenso(
    p_etapa_id UUID,
    p_division_id UUID
)
RETURNS TABLE(
    cupos_ascenso INTEGER,
    cupos_descenso INTEGER
) AS $$
DECLARE
    v_jugadores_inscriptos INTEGER;
    v_porcentaje INTEGER;
    v_minimo INTEGER;
    v_maximo INTEGER;
    v_cupos_calculados NUMERIC;
    v_cupos_finales INTEGER;
BEGIN
    -- Primero intentar obtener configuración específica de la división
    SELECT 
        cupos_ascenso_porcentaje,
        cupos_ascenso_minimo,
        cupos_ascenso_maximo
    INTO v_porcentaje, v_minimo, v_maximo
    FROM circuitooka_configuracion
    WHERE etapa_id = p_etapa_id
      AND division_id = p_division_id;
    
    -- Si no hay configuración específica por división, buscar configuración general de la etapa
    IF v_porcentaje IS NULL THEN
        SELECT 
            cupos_ascenso_porcentaje,
            cupos_ascenso_minimo,
            cupos_ascenso_maximo
        INTO v_porcentaje, v_minimo, v_maximo
        FROM circuitooka_configuracion
        WHERE etapa_id = p_etapa_id
          AND division_id IS NULL;
    END IF;
    
    -- Si no hay configuración, usar valores por defecto
    v_porcentaje := COALESCE(v_porcentaje, 20);
    v_minimo := COALESCE(v_minimo, 2);
    v_maximo := COALESCE(v_maximo, 10);
    
    -- Contar jugadores inscriptos en la división
    SELECT COUNT(*) INTO v_jugadores_inscriptos
    FROM circuitooka_inscripciones
    WHERE etapa_id = p_etapa_id
      AND division_id = p_division_id
      AND estado = 'activa';
    
    -- Calcular cupos: porcentaje de jugadores inscriptos (min 2, max 10)
    v_cupos_calculados := (v_jugadores_inscriptos::NUMERIC * v_porcentaje) / 100;
    v_cupos_finales := GREATEST(v_minimo, LEAST(v_maximo, ROUND(v_cupos_calculados)::INTEGER));
    
    RETURN QUERY SELECT v_cupos_finales, v_cupos_finales;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

