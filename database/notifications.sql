-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('liga', 'ranking', 'academia', 'sistema', 'general')),
  leida BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_notificaciones_updated_at 
    BEFORE UPDATE ON notificaciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias notificaciones
CREATE POLICY "Users can view their own notifications" ON notificaciones
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que los usuarios puedan actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY "Users can update their own notifications" ON notificaciones
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para permitir inserción de notificaciones (sin restricción de admin)
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