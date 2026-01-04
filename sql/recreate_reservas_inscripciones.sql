-- Script para recrear el sistema de reservas sin reservas_turnos
-- Elimina las tablas antiguas y crea la nueva estructura

-- Paso 1: Eliminar funciones relacionadas si existen (se eliminan antes de las tablas)
DROP FUNCTION IF EXISTS set_dia_semana() CASCADE;
DROP FUNCTION IF EXISTS notificar_cambio_estado_reserva() CASCADE;
DROP FUNCTION IF EXISTS actualizar_estado_turno() CASCADE;
DROP FUNCTION IF EXISTS notificar_turno_completo() CASCADE;
DROP FUNCTION IF EXISTS update_reservas_inscripciones_updated_at() CASCADE;

-- Paso 2: Eliminar tablas (CASCADE eliminará automáticamente triggers, políticas, constraints, etc.)
DROP TABLE IF EXISTS public.reservas_inscripciones CASCADE;
DROP TABLE IF EXISTS public.reservas_turnos CASCADE;

-- Paso 3: Crear la nueva tabla reservas_inscripciones sin turno_id
CREATE TABLE public.reservas_inscripciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  fecha date NOT NULL,
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  categoria text NOT NULL CHECK (categoria = ANY (ARRAY['Iniciante de cero'::text, 'Principiante'::text, 'Intermedio'::text, 'Avanzado'::text, 'Profesional'::text])),
  estado text NOT NULL DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'cancelada'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reservas_inscripciones_pkey PRIMARY KEY (id),
  CONSTRAINT reservas_inscripciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT reservas_inscripciones_unique_usuario_fecha_hora_categoria UNIQUE (usuario_id, fecha, hora_inicio, hora_fin, categoria)
);

-- Paso 4: Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_usuario_id ON public.reservas_inscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_fecha ON public.reservas_inscripciones(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_estado ON public.reservas_inscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_categoria ON public.reservas_inscripciones(categoria);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_fecha_hora_categoria ON public.reservas_inscripciones(fecha, hora_inicio, hora_fin, categoria);

-- Paso 5: Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reservas_inscripciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Trigger para updated_at
CREATE TRIGGER trg_update_reservas_inscripciones_updated_at
BEFORE UPDATE ON public.reservas_inscripciones
FOR EACH ROW
EXECUTE FUNCTION update_reservas_inscripciones_updated_at();

-- Paso 7: Habilitar Row Level Security
ALTER TABLE public.reservas_inscripciones ENABLE ROW LEVEL SECURITY;

-- Paso 8: Policies de RLS

-- Policy: Usuarios pueden ver sus propias inscripciones
CREATE POLICY "Usuarios pueden ver sus propias inscripciones"
ON public.reservas_inscripciones FOR SELECT
USING (
  auth.uid() = usuario_id OR
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy: Usuarios pueden crear sus propias inscripciones
CREATE POLICY "Usuarios pueden crear sus propias inscripciones"
ON public.reservas_inscripciones FOR INSERT
WITH CHECK (
  auth.uid() = usuario_id
);

-- Policy: Usuarios pueden actualizar sus propias inscripciones (para cancelar)
CREATE POLICY "Usuarios pueden actualizar sus propias inscripciones"
ON public.reservas_inscripciones FOR UPDATE
USING (
  auth.uid() = usuario_id OR
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy: Admins pueden actualizar cualquier inscripción (para confirmar/rechazar)
-- Ya cubierto por la policy anterior

-- Policy: Usuarios pueden eliminar sus propias inscripciones
CREATE POLICY "Usuarios pueden eliminar sus propias inscripciones"
ON public.reservas_inscripciones FOR DELETE
USING (
  auth.uid() = usuario_id OR
  EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Paso 9: Remover de publicaciones realtime (ejecutar manualmente si es necesario)
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.reservas_turnos;
-- Nota: Si reservas_turnos estaba en realtime, ejecuta el comando anterior manualmente
-- reservas_inscripciones puede quedarse en realtime si lo necesitas

-- Paso 10: Comentarios
COMMENT ON TABLE public.reservas_inscripciones IS 'Inscripciones de usuarios a turnos de entrenamientos grupales. Los turnos se identifican por fecha, hora_inicio, hora_fin y categoria. No se usa la tabla reservas_turnos.';
COMMENT ON COLUMN public.reservas_inscripciones.fecha IS 'Fecha del turno';
COMMENT ON COLUMN public.reservas_inscripciones.hora_inicio IS 'Hora de inicio del turno (formato HH:MM:SS). Valores permitidos: 12:00:00, 13:00:00, 14:00:00, 15:00:00';
COMMENT ON COLUMN public.reservas_inscripciones.hora_fin IS 'Hora de fin del turno (formato HH:MM:SS). Valores permitidos: 13:00:00, 14:00:00, 15:00:00, 16:00:00';
COMMENT ON COLUMN public.reservas_inscripciones.categoria IS 'Categoría del turno: Iniciante de cero, Principiante, Intermedio, Avanzado, Profesional';
COMMENT ON COLUMN public.reservas_inscripciones.estado IS 'Estado de la inscripción: pendiente (por defecto), confirmada, cancelada';
