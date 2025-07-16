-- Crear bucket para almacenar comprobantes de inscripción
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'liga-inscripciones',
  'liga-inscripciones',
  true,
  1073741824, -- 1GB en bytes
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Crear política para permitir subida de archivos autenticados
CREATE POLICY "Permitir subida de comprobantes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'liga-inscripciones' AND
    auth.role() = 'authenticated'
  );

-- Crear política para permitir lectura pública de comprobantes
CREATE POLICY "Permitir lectura pública de comprobantes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'liga-inscripciones'
  );

-- Crear política para permitir actualización de archivos propios
CREATE POLICY "Permitir actualización de comprobantes propios" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'liga-inscripciones' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Crear política para permitir eliminación de archivos propios
CREATE POLICY "Permitir eliminación de comprobantes propios" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'liga-inscripciones' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 