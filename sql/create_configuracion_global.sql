-- Crear tabla configuracion_global para manejar configuraciones globales del sistema
-- Esta tabla almacena configuraciones que afectan a toda la aplicación

CREATE TABLE IF NOT EXISTS configuracion_global (
    id INTEGER PRIMARY KEY DEFAULT 1,
    live_notification_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT configuracion_global_single_row CHECK (id = 1)
);

-- Insertar registro por defecto si no existe
INSERT INTO configuracion_global (id, live_notification_visible, created_at, updated_at)
VALUES (1, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Comentarios para documentar la tabla
COMMENT ON TABLE configuracion_global IS 'Configuraciones globales del sistema';
COMMENT ON COLUMN configuracion_global.id IS 'ID fijo (siempre 1) para garantizar un solo registro';
COMMENT ON COLUMN configuracion_global.live_notification_visible IS 'Controla si las notificaciones de torneos en vivo son visibles';
COMMENT ON COLUMN configuracion_global.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN configuracion_global.updated_at IS 'Fecha de última actualización';
