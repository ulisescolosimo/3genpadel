-- Políticas RLS alternativas para la tabla usuarios
-- Versión más robusta que maneja diferentes tipos de datos

-- Primero, verificar el tipo de datos del campo id
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'id';

-- Política para permitir que los usuarios vean su propio perfil
-- Usando email como identificador (más confiable)
CREATE POLICY "Users can view own profile" ON usuarios
FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON usuarios
FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile" ON usuarios
FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Política para permitir que los administradores vean todos los perfiles
CREATE POLICY "Admins can view all profiles" ON usuarios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE email = auth.jwt() ->> 'email' AND rol = 'admin'
  )
);

-- Política para permitir que los administradores actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles" ON usuarios
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE email = auth.jwt() ->> 'email' AND rol = 'admin'
  )
);

-- Política para permitir que los administradores inserten perfiles
CREATE POLICY "Admins can insert profiles" ON usuarios
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE email = auth.jwt() ->> 'email' AND rol = 'admin'
  )
);

-- Habilitar RLS en la tabla usuarios si no está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY; 