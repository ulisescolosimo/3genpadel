-- =====================================================
-- AGREGAR SOPORTE PARA JUGADORES NO REGISTRADOS EN PARTIDOS
-- =====================================================
-- Este script permite guardar partidos con jugadores que no están
-- inscritos en el sistema, útil para casos de suplentes de emergencia.
-- Estos jugadores no afectan rankings ni promedios.

-- 1. Modificar campos de jugadores para permitir NULL
ALTER TABLE circuito3gen_partidos
  ALTER COLUMN jugador_a1_id DROP NOT NULL,
  ALTER COLUMN jugador_a2_id DROP NOT NULL,
  ALTER COLUMN jugador_b1_id DROP NOT NULL,
  ALTER COLUMN jugador_b2_id DROP NOT NULL;

-- 2. Agregar campos para nombres de jugadores no registrados
ALTER TABLE circuito3gen_partidos
  ADD COLUMN IF NOT EXISTS jugador_a1_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jugador_a2_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jugador_b1_nombre VARCHAR(255),
  ADD COLUMN IF NOT EXISTS jugador_b2_nombre VARCHAR(255);

-- 3. Agregar constraint para asegurar que cada jugador tenga ID o nombre
ALTER TABLE circuito3gen_partidos
  ADD CONSTRAINT check_jugador_a1_tiene_datos 
    CHECK (jugador_a1_id IS NOT NULL OR jugador_a1_nombre IS NOT NULL),
  ADD CONSTRAINT check_jugador_a2_tiene_datos 
    CHECK (jugador_a2_id IS NOT NULL OR jugador_a2_nombre IS NOT NULL),
  ADD CONSTRAINT check_jugador_b1_tiene_datos 
    CHECK (jugador_b1_id IS NOT NULL OR jugador_b1_nombre IS NOT NULL),
  ADD CONSTRAINT check_jugador_b2_tiene_datos 
    CHECK (jugador_b2_id IS NOT NULL OR jugador_b2_nombre IS NOT NULL);

-- 4. Agregar comentarios
COMMENT ON COLUMN circuito3gen_partidos.jugador_a1_nombre IS 'Nombre del jugador A1 si no está registrado en el sistema';
COMMENT ON COLUMN circuito3gen_partidos.jugador_a2_nombre IS 'Nombre del jugador A2 si no está registrado en el sistema';
COMMENT ON COLUMN circuito3gen_partidos.jugador_b1_nombre IS 'Nombre del jugador B1 si no está registrado en el sistema';
COMMENT ON COLUMN circuito3gen_partidos.jugador_b2_nombre IS 'Nombre del jugador B2 si no está registrado en el sistema';
