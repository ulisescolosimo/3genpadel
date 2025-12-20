-- =====================================================
-- Agregar campos de promedio global a la tabla usuarios
-- =====================================================

-- Agregar columnas para promedio global del jugador
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS promedio_global NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS partidos_totales_jugados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS partidos_totales_ganados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS promedio_actualizado_at TIMESTAMPTZ;

-- Comentarios
COMMENT ON COLUMN usuarios.promedio_global IS 'Promedio global del jugador calculado a partir de todos sus partidos en todas las divisiones y etapas. Se guarda como decimal (0-1), igual que promedio_final en circuitooka_rankings. Para mostrarlo como porcentaje, multiplicar por 100.';
COMMENT ON COLUMN usuarios.partidos_totales_jugados IS 'Total de partidos jugados por el jugador en todo el circuito';
COMMENT ON COLUMN usuarios.partidos_totales_ganados IS 'Total de partidos ganados por el jugador en todo el circuito';
COMMENT ON COLUMN usuarios.promedio_actualizado_at IS 'Fecha y hora de la última actualización del promedio global';

-- Índice para búsquedas por promedio
CREATE INDEX IF NOT EXISTS idx_usuarios_promedio_global ON usuarios(promedio_global DESC);

