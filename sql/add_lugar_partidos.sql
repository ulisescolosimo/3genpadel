-- Agregar columna lugar a circuito3gen_partidos
-- Valores: 'la_normanda' (La normanda - Delgado 864) o 'adr' (ADR - Olleros 1515)

ALTER TABLE public.circuito3gen_partidos
ADD COLUMN IF NOT EXISTS lugar character varying(50) NULL;

-- Constraint para validar los valores permitidos
ALTER TABLE public.circuito3gen_partidos
DROP CONSTRAINT IF EXISTS circuito3gen_partidos_lugar_check;

ALTER TABLE public.circuito3gen_partidos
ADD CONSTRAINT circuito3gen_partidos_lugar_check CHECK (
  lugar IS NULL OR lugar IN ('la_normanda', 'adr')
);

COMMENT ON COLUMN public.circuito3gen_partidos.lugar IS 'Lugar del partido: la_normanda (Delgado 864) o adr (Olleros 1515)';
