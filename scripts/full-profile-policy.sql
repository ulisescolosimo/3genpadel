-- Política RLS completa para permitir que los usuarios actualicen su perfil completo
-- Esta política permite que los usuarios actualicen todos los campos de su propio perfil

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON usuarios
FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios actualicen su propio perfil completo
CREATE POLICY "Users can update own profile" ON usuarios
FOR UPDATE USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile" ON usuarios
FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Política para administradores (ver todos los perfiles)
CREATE POLICY "Admins can view all profiles" ON usuarios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE email = auth.jwt() ->> 'email' AND rol = 'admin'
  )
);

-- Política para administradores (actualizar todos los perfiles)
CREATE POLICY "Admins can update all profiles" ON usuarios
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE email = auth.jwt() ->> 'email' AND rol = 'admin'
  )
); 