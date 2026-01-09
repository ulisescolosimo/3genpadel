-- =====================================================
-- CIRCUITOOKA 3GEN 2026 - DATOS INICIALES
-- Fase 1.4: Datos Iniciales
-- =====================================================

-- 1.4.1 Insertar divisiones base (División 1, 2, 3, 4)
INSERT INTO circuitooka_divisiones (numero_division, nombre, descripcion, orden)
VALUES 
    (1, 'División 1', 'División de mayor nivel. Jugadores con mayor experiencia y habilidad.', 1),
    (2, 'División 2', 'División intermedia-alta.', 2),
    (3, 'División 3', 'División intermedia. Nivel medio de juego.', 3),
    (4, 'División 4', 'División inicial. Para jugadores que comienzan en el circuito.', 4)
ON CONFLICT (numero_division) DO NOTHING;

-- 1.4.2 Crear primera etapa de prueba (Febrero-Abril 2026)
-- Nota: Ajustar las fechas según sea necesario
INSERT INTO circuitooka_etapas (nombre, fecha_inicio, fecha_fin, año, estado)
VALUES 
    ('Etapa Febrero-Abril 2026', '2026-02-01', '2026-04-30', 2026, 'activa')
ON CONFLICT DO NOTHING;

-- 1.4.3 Configurar parámetros por defecto en circuitooka_configuracion
-- Obtener el ID de la primera etapa creada
DO $$
DECLARE
    v_etapa_id UUID;
BEGIN
    -- Obtener el ID de la primera etapa activa
    SELECT id INTO v_etapa_id
    FROM circuitooka_etapas
    WHERE estado = 'activa'
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Si existe una etapa, crear su configuración
    IF v_etapa_id IS NOT NULL THEN
        INSERT INTO circuitooka_configuracion (
            etapa_id,
            cupos_ascenso_porcentaje,
            cupos_ascenso_minimo,
            cupos_ascenso_maximo,
            jugadores_playoff_por_division,
            horario_turno_noche_inicio,
            horario_turno_noche_fin
        )
        VALUES (
            v_etapa_id,
            20,  -- 20% de jugadores ascienden
            2,   -- Mínimo 2 cupos
            10,  -- Máximo 10 cupos
            4,   -- 4 jugadores por división en playoff
            '20:00',  -- Inicio turno noche
            '23:00'   -- Fin turno noche
        )
        ON CONFLICT (etapa_id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- FIN DE DATOS INICIALES
-- =====================================================

