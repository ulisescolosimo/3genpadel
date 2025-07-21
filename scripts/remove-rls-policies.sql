-- Script para eliminar las políticas RLS aplicadas

-- Eliminar políticas de usuarios regulares
DROP POLICY IF EXISTS "Users can view own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios;

-- Eliminar políticas de administradores
DROP POLICY IF EXISTS "Admins can view all profiles" ON usuarios;
DROP POLICY IF EXISTS "Admins can update all profiles" ON usuarios;
DROP POLICY IF EXISTS "Admins can insert profiles" ON usuarios;

-- Deshabilitar RLS en la tabla usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Verificar que se eliminaron todas las políticas
SELECT policyname FROM pg_policies WHERE tablename = 'usuarios'; 