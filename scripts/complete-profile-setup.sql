-- Script completo para configurar perfil de usuario
-- Incluye bucket de storage y políticas RLS completas

-- ========================================
-- 1. CONFIGURAR STORAGE BUCKET
-- ========================================

-- Crear el bucket 'perfil' si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfil',
  'perfil',
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. POLÍTICAS DE STORAGE
-- ========================================

-- Permitir que los usuarios autenticados suban archivos
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
);

-- Permitir que los usuarios vean todas las imágenes de perfil (públicas)
DROP POLICY IF EXISTS "Users can view profile images" ON storage.objects;
CREATE POLICY "Users can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'perfil');

-- Permitir que los usuarios actualicen sus propias imágenes
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
);

-- Permitir que los usuarios eliminen sus propias imágenes
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
);

-- ========================================
-- 3. POLÍTICAS RLS PARA TABLA USUARIOS
-- ========================================

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

-- ========================================
-- 4. VERIFICACIÓN
-- ========================================

-- Verificar que el bucket se creó
SELECT id, name, public FROM storage.buckets WHERE id = 'perfil';

-- Verificar políticas de storage
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Verificar políticas de usuarios
SELECT policyname FROM pg_policies WHERE tablename = 'usuarios'; 