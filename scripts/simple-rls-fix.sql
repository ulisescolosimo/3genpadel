-- Script simple para permitir actualizar perfil de usuario
-- Solo políticas RLS, sin tocar storage (ya funciona para comprobantes)

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios;
DROP POLICY IF EXISTS "Admins can view all profiles" ON usuarios;
DROP POLICY IF EXISTS "Admins can update all profiles" ON usuarios;

-- Política para permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON usuarios
FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios actualicen su propio perfil completo
-- Esto incluye avatar_url, nombre, apellido, telefono, nivel, fecha_nacimiento, dni, etc.
CREATE POLICY "Users can update own profile" ON usuarios
FOR UPDATE USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile" ON usuarios
FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Verificar que se crearon las políticas
SELECT policyname FROM pg_policies WHERE tablename = 'usuarios'; 