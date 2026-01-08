-- =====================================================
-- CORREGIR FOREIGN KEYS DE CIRCUITO3GEN_PARTIDOS
-- =====================================================
-- Este script renombra las foreign keys de la tabla circuito3gen_partidos
-- para que coincidan con los nombres esperados por el API

-- Verificar y renombrar foreign keys si existen con nombres antiguos
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- Renombrar foreign key de jugador_a1_id
    FOR fk_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'circuito3gen_partidos'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%jugador_a1%'
    LOOP
        IF fk_record.constraint_name != 'circuito3gen_partidos_jugador_a1_id_fkey' THEN
            EXECUTE format('ALTER TABLE circuito3gen_partidos RENAME CONSTRAINT %I TO circuito3gen_partidos_jugador_a1_id_fkey', fk_record.constraint_name);
        END IF;
    END LOOP;

    -- Renombrar foreign key de jugador_a2_id
    FOR fk_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'circuito3gen_partidos'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%jugador_a2%'
    LOOP
        IF fk_record.constraint_name != 'circuito3gen_partidos_jugador_a2_id_fkey' THEN
            EXECUTE format('ALTER TABLE circuito3gen_partidos RENAME CONSTRAINT %I TO circuito3gen_partidos_jugador_a2_id_fkey', fk_record.constraint_name);
        END IF;
    END LOOP;

    -- Renombrar foreign key de jugador_b1_id
    FOR fk_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'circuito3gen_partidos'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%jugador_b1%'
    LOOP
        IF fk_record.constraint_name != 'circuito3gen_partidos_jugador_b1_id_fkey' THEN
            EXECUTE format('ALTER TABLE circuito3gen_partidos RENAME CONSTRAINT %I TO circuito3gen_partidos_jugador_b1_id_fkey', fk_record.constraint_name);
        END IF;
    END LOOP;

    -- Renombrar foreign key de jugador_b2_id
    FOR fk_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'circuito3gen_partidos'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%jugador_b2%'
    LOOP
        IF fk_record.constraint_name != 'circuito3gen_partidos_jugador_b2_id_fkey' THEN
            EXECUTE format('ALTER TABLE circuito3gen_partidos RENAME CONSTRAINT %I TO circuito3gen_partidos_jugador_b2_id_fkey', fk_record.constraint_name);
        END IF;
    END LOOP;
END $$;

-- Verificar que las foreign keys existen, si no, crearlas
DO $$
BEGIN
    -- Verificar y crear jugador_a1_id_fkey si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'circuito3gen_partidos_jugador_a1_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE circuito3gen_partidos
        ADD CONSTRAINT circuito3gen_partidos_jugador_a1_id_fkey
        FOREIGN KEY (jugador_a1_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;

    -- Verificar y crear jugador_a2_id_fkey si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'circuito3gen_partidos_jugador_a2_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE circuito3gen_partidos
        ADD CONSTRAINT circuito3gen_partidos_jugador_a2_id_fkey
        FOREIGN KEY (jugador_a2_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;

    -- Verificar y crear jugador_b1_id_fkey si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'circuito3gen_partidos_jugador_b1_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE circuito3gen_partidos
        ADD CONSTRAINT circuito3gen_partidos_jugador_b1_id_fkey
        FOREIGN KEY (jugador_b1_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;

    -- Verificar y crear jugador_b2_id_fkey si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'circuito3gen_partidos_jugador_b2_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE circuito3gen_partidos
        ADD CONSTRAINT circuito3gen_partidos_jugador_b2_id_fkey
        FOREIGN KEY (jugador_b2_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Verificar las foreign keys creadas
SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND table_name = 'circuito3gen_partidos'
AND constraint_name LIKE '%jugador%'
ORDER BY constraint_name;

