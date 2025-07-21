-- Script para crear el bucket de storage para perfiles de usuario

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

-- Configurar políticas de acceso para el bucket perfil
-- Permitir que los usuarios autenticados suban archivos
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
);

-- Permitir que los usuarios vean todas las imágenes de perfil (públicas)
CREATE POLICY "Users can view profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'perfil');

-- Permitir que los usuarios actualicen sus propias imágenes
CREATE POLICY "Users can update own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
);

-- Permitir que los usuarios eliminen sus propias imágenes
CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'perfil' AND 
  auth.role() = 'authenticated'
); 