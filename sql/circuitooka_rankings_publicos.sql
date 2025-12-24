-- =====================================================
-- POLÍTICAS PARA RANKINGS PÚBLICOS
-- Permite acceso público a datos necesarios para calcular rankings
-- =====================================================

-- =====================================================
-- circuitooka_inscripciones
-- =====================================================

-- Lectura pública de inscripciones activas (necesarias para rankings públicos)
CREATE POLICY "Inscripciones: lectura pública activas"
    ON circuitooka_inscripciones
    FOR SELECT
    USING (estado = 'activa');

-- =====================================================
-- circuitooka_partidos
-- =====================================================

-- Lectura pública de partidos jugados (necesarios para rankings públicos)
CREATE POLICY "Partidos: lectura pública jugados"
    ON circuitooka_partidos
    FOR SELECT
    USING (estado = 'jugado');

-- =====================================================
-- NOTA: Estas políticas se agregan a las existentes
-- Las políticas existentes siguen funcionando, estas son adicionales
-- =====================================================




