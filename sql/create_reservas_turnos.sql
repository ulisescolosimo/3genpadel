-- Crear tabla reservas_turnos para gestionar turnos de entrenamientos grupales
CREATE TABLE IF NOT EXISTS reservas_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    categoria VARCHAR(10) NOT NULL CHECK (categoria IN ('C4', 'C6', 'C7', 'C8')),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'completo', 'cancelado')),
    capacidad_maxima INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT unique_turno_fecha_hora_categoria UNIQUE (fecha, hora, categoria)
);

-- Crear tabla reservas_inscripciones para gestionar las inscripciones de usuarios
CREATE TABLE IF NOT EXISTS reservas_inscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES reservas_turnos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_usuario_turno UNIQUE (turno_id, usuario_id)
);

-- Crear índice para mejorar búsquedas por fecha y estado
CREATE INDEX IF NOT EXISTS idx_reservas_turnos_fecha ON reservas_turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_turnos_estado ON reservas_turnos(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_turnos_categoria ON reservas_turnos(categoria);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_turno ON reservas_inscripciones(turno_id);
CREATE INDEX IF NOT EXISTS idx_reservas_inscripciones_usuario ON reservas_inscripciones(usuario_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at.r = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_reservas_turnos_updated_at BEFORE UPDATE ON reservas_turnos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservas_inscripciones_updated_at BEFORE UPDATE ON reservas_inscripciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el estado del turno cuando se completa la capacidad
CREATE OR REPLACE FUNCTION actualizar_estado_turno()
RETURNS TRIGGER AS $$
BEGIN
    -- Contar inscripciones activas del turno
    DECLARE
        inscripciones_count INTEGER;
        capacidad_turno INTEGER;
    BEGIN
        SELECT COUNT(*) INTO inscripciones_count
        FROM reservas_inscripciones
        WHERE turno_id = NEW.turno_id AND estado = 'confirmada';
        
        SELECT capacidad_maxima INTO capacidad_turno
        FROM reservas_turnos
        WHERE id = NEW.turno_id;
        
        -- Si se alcanzó la capacidad máxima, marcar como completo
        IF inscripciones_count >= capacidad_turno THEN
            UPDATE reservas_turnos
            SET estado = 'completo'
            WHERE id = NEW.turno_id AND estado = 'disponible';
        ELSE
            -- Si hay cupos disponibles, asegurar que está disponible
            UPDATE reservas_turnos
            SET estado = 'disponible'
            WHERE id = NEW.turno_id AND estado = 'completo';
        END IF;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado del turno al crear o actualizar inscripción
CREATE TRIGGER trigger_actualizar_estado_turno
    AFTER INSERT OR UPDATE ON reservas_inscripciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_turno();

-- Función para crear notificación al admin cuando un turno se completa
CREATE OR REPLACE FUNCTION notificar_turno_completo()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo notificar si el turno cambió a 'completo'
    IF NEW.estado = 'completo' AND (OLD.estado IS NULL OR OLD.estado != 'completo') THEN
        -- Crear notificación para todos los admin
        INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, leida)
        SELECT 
            id as usuario_id,
            'Turno Completo',
            'El turno de ' || NEW.categoria || ' del ' || 
            TO_CHAR(NEW.fecha, 'DD/MM/YYYY') || ' a las ' || 
            TO_CHAR(NEW.hora, 'HH24:MI') || ' está completo.',
            'academia',
            false
        FROM usuarios
        WHERE rol = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar cuando un turno se completa
CREATE TRIGGER trigger_notificar_turno_completo
    AFTER UPDATE ON reservas_turnos
    FOR EACH ROW
    EXECUTE FUNCTION notificar_turno_completo();

-- Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE reservas_turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE reservas_inscripciones;

-- Comentarios para documentar las tablas
COMMENT ON TABLE reservas_turnos IS 'Turnos disponibles para entrenamientos grupales';
COMMENT ON TABLE reservas_inscripciones IS 'Inscripciones de usuarios a turnos de entrenamientos grupales';
COMMENT ON COLUMN reservas_turnos.categoria IS 'Categoría del turno: C4, C6, C7, C8';
COMMENT ON COLUMN reservas_turnos.estado IS 'Estado del turno: disponible, completo, cancelado';
COMMENT ON COLUMN reservas_inscripciones.estado IS 'Estado de la inscripción: confirmada, cancelada';

-- RLSPolicies para reservas_turnos
ALTER TABLE reservas_turnos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver turnos disponibles
CREATE POLICY "Todos pueden ver turnos disponibles"
ON reservas_turnos FOR SELECT
USING (true);

-- Policy: Solo admins pueden crear turnos
CREATE POLICY "Solo admins pueden crear turnos"
ON reservas_turnos FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);

-- Policy: Solo admins pueden actualizar turnos
CREATE POLICY "Solo admins pueden actualizar turnos"
ON reservas_turnos FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);

-- RLSPolicies para reservas_inscripciones
ALTER TABLE reservas_inscripciones ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo pueden ver sus propias inscripciones
CREATE POLICY "Usuarios pueden ver sus propias inscripciones"
ON reservas_inscripciones FOR SELECT
USING (
    auth.uid() = usuario_id OR
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);

-- Policy: Usuarios pueden crear sus propias inscripciones
CREATE POLICY "Usuarios pueden inscribirse"
ON reservas_inscripciones FOR INSERT
WITH CHECK (
    auth.uid() = usuario_id
);

-- Policy: Usuarios pueden cancelar sus propias inscripciones
CREATE POLICY "Usuarios pueden cancelar sus inscripciones"
ON reservas_inscripciones FOR UPDATE
USING (
    auth.uid() = usuario_id OR
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);


