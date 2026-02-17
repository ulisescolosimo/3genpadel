-- WO individual: jugadores que no se presentaron al partido
-- No se les cuenta el partido jugado en estadísticas, pero sí a su compañero y rivales
ALTER TABLE public.circuito3gen_partidos
ADD COLUMN IF NOT EXISTS wo_jugador_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN public.circuito3gen_partidos.wo_jugador_ids IS 
  'IDs de jugadores que no se presentaron (WO individual). No se les cuenta el partido jugado, pero sí a su compañero y rivales.';
