-- Tabla para gestionar los partidos dentro de una liga y categoría
CREATE TABLE public.liga_partidos (
  id SERIAL PRIMARY KEY,
  liga_categoria_id INTEGER NOT NULL REFERENCES public.liga_categorias(id) ON DELETE CASCADE,
  ronda VARCHAR NOT NULL, -- Ej: "Octavos", "Cuartos", "Semis", "Final"
  equipo_a_id INTEGER NOT NULL REFERENCES public.ligainscripciones(id) ON DELETE CASCADE,
  equipo_b_id INTEGER NOT NULL REFERENCES public.ligainscripciones(id) ON DELETE CASCADE,
  equipo_ganador_id INTEGER REFERENCES public.ligainscripciones(id) ON DELETE SET NULL,
  puntos_por_jugador INTEGER DEFAULT 3 CHECK (puntos_por_jugador >= 0),
  fecha TIMESTAMP,
  estado VARCHAR DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_liga_partidos_liga_categoria_id ON public.liga_partidos(liga_categoria_id);
CREATE INDEX idx_liga_partidos_equipo_a_id ON public.liga_partidos(equipo_a_id);
CREATE INDEX idx_liga_partidos_equipo_b_id ON public.liga_partidos(equipo_b_id);
CREATE INDEX idx_liga_partidos_estado ON public.liga_partidos(estado);
CREATE INDEX idx_liga_partidos_ronda ON public.liga_partidos(ronda);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_liga_partidos_updated_at 
    BEFORE UPDATE ON public.liga_partidos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para sumar puntos a los jugadores del equipo ganador
CREATE OR REPLACE FUNCTION sumar_puntos_equipo_ganador()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo ejecutar si se actualizó el equipo_ganador_id y no es NULL
    IF NEW.equipo_ganador_id IS NOT NULL AND 
       (OLD.equipo_ganador_id IS NULL OR OLD.equipo_ganador_id != NEW.equipo_ganador_id) THEN
        
        -- Sumar puntos a todos los jugadores del equipo ganador
        UPDATE usuarios
        SET ranking_puntos = ranking_puntos + NEW.puntos_por_jugador
        WHERE id IN (
            SELECT titular_1_id FROM ligainscripciones WHERE id = NEW.equipo_ganador_id
            UNION
            SELECT titular_2_id FROM ligainscripciones WHERE id = NEW.equipo_ganador_id
            UNION
            SELECT suplente_1_id FROM ligainscripciones WHERE id = NEW.equipo_ganador_id
            UNION
            SELECT suplente_2_id FROM ligainscripciones WHERE id = NEW.equipo_ganador_id
        );
        
        -- Actualizar el estado a 'jugado'
        NEW.estado = 'jugado';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para sumar puntos automáticamente cuando se define un ganador
CREATE TRIGGER trigger_sumar_puntos_ganador
    BEFORE UPDATE ON public.liga_partidos
    FOR EACH ROW
    EXECUTE FUNCTION sumar_puntos_equipo_ganador();

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.liga_partidos IS 'Tabla para gestionar los partidos dentro de una liga y categoría';
COMMENT ON COLUMN public.liga_partidos.liga_categoria_id IS 'Referencia a la categoría de la liga';
COMMENT ON COLUMN public.liga_partidos.ronda IS 'Ronda del torneo (Octavos, Cuartos, Semis, Final)';
COMMENT ON COLUMN public.liga_partidos.equipo_a_id IS 'ID del primer equipo (inscripción)';
COMMENT ON COLUMN public.liga_partidos.equipo_b_id IS 'ID del segundo equipo (inscripción)';
COMMENT ON COLUMN public.liga_partidos.equipo_ganador_id IS 'ID del equipo ganador (se establece cuando se carga el resultado)';
COMMENT ON COLUMN public.liga_partidos.puntos_por_jugador IS 'Puntos que suman los jugadores del equipo ganador';
COMMENT ON COLUMN public.liga_partidos.fecha IS 'Fecha y hora programada del partido';
COMMENT ON COLUMN public.liga_partidos.estado IS 'Estado del partido: pendiente, jugado, cancelado'; 