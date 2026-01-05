-- =====================================================
-- SCRIPT PARA RENOMBRAR TABLAS DE CIRCUITOOKA A CIRCUITO 3GEN
-- =====================================================
-- Este script renombra todas las tablas de circuitooka_* a circuito3gen_*
-- 
-- IMPORTANTE: Ejecutar este script en orden y verificar que no haya errores
-- antes de continuar con el siguiente comando.
--
-- NOTA: Después de renombrar las tablas, también se deben actualizar:
-- - Índices (se renombrarán automáticamente con las tablas)
-- - Constraints/Foreign Keys (se renombrarán automáticamente)
-- - Views, funciones y triggers relacionados
-- - Políticas RLS (Row Level Security)
-- =====================================================

-- Renombrar tablas principales
ALTER TABLE public.circuitooka_etapas RENAME TO circuito3gen_etapas;
ALTER TABLE public.circuitooka_divisiones RENAME TO circuito3gen_divisiones;
ALTER TABLE public.circuitooka_inscripciones RENAME TO circuito3gen_inscripciones;
ALTER TABLE public.circuitooka_partidos RENAME TO circuito3gen_partidos;
ALTER TABLE public.circuitooka_parejas RENAME TO circuito3gen_parejas;
ALTER TABLE public.circuitooka_rankings RENAME TO circuito3gen_rankings;
ALTER TABLE public.circuitooka_confirmaciones_partido RENAME TO circuito3gen_confirmaciones_partido;
ALTER TABLE public.circuitooka_reemplazos RENAME TO circuito3gen_reemplazos;
ALTER TABLE public.circuitooka_ascensos_descensos RENAME TO circuito3gen_ascensos_descensos;
ALTER TABLE public.circuitooka_playoffs RENAME TO circuito3gen_playoffs;
ALTER TABLE public.circuitooka_configuracion RENAME TO circuito3gen_configuracion;

-- =====================================================
-- NOTA: Los índices, constraints y foreign keys se renombrarán
-- automáticamente con las tablas. Sin embargo, si hay índices
-- o constraints con nombres explícitos que referencien "circuitooka",
-- deberán actualizarse manualmente.
-- =====================================================

-- Verificar que las tablas se hayan renombrado correctamente
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'circuito3gen_%'
-- ORDER BY table_name;

