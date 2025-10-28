-- Actualizar sistema de reservas de turnos para entrenamientos grupales
-- Este script se ejecuta en base a la estructura existente de las tablas

-- Las tablas ya existen, solo necesitamos agregar funcionalidades adicionales

-- Función para actualizar el estado del turno cuando se completa la capacidad
CREATE OR REPLACE FUNCTION actualizar_estado_turno()
RETURNS TRIGGER AS $$
BEGIN
    -- Contar inscripciones del turno
    DECLARE
        inscripciones_count INTEGER;
        capacidad_turno INTEGER;
    BEGIN
        SELECT COUNT(*) INTO inscripciones_count
        FROM reservas_inscripciones
        WHERE turno_id = COALESCE(NEW.turno_id, OLD.turno_id);
        
        SELECT capacidad INTO capacidad_turno
        FROM reservas_turnos
        WHERE id = COALESCE(NEW.turno_id, OLD.turno_id);
        
        -- Si se alcanzó la capacidad máxima, marcar como completo
        IF inscripciones_count >= capacidad_turno THEN
            UPDATE reservas_turnos
            SET estado = 'completo'
            WHERE id = COALESCE(NEW.turno_id, OLD.turno_id) AND estado = 'disponible';
        ELSE
            -- Si hay cupos disponibles, asegurar que está disponible
            UPDATE reservas_turnos
            SET estado = 'disponible'
            WHERE id = COALESCE(NEW.turno_id, OLD.turno_id) AND estado = 'completo';
        END IF;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Si el trigger no existe, crearlo
DROP TRIGGER IF EXISTS trigger_actualizar_estado_turno ON reservas_inscripciones;
CREATE TRIGGER trigger_actualizar_estado_turno
    AFTER INSERT OR DELETE ON reservas_inscripciones
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
            TO_CHAR(NEW.fecha, 'DD/MM/YYYY') || ' de ' || 
            TO_CHAR(NEW.hora_inicio, 'HH24:MI') || ' a ' || 
            TO_CHAR(NEW.hora_fin, 'HH24:MI') || ' está completo.',
            'academia',
            false
        FROM usuarios
        WHERE rol = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Si el trigger no existe, crearlo
DROP TRIGGER IF EXISTS trigger_notificar_turno_completo ON reservas_turnos;
CREATE TRIGGER trigger_notificar_turno_completo
    AFTER UPDATE ON reservas_turnos
    FOR EACH ROW
    EXECUTE FUNCTION notificar_turno_completo();

-- Habilitar Realtime para las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS reservas_turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS reservas_inscripciones;

-- Actualizar RLS Policies para reservas_turnos (si no existen)
ALTER TABLE reservas_turnos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden ver turnos disponibles
DROP POLICY IF EXISTS "Todos pueden ver turnos disponibles" ON reservas_turnos;
CREATE POLICY "Todos pueden ver turnos disponibles"
ON reservas_turnos FOR SELECT
USING (true);

-- Policy: Solo admins pueden crear turnos
DROP POLICY IF EXISTS "Solo admins pueden crear turnos" ON reservas_turnos;
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
DROP POLICY IF EXISTS "Solo admins pueden actualizar turnos" ON reservas_turnos;
CREATE POLICY "Solo admins pueden actualizar turnos"
ON reservas_turnos FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);

-- Actualizar RLS Policies para reservas_inscripciones (si no existen)
ALTER TABLE reservas_inscripciones ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo pueden ver sus propias inscripciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias inscripciones" ON reservas_inscripciones;
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
DROP POLICY IF EXISTS "Usuarios pueden inscribirse" ON reservas_inscripciones;
CREATE POLICY "Usuarios pueden inscribirse"
ON reservas_inscripciones FOR INSERT
WITH CHECK (
    auth.uid() = usuario_id
);

-- Policy: Usuarios pueden eliminar sus propias inscripciones
DROP POLICY IF EXISTS "Usuarios pueden cancelar sus inscripciones" ON reservas_inscripciones;
CREATE POLICY "Usuarios pueden cancelar sus inscripciones"
ON reservas_inscripciones FOR DELETE
USING (
    auth.uid() = usuario_id OR
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol = 'admin'
    )
);

-- Comentarios actualizados
COMMENT ON TABLE reservas_turnos IS 'Turnos disponibles para entrenamientos grupales';
COMMENT ON TABLE reservas_inscripciones IS 'Inscripciones de usuarios a turnos de entrenamientos grupales';
COMMENT ON COLUMN reservas_turnos.categoria IS 'Categoría del turno: C4, C6, C7, C8';
COMMENT ON COLUMN reservas_turnos.estado IS 'Estado del turno: disponible, completo, cancelado';

