-- =====================================================
-- INSERTAR ETAPAS DEL CIRCUITO 3GEN 2026
-- =====================================================
-- Este script inserta las 4 etapas del circuito 2026:
-- - Origin (7 de Febrero al 19 de Abril)
-- - Winter (25 de Abril al 19 de Julio)
-- - Spring (25 de Julio al 11 de Octubre)
-- - Máster (17 de Octubre al 20 de Diciembre)
-- =====================================================

-- Opcional: Finalizar la etapa anterior si existe
-- UPDATE public.circuito3gen_etapas 
-- SET estado = 'finalizada', updated_at = NOW()
-- WHERE nombre = 'Etapa Febrero-Abril 2026' AND estado = 'activa';

-- Insertar las 4 etapas del circuito 2026
-- Solo Origin está activa inicialmente, las demás se activarán cuando llegue su fecha de inicio
INSERT INTO public.circuito3gen_etapas (id, nombre, fecha_inicio, fecha_fin, año, estado, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'Origin',
    '2026-02-07',
    '2026-04-19',
    2026,
    'activa',  -- Primera etapa activa
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Winter',
    '2026-04-25',
    '2026-07-19',
    2026,
    'finalizada',  -- Se activará cuando llegue su fecha de inicio
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Spring',
    '2026-07-25',
    '2026-10-11',
    2026,
    'finalizada',  -- Se activará cuando llegue su fecha de inicio
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Máster',
    '2026-10-17',
    '2026-12-20',
    2026,
    'finalizada',  -- Se activará cuando llegue su fecha de inicio
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron correctamente
-- SELECT id, nombre, fecha_inicio, fecha_fin, año, estado 
-- FROM public.circuito3gen_etapas 
-- WHERE año = 2026
-- ORDER BY fecha_inicio;

