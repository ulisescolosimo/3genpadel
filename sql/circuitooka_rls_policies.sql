-- =====================================================
-- CIRCUITOOKA 3GEN 2026 - POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Fase 1.3: Políticas de Seguridad
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE circuitooka_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_parejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_confirmaciones_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_reemplazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_ascensos_descensos ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_playoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuitooka_configuracion ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1.3.1 - 1.3.3: POLÍTICAS GENERALES
-- =====================================================

-- Función auxiliar para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM usuarios
        WHERE id = auth.uid()
        AND rol = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- circuitooka_etapas
-- =====================================================

-- Lectura pública de etapas
CREATE POLICY "Etapas: lectura pública"
    ON circuitooka_etapas
    FOR SELECT
    USING (true);

-- Escritura solo para admin
CREATE POLICY "Etapas: escritura admin"
    ON circuitooka_etapas
    FOR ALL
    USING (es_admin());

-- =====================================================
-- circuitooka_divisiones
-- =====================================================

-- Lectura pública de divisiones
CREATE POLICY "Divisiones: lectura pública"
    ON circuitooka_divisiones
    FOR SELECT
    USING (true);

-- Escritura solo para admin
CREATE POLICY "Divisiones: escritura admin"
    ON circuitooka_divisiones
    FOR ALL
    USING (es_admin());

-- =====================================================
-- circuitooka_inscripciones
-- =====================================================

-- Lectura pública de inscripciones activas (para rankings públicos)
CREATE POLICY "Inscripciones: lectura pública activas"
    ON circuitooka_inscripciones
    FOR SELECT
    USING (estado = 'activa');

-- Usuarios pueden ver sus propias inscripciones
CREATE POLICY "Inscripciones: ver propias"
    ON circuitooka_inscripciones
    FOR SELECT
    USING (usuario_id = auth.uid() OR es_admin());

-- Usuarios pueden crear sus propias inscripciones
CREATE POLICY "Inscripciones: crear propias"
    ON circuitooka_inscripciones
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid() OR es_admin());

-- Usuarios pueden actualizar sus propias inscripciones (solo estado)
CREATE POLICY "Inscripciones: actualizar propias"
    ON circuitooka_inscripciones
    FOR UPDATE
    USING (usuario_id = auth.uid() OR es_admin());

-- Admin puede eliminar inscripciones
CREATE POLICY "Inscripciones: eliminar admin"
    ON circuitooka_inscripciones
    FOR DELETE
    USING (es_admin());

-- =====================================================
-- circuitooka_partidos
-- =====================================================

-- Lectura pública de partidos jugados (para rankings públicos)
CREATE POLICY "Partidos: lectura pública jugados"
    ON circuitooka_partidos
    FOR SELECT
    USING (estado = 'jugado');

-- Lectura: usuarios pueden ver partidos donde participan o todos si son admin
CREATE POLICY "Partidos: ver propios o todos (admin)"
    ON circuitooka_partidos
    FOR SELECT
    USING (
        jugador_a1_id = auth.uid() OR
        jugador_a2_id = auth.uid() OR
        jugador_b1_id = auth.uid() OR
        jugador_b2_id = auth.uid() OR
        es_admin()
    );

-- Crear partidos solo admin
CREATE POLICY "Partidos: crear admin"
    ON circuitooka_partidos
    FOR INSERT
    WITH CHECK (es_admin());

-- Actualizar partidos: jugadores pueden actualizar confirmaciones, admin todo
CREATE POLICY "Partidos: actualizar admin"
    ON circuitooka_partidos
    FOR UPDATE
    USING (es_admin());

-- Eliminar partidos solo admin
CREATE POLICY "Partidos: eliminar admin"
    ON circuitooka_partidos
    FOR DELETE
    USING (es_admin());

-- =====================================================
-- circuitooka_parejas
-- =====================================================

-- Usuarios pueden ver parejas donde participan
CREATE POLICY "Parejas: ver propias"
    ON circuitooka_parejas
    FOR SELECT
    USING (
        jugador_1_id = auth.uid() OR
        jugador_2_id = auth.uid() OR
        es_admin()
    );

-- Usuarios pueden crear parejas donde participan
CREATE POLICY "Parejas: crear propias"
    ON circuitooka_parejas
    FOR INSERT
    WITH CHECK (
        (jugador_1_id = auth.uid() OR jugador_2_id = auth.uid()) OR
        es_admin()
    );

-- Usuarios pueden actualizar sus propias parejas
CREATE POLICY "Parejas: actualizar propias"
    ON circuitooka_parejas
    FOR UPDATE
    USING (
        (jugador_1_id = auth.uid() OR jugador_2_id = auth.uid()) OR
        es_admin()
    );

-- Usuarios pueden eliminar sus propias parejas
CREATE POLICY "Parejas: eliminar propias"
    ON circuitooka_parejas
    FOR DELETE
    USING (
        (jugador_1_id = auth.uid() OR jugador_2_id = auth.uid()) OR
        es_admin()
    );

-- =====================================================
-- circuitooka_rankings
-- =====================================================

-- 1.3.4: Rankings: lectura pública, escritura solo admin
CREATE POLICY "Rankings: lectura pública"
    ON circuitooka_rankings
    FOR SELECT
    USING (true);

-- Escritura solo admin
CREATE POLICY "Rankings: escritura admin"
    ON circuitooka_rankings
    FOR ALL
    USING (es_admin())
    WITH CHECK (es_admin());

-- =====================================================
-- circuitooka_confirmaciones_partido
-- =====================================================

-- Usuarios pueden ver sus propias confirmaciones
CREATE POLICY "Confirmaciones: ver propias"
    ON circuitooka_confirmaciones_partido
    FOR SELECT
    USING (usuario_id = auth.uid() OR es_admin());

-- Usuarios pueden crear sus propias confirmaciones
CREATE POLICY "Confirmaciones: crear propias"
    ON circuitooka_confirmaciones_partido
    FOR INSERT
    WITH CHECK (usuario_id = auth.uid() OR es_admin());

-- Usuarios pueden actualizar sus propias confirmaciones
CREATE POLICY "Confirmaciones: actualizar propias"
    ON circuitooka_confirmaciones_partido
    FOR UPDATE
    USING (usuario_id = auth.uid() OR es_admin());

-- =====================================================
-- circuitooka_reemplazos
-- =====================================================

-- Usuarios pueden ver reemplazos donde participan
CREATE POLICY "Reemplazos: ver relacionados"
    ON circuitooka_reemplazos
    FOR SELECT
    USING (
        jugador_original_id = auth.uid() OR
        jugador_reemplazo_id = auth.uid() OR
        es_admin()
    );

-- Crear reemplazos: jugador original o admin
CREATE POLICY "Reemplazos: crear relacionados"
    ON circuitooka_reemplazos
    FOR INSERT
    WITH CHECK (
        jugador_original_id = auth.uid() OR
        es_admin()
    );

-- Actualizar reemplazos solo admin
CREATE POLICY "Reemplazos: actualizar admin"
    ON circuitooka_reemplazos
    FOR UPDATE
    USING (es_admin());

-- Eliminar reemplazos solo admin
CREATE POLICY "Reemplazos: eliminar admin"
    ON circuitooka_reemplazos
    FOR DELETE
    USING (es_admin());

-- =====================================================
-- circuitooka_ascensos_descensos
-- =====================================================

-- Usuarios pueden ver sus propios ascensos/descensos
CREATE POLICY "Ascensos: ver propios"
    ON circuitooka_ascensos_descensos
    FOR SELECT
    USING (usuario_id = auth.uid() OR es_admin());

-- Escritura solo admin
CREATE POLICY "Ascensos: escritura admin"
    ON circuitooka_ascensos_descensos
    FOR ALL
    USING (es_admin())
    WITH CHECK (es_admin());

-- =====================================================
-- circuitooka_playoffs
-- =====================================================

-- Lectura: usuarios pueden ver playoffs donde participan
CREATE POLICY "Playoffs: ver relacionados"
    ON circuitooka_playoffs
    FOR SELECT
    USING (
        jugador_1_superior_id = auth.uid() OR
        jugador_2_superior_id = auth.uid() OR
        jugador_1_inferior_id = auth.uid() OR
        jugador_2_inferior_id = auth.uid() OR
        es_admin()
    );

-- Escritura solo admin
CREATE POLICY "Playoffs: escritura admin"
    ON circuitooka_playoffs
    FOR ALL
    USING (es_admin())
    WITH CHECK (es_admin());

-- =====================================================
-- circuitooka_configuracion
-- =====================================================

-- Lectura pública de configuración
CREATE POLICY "Configuracion: lectura pública"
    ON circuitooka_configuracion
    FOR SELECT
    USING (true);

-- Escritura solo admin
CREATE POLICY "Configuracion: escritura admin"
    ON circuitooka_configuracion
    FOR ALL
    USING (es_admin())
    WITH CHECK (es_admin());

-- =====================================================
-- FIN DE POLÍTICAS RLS
-- =====================================================

