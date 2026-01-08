-- Agregar campos para imagen del jugador en circuito3gen_inscripciones
ALTER TABLE public.circuito3gen_inscripciones
ADD COLUMN IF NOT EXISTS imagen_jugador_url TEXT,
ADD COLUMN IF NOT EXISTS imagen_jugador_filename VARCHAR(255);

COMMENT ON COLUMN circuito3gen_inscripciones.imagen_jugador_url IS 'URL de la imagen del jugador subida';
COMMENT ON COLUMN circuito3gen_inscripciones.imagen_jugador_filename IS 'Nombre del archivo de la imagen del jugador';
