-- Script de diagnóstico para verificar la estructura de la tabla usuarios

-- 1. Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 2. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'usuarios';

-- 3. Verificar políticas existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'usuarios';

-- 4. Verificar algunos registros de ejemplo
SELECT id, email, nombre, apellido, rol 
FROM usuarios 
LIMIT 5;

-- 5. Verificar el tipo de auth.uid()
SELECT 
    'auth.uid() type' as info,
    pg_typeof(auth.uid()) as type;

-- 6. Verificar si hay conflictos de tipos
-- Esto puede ayudar a identificar el problema
SELECT 
    'Sample ID type' as info,
    pg_typeof(id) as id_type
FROM usuarios 
LIMIT 1; 