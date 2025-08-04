-- Script para arreglar las notificaciones sin restricciones de admin

-- Eliminar las políticas existentes
DROP POLICY IF EXISTS "Admins can insert notifications" ON notificaciones;
DROP POLICY IF EXISTS "Allow notification insertion" ON notificaciones;

-- Eliminar las funciones existentes
DROP FUNCTION IF EXISTS crear_notificacion(UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS crear_notificacion_masiva(TEXT, TEXT, TEXT, JSONB);

-- Crear nueva política para permitir inserción sin restricción de admin
CREATE POLICY "Allow notification insertion" ON notificaciones
  FOR INSERT WITH CHECK (true);

-- Función para crear notificaciones (sin verificación de admin)
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id UUID,
  p_titulo TEXT,
  p_mensaje TEXT,
  p_tipo TEXT DEFAULT 'general',
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notificacion_id UUID;
BEGIN
  -- Insertar la notificación sin verificar rol de admin
  INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, data)
  VALUES (p_usuario_id, p_titulo, p_mensaje, p_tipo, p_data)
  RETURNING id INTO v_notificacion_id;

  RETURN v_notificacion_id;
END;
$$;

-- Función para crear notificaciones masivas (sin verificación de admin)
CREATE OR REPLACE FUNCTION crear_notificacion_masiva(
  p_titulo TEXT,
  p_mensaje TEXT,
  p_tipo TEXT DEFAULT 'general',
  p_data JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insertar notificaciones para todos los usuarios sin verificar rol de admin
  INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, data)
  SELECT id, p_titulo, p_mensaje, p_tipo, p_data
  FROM usuarios
  WHERE rol != 'admin';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$; 