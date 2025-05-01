-- Habilitar RLS en la tabla usuarios si no está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Crear la política RLS para permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON usuarios
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Agregar campos adicionales a la tabla usuarios
ALTER TABLE usuarios
ADD COLUMN telefono text,
ADD COLUMN nivel text,
ADD COLUMN bio text,
ADD COLUMN ubicacion text,
ADD COLUMN fecha_nacimiento date;

-- Comentarios para los nuevos campos
COMMENT ON COLUMN usuarios.telefono IS 'Número de teléfono del usuario';
COMMENT ON COLUMN usuarios.nivel IS 'Nivel de juego del usuario (Principiante, Intermedio, Avanzado, Profesional)';
COMMENT ON COLUMN usuarios.bio IS 'Biografía o descripción del usuario';
COMMENT ON COLUMN usuarios.ubicacion IS 'Ubicación o ciudad del usuario';
COMMENT ON COLUMN usuarios.fecha_nacimiento IS 'Fecha de nacimiento del usuario'; 