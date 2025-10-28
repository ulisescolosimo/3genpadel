-- Agregar campo estado a reservas_inscripciones
ALTER TABLE public.reservas_inscripciones 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada'));

-- Actualizar las inscripciones existentes a confirmadas (si ya están creadas)
UPDATE public.reservas_inscripciones 
SET estado = 'confirmada' 
WHERE estado IS NULL OR estado = '';

-- Agregar comentario
COMMENT ON COLUMN reservas_inscripciones.estado IS 'Estado de la inscripción: pendiente, confirmada, cancelada';

