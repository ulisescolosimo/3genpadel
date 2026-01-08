-- =====================================================
-- CIRCUITOOKA 3GEN 2026 - ESQUEMA DE BASE DE DATOS
-- Fase 1: Base de Datos
-- =====================================================

-- =====================================================
-- 1.1 TABLAS PRINCIPALES
-- =====================================================

-- 1.1.1 Tabla: circuitooka_etapas
CREATE TABLE IF NOT EXISTS circuitooka_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    año INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_etapas IS 'Etapas del circuito Circuitooka (ej: Febrero-Abril 2026)';
COMMENT ON COLUMN circuitooka_etapas.estado IS 'Estado de la etapa: activa o finalizada';

-- 1.1.2 Tabla: circuitooka_divisiones
CREATE TABLE IF NOT EXISTS circuitooka_divisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_division INTEGER NOT NULL UNIQUE CHECK (numero_division BETWEEN 1 AND 4),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_divisiones IS 'Divisiones del circuito (1-4)';
COMMENT ON COLUMN circuitooka_divisiones.numero_division IS 'Número de división (1-4)';

-- 1.1.3 Tabla: circuitooka_inscripciones
CREATE TABLE IF NOT EXISTS circuitooka_inscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    division_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'finalizada')),
    division_solicitada UUID REFERENCES circuitooka_divisiones(id),
    evaluacion_organizador BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(etapa_id, usuario_id)
);

COMMENT ON TABLE circuitooka_inscripciones IS 'Inscripciones de jugadores a etapas del circuito';
COMMENT ON COLUMN circuitooka_inscripciones.division_solicitada IS 'División solicitada para casos especiales (ej: División 2)';
COMMENT ON COLUMN circuitooka_inscripciones.evaluacion_organizador IS 'Indica si requiere evaluación del organizador';

-- Índices para circuitooka_inscripciones
CREATE INDEX IF NOT EXISTS idx_inscripciones_etapa ON circuitooka_inscripciones(etapa_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario ON circuitooka_inscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_division ON circuitooka_inscripciones(division_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_estado ON circuitooka_inscripciones(estado);

-- 1.1.4 Tabla: circuitooka_partidos
CREATE TABLE IF NOT EXISTS circuitooka_partidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    division_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    fecha_partido DATE NOT NULL,
    jugador_a1_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    jugador_a2_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    jugador_b1_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    jugador_b2_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    equipo_ganador VARCHAR(1) CHECK (equipo_ganador IN ('A', 'B')),
    sets_equipo_a INTEGER DEFAULT 0,
    sets_equipo_b INTEGER DEFAULT 0,
    games_equipo_a INTEGER DEFAULT 0,
    games_equipo_b INTEGER DEFAULT 0,
    resultado_detallado JSONB,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugado', 'cancelado', 'WO')),
    cancha VARCHAR(100),
    horario TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_partidos IS 'Partidos del circuito Circuitooka';
COMMENT ON COLUMN circuitooka_partidos.equipo_ganador IS 'Equipo ganador: A o B';
COMMENT ON COLUMN circuitooka_partidos.resultado_detallado IS 'Resultado detallado en formato JSON (sets, games, etc.)';
COMMENT ON COLUMN circuitooka_partidos.estado IS 'Estado del partido: pendiente, jugado, cancelado, WO (walkover)';

-- Índices para circuitooka_partidos
CREATE INDEX IF NOT EXISTS idx_partidos_etapa ON circuitooka_partidos(etapa_id);
CREATE INDEX IF NOT EXISTS idx_partidos_division ON circuitooka_partidos(division_id);
CREATE INDEX IF NOT EXISTS idx_partidos_fecha ON circuitooka_partidos(fecha_partido);
CREATE INDEX IF NOT EXISTS idx_partidos_estado ON circuitooka_partidos(estado);

-- 1.1.5 Tabla: circuitooka_parejas
CREATE TABLE IF NOT EXISTS circuitooka_parejas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    division_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    fecha_partido DATE NOT NULL,
    jugador_1_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    jugador_2_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_formacion VARCHAR(30) NOT NULL DEFAULT 'elegida_por_jugadores' CHECK (tipo_formacion IN ('elegida_por_jugadores', 'asignada_organizacion')),
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(etapa_id, division_id, fecha_partido, jugador_1_id, jugador_2_id)
);

COMMENT ON TABLE circuitooka_parejas IS 'Parejas formadas para partidos';
COMMENT ON COLUMN circuitooka_parejas.tipo_formacion IS 'Cómo se formó la pareja: elegida por jugadores o asignada por organización';

-- Índices para circuitooka_parejas
CREATE INDEX IF NOT EXISTS idx_parejas_etapa ON circuitooka_parejas(etapa_id);
CREATE INDEX IF NOT EXISTS idx_parejas_division ON circuitooka_parejas(division_id);
CREATE INDEX IF NOT EXISTS idx_parejas_fecha ON circuitooka_parejas(fecha_partido);

-- 1.1.6 Tabla: circuitooka_rankings
CREATE TABLE IF NOT EXISTS circuitooka_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    division_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    partidos_ganados INTEGER DEFAULT 0,
    partidos_jugados INTEGER DEFAULT 0,
    promedio_individual NUMERIC(5, 2) DEFAULT 0,
    promedio_general NUMERIC(5, 2) DEFAULT 0,
    bonus_por_jugar NUMERIC(5, 2) DEFAULT 0,
    promedio_final NUMERIC(5, 2) DEFAULT 0,
    diferencia_sets INTEGER DEFAULT 0,
    diferencia_games INTEGER DEFAULT 0,
    victorias_mejores_parejas INTEGER DEFAULT 0,
    posicion_ranking INTEGER,
    minimo_requerido NUMERIC(5, 2) DEFAULT 0,
    cumple_minimo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(etapa_id, division_id, usuario_id)
);

COMMENT ON TABLE circuitooka_rankings IS 'Rankings de jugadores por etapa y división';
COMMENT ON COLUMN circuitooka_rankings.promedio_individual IS 'Promedio individual del jugador';
COMMENT ON COLUMN circuitooka_rankings.promedio_general IS 'Promedio general considerando todos los partidos de la división';
COMMENT ON COLUMN circuitooka_rankings.bonus_por_jugar IS 'Bonus por cumplir mínimo de partidos';
COMMENT ON COLUMN circuitooka_rankings.promedio_final IS 'Promedio final usado para ranking';
COMMENT ON COLUMN circuitooka_rankings.cumple_minimo IS 'Indica si el jugador cumple el mínimo requerido';

-- Índices para circuitooka_rankings
CREATE INDEX IF NOT EXISTS idx_rankings_etapa ON circuitooka_rankings(etapa_id);
CREATE INDEX IF NOT EXISTS idx_rankings_division ON circuitooka_rankings(division_id);
CREATE INDEX IF NOT EXISTS idx_rankings_usuario ON circuitooka_rankings(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rankings_posicion ON circuitooka_rankings(posicion_ranking);
CREATE INDEX IF NOT EXISTS idx_rankings_promedio_final ON circuitooka_rankings(promedio_final DESC);

-- 1.1.7 Tabla: circuitooka_confirmaciones_partido
CREATE TABLE IF NOT EXISTS circuitooka_confirmaciones_partido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id UUID NOT NULL REFERENCES circuitooka_partidos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    confirmado BOOLEAN DEFAULT false,
    pareja_elegida_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_confirmacion TIMESTAMPTZ,
    puede_reemplazar BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partido_id, usuario_id)
);

COMMENT ON TABLE circuitooka_confirmaciones_partido IS 'Confirmaciones de asistencia a partidos';
COMMENT ON COLUMN circuitooka_confirmaciones_partido.pareja_elegida_id IS 'Compañero elegido por el jugador (si aplica)';

-- Índices para circuitooka_confirmaciones_partido
CREATE INDEX IF NOT EXISTS idx_confirmaciones_partido ON circuitooka_confirmaciones_partido(partido_id);
CREATE INDEX IF NOT EXISTS idx_confirmaciones_usuario ON circuitooka_confirmaciones_partido(usuario_id);

-- 1.1.8 Tabla: circuitooka_reemplazos
CREATE TABLE IF NOT EXISTS circuitooka_reemplazos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id UUID NOT NULL REFERENCES circuitooka_partidos(id) ON DELETE CASCADE,
    jugador_original_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    jugador_reemplazo_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo_reemplazo VARCHAR(30) NOT NULL CHECK (tipo_reemplazo IN ('inscripto_circuito', 'nuevo_inscripto')),
    fecha_reemplazo TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_reemplazos IS 'Reemplazos de jugadores en partidos';
COMMENT ON COLUMN circuitooka_reemplazos.tipo_reemplazo IS 'Tipo: jugador inscripto en el circuito o nuevo inscripto';

-- Índices para circuitooka_reemplazos
CREATE INDEX IF NOT EXISTS idx_reemplazos_partido ON circuitooka_reemplazos(partido_id);
CREATE INDEX IF NOT EXISTS idx_reemplazos_jugador_original ON circuitooka_reemplazos(jugador_original_id);

-- 1.1.9 Tabla: circuitooka_ascensos_descensos
CREATE TABLE IF NOT EXISTS circuitooka_ascensos_descensos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    division_origen_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    division_destino_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ascenso', 'descenso')),
    promedio_final NUMERIC(5, 2) NOT NULL,
    posicion_origen INTEGER,
    posicion_destino INTEGER,
    motivo VARCHAR(20) NOT NULL DEFAULT 'automatico' CHECK (motivo IN ('automatico', 'playoff')),
    fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_ascensos_descensos IS 'Historial de ascensos y descensos entre divisiones';
COMMENT ON COLUMN circuitooka_ascensos_descensos.motivo IS 'Motivo del cambio: automático por ranking o por playoff';

-- Índices para circuitooka_ascensos_descensos
CREATE INDEX IF NOT EXISTS idx_ascensos_etapa ON circuitooka_ascensos_descensos(etapa_id);
CREATE INDEX IF NOT EXISTS idx_ascensos_usuario ON circuitooka_ascensos_descensos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ascensos_tipo ON circuitooka_ascensos_descensos(tipo_movimiento);

-- 1.1.10 Tabla: circuitooka_playoffs
CREATE TABLE IF NOT EXISTS circuitooka_playoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    division_origen_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    division_destino_id UUID NOT NULL REFERENCES circuitooka_divisiones(id) ON DELETE RESTRICT,
    tipo_playoff VARCHAR(20) NOT NULL CHECK (tipo_playoff IN ('ascenso', 'descenso')),
    jugador_1_superior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    jugador_2_superior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    jugador_1_inferior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    jugador_2_inferior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    partido_id UUID REFERENCES circuitooka_partidos(id) ON DELETE SET NULL,
    resultado JSONB,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugado')),
    fecha_playoff DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE circuitooka_playoffs IS 'Partidos de playoff para ascensos/descensos';
COMMENT ON COLUMN circuitooka_playoffs.tipo_playoff IS 'Tipo de playoff: ascenso o descenso';

-- Índices para circuitooka_playoffs
CREATE INDEX IF NOT EXISTS idx_playoffs_etapa ON circuitooka_playoffs(etapa_id);
CREATE INDEX IF NOT EXISTS idx_playoffs_division_origen ON circuitooka_playoffs(division_origen_id);
CREATE INDEX IF NOT EXISTS idx_playoffs_estado ON circuitooka_playoffs(estado);

-- 1.1.11 Tabla: circuitooka_configuracion
CREATE TABLE IF NOT EXISTS circuitooka_configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etapa_id UUID NOT NULL REFERENCES circuitooka_etapas(id) ON DELETE CASCADE,
    cupos_ascenso_porcentaje INTEGER DEFAULT 20,
    cupos_ascenso_minimo INTEGER DEFAULT 2,
    cupos_ascenso_maximo INTEGER DEFAULT 10,
    jugadores_playoff_por_division INTEGER DEFAULT 4,
    horario_turno_noche_inicio TIME DEFAULT '20:00',
    horario_turno_noche_fin TIME DEFAULT '23:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(etapa_id)
);

COMMENT ON TABLE circuitooka_configuracion IS 'Configuración específica por etapa del circuito';
COMMENT ON COLUMN circuitooka_configuracion.cupos_ascenso_porcentaje IS 'Porcentaje de jugadores que ascienden (default 20%)';
COMMENT ON COLUMN circuitooka_configuracion.cupos_ascenso_minimo IS 'Mínimo de cupos de ascenso (default 2)';
COMMENT ON COLUMN circuitooka_configuracion.cupos_ascenso_maximo IS 'Máximo de cupos de ascenso (default 10)';

-- Índice para circuitooka_configuracion
CREATE INDEX IF NOT EXISTS idx_configuracion_etapa ON circuitooka_configuracion(etapa_id);

-- =====================================================
-- 1.2 FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_circuitooka_etapas_updated_at
    BEFORE UPDATE ON circuitooka_etapas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_inscripciones_updated_at
    BEFORE UPDATE ON circuitooka_inscripciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_partidos_updated_at
    BEFORE UPDATE ON circuitooka_partidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_rankings_updated_at
    BEFORE UPDATE ON circuitooka_rankings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_confirmaciones_updated_at
    BEFORE UPDATE ON circuitooka_confirmaciones_partido
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_configuracion_updated_at
    BEFORE UPDATE ON circuitooka_configuracion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuitooka_playoffs_updated_at
    BEFORE UPDATE ON circuitooka_playoffs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 1.2.1 Función: calcular_promedio_jugador
-- Nota: Esta función será implementada en la Fase 2 con la lógica completa
-- Por ahora creamos el esqueleto
CREATE OR REPLACE FUNCTION calcular_promedio_jugador(
    p_usuario_id UUID,
    p_etapa_id UUID,
    p_division_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Esta función será completada en la Fase 2
    -- Calcula: promedio_individual, promedio_general, bonus_por_jugar, promedio_final
    -- Calcula: minimo_requerido basado en partidos de la división
    -- Actualiza tabla circuitooka_rankings
    RAISE NOTICE 'Función calcular_promedio_jugador: pendiente de implementación completa';
END;
$$ LANGUAGE plpgsql;

-- 1.2.2 Función: calcular_minimo_requerido
CREATE OR REPLACE FUNCTION calcular_minimo_requerido(
    p_etapa_id UUID,
    p_division_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
    v_partidos_division INTEGER;
    v_jugadores_inscriptos INTEGER;
    v_minimo NUMERIC;
BEGIN
    -- Contar partidos jugados en la división
    SELECT COUNT(*) INTO v_partidos_division
    FROM circuitooka_partidos
    WHERE etapa_id = p_etapa_id
      AND division_id = p_division_id
      AND estado = 'jugado';
    
    -- Contar jugadores inscriptos en la división
    SELECT COUNT(*) INTO v_jugadores_inscriptos
    FROM circuitooka_inscripciones
    WHERE etapa_id = p_etapa_id
      AND division_id = p_division_id
      AND estado = 'activa';
    
    -- Calcular mínimo: PARTIDOS_JUGADOS_DIVISION / (CANTIDAD_JUGADORES_INSCRIPTOS / 2)
    IF v_jugadores_inscriptos > 0 THEN
        v_minimo := v_partidos_division::NUMERIC / (v_jugadores_inscriptos::NUMERIC / 2);
    ELSE
        v_minimo := 0;
    END IF;
    
    RETURN COALESCE(v_minimo, 0);
END;
$$ LANGUAGE plpgsql;

-- 1.2.3 Trigger: actualizar_ranking_despues_partido
-- Este trigger se dispara cuando se actualiza el estado de un partido a "jugado"
CREATE OR REPLACE FUNCTION trigger_actualizar_ranking_despues_partido()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si el estado cambió a "jugado"
    IF NEW.estado = 'jugado' AND (OLD.estado IS NULL OR OLD.estado != 'jugado') THEN
        -- Recalcular rankings de los 4 jugadores involucrados
        -- Esta lógica será completada en la Fase 2
        PERFORM calcular_promedio_jugador(NEW.jugador_a1_id, NEW.etapa_id, NEW.division_id);
        PERFORM calcular_promedio_jugador(NEW.jugador_a2_id, NEW.etapa_id, NEW.division_id);
        PERFORM calcular_promedio_jugador(NEW.jugador_b1_id, NEW.etapa_id, NEW.division_id);
        PERFORM calcular_promedio_jugador(NEW.jugador_b2_id, NEW.etapa_id, NEW.division_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_ranking_despues_partido
    AFTER UPDATE ON circuitooka_partidos
    FOR EACH ROW
    WHEN (NEW.estado = 'jugado' AND (OLD.estado IS NULL OR OLD.estado != 'jugado'))
    EXECUTE FUNCTION trigger_actualizar_ranking_despues_partido();

-- 1.2.4 Función: obtener_posicion_ranking
-- Nota: Esta función será implementada en la Fase 2 con la lógica completa de desempates
CREATE OR REPLACE FUNCTION obtener_posicion_ranking(
    p_usuario_id UUID,
    p_etapa_id UUID,
    p_division_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_posicion INTEGER;
BEGIN
    -- Esta función será completada en la Fase 2
    -- Calcula posición en el ranking basado en promedio_final
    -- Considera desempates: diferencia_sets, diferencia_games, victorias_mejores_parejas
    
    SELECT posicion_ranking INTO v_posicion
    FROM circuitooka_rankings
    WHERE usuario_id = p_usuario_id
      AND etapa_id = p_etapa_id
      AND division_id = p_division_id;
    
    RETURN v_posicion;
END;
$$ LANGUAGE plpgsql;

-- 1.2.5 Función: calcular_cupos_ascenso_descenso
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
    -- Obtener configuración de la etapa
    SELECT 
        cupos_ascenso_porcentaje,
        cupos_ascenso_minimo,
        cupos_ascenso_maximo
    INTO v_porcentaje, v_minimo, v_maximo
    FROM circuitooka_configuracion
    WHERE etapa_id = p_etapa_id;
    
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
    
    -- Calcular cupos: 20% de jugadores inscriptos (min 2, max 10)
    v_cupos_calculados := (v_jugadores_inscriptos::NUMERIC * v_porcentaje) / 100;
    v_cupos_finales := GREATEST(v_minimo, LEAST(v_maximo, ROUND(v_cupos_calculados)::INTEGER));
    
    RETURN QUERY SELECT v_cupos_finales, v_cupos_finales;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================

