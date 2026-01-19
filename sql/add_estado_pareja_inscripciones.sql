-- Agregar campo para estado de pareja en circuito3gen_inscripciones
ALTER TABLE public.circuito3gen_inscripciones
ADD COLUMN IF NOT EXISTS estado_pareja VARCHAR(20);

COMMENT ON COLUMN circuito3gen_inscripciones.estado_pareja IS 'Estado de pareja del jugador: tiene_pareja, necesita_pareja, o NULL si no especificado';

-- Agregar constraint para validar valores permitidos
ALTER TABLE public.circuito3gen_inscripciones
ADD CONSTRAINT check_estado_pareja 
CHECK (estado_pareja IS NULL OR estado_pareja IN ('tiene_pareja', 'necesita_pareja'));
