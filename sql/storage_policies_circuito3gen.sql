-- =====================================================
-- POLÍTICAS RLS PARA STORAGE - CIRCUITO3GEN INSCRIPCIONES
-- =====================================================

-- NOTA: Antes de ejecutar estas políticas, asegúrate de que el bucket
-- 'circuito3gen-inscripciones' existe en Supabase Storage.
-- Puedes crearlo desde el dashboard de Supabase: Storage > New bucket

-- Políticas para el bucket de Storage: circuito3gen-inscripciones
-- Permite a usuarios autenticados subir archivos de comprobantes

-- INSERT: Permitir a usuarios autenticados subir archivos en la carpeta comprobantes
CREATE POLICY "Permitir subida de comprobantes a usuarios autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'circuito3gen-inscripciones'
);

-- SELECT: Permitir a usuarios autenticados leer archivos del bucket
CREATE POLICY "Permitir lectura de comprobantes a usuarios autenticados"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'circuito3gen-inscripciones'
);

-- UPDATE: Permitir a usuarios autenticados actualizar archivos del bucket
CREATE POLICY "Permitir actualización de comprobantes a usuarios autenticados"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'circuito3gen-inscripciones'
)
WITH CHECK (
  bucket_id = 'circuito3gen-inscripciones'
);

-- DELETE: Permitir a usuarios autenticados eliminar archivos del bucket
CREATE POLICY "Permitir eliminación de comprobantes a usuarios autenticados"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'circuito3gen-inscripciones'
);

-- =====================================================
-- POLÍTICAS RLS PARA TABLA - CIRCUITO3GEN INSCRIPCIONES
-- =====================================================

-- NOTA: Estas políticas pueden ya existir si se ejecutó circuitooka_rls_policies.sql
-- Si obtienes un error de "policy already exists", puedes ignorarlo o eliminar
-- las políticas existentes primero.

-- Asegurar que la tabla tenga RLS habilitado
ALTER TABLE circuito3gen_inscripciones ENABLE ROW LEVEL SECURITY;

-- INSERT: Permitir a usuarios autenticados crear sus propias inscripciones
-- (Esta política puede ya existir como "Inscripciones: crear propias")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'circuito3gen_inscripciones' 
    AND policyname = 'Permitir inserciones a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir inserciones a usuarios autenticados"
    ON circuito3gen_inscripciones
    FOR INSERT
    TO authenticated
    WITH CHECK (usuario_id = auth.uid());
  END IF;
END $$;

