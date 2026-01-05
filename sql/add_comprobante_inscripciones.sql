-- Agregar campos para comprobante de pago en circuito3gen_inscripciones
ALTER TABLE public.circuito3gen_inscripciones
ADD COLUMN IF NOT EXISTS comprobante_url TEXT,
ADD COLUMN IF NOT EXISTS comprobante_filename VARCHAR(255);

COMMENT ON COLUMN circuito3gen_inscripciones.comprobante_url IS 'URL del comprobante de pago subido';
COMMENT ON COLUMN circuito3gen_inscripciones.comprobante_filename IS 'Nombre del archivo del comprobante de pago';

