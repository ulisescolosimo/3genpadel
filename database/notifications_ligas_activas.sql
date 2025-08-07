-- Función para crear notificaciones masivas solo para usuarios inscritos en ligas activas
CREATE OR REPLACE FUNCTION crear_notificacion_masiva_ligas_activas(
  p_titulo TEXT,
  p_mensaje TEXT,
  p_tipo TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_usuario_id UUID;
BEGIN
  -- Obtener usuarios únicos inscritos en ligas activas
  FOR v_usuario_id IN
    SELECT DISTINCT u.id
    FROM usuarios u
    INNER JOIN ligainscripciones li ON (
      u.id = li.titular_1_id OR 
      u.id = li.titular_2_id OR 
      u.id = li.suplente_1_id OR 
      u.id = li.suplente_2_id
    )
    INNER JOIN liga_categorias lc ON li.liga_categoria_id = lc.id
    INNER JOIN ligas l ON lc.liga_id = l.id
    WHERE l.estado = 'abierta'
      AND li.estado IN ('aprobada', 'pendiente')
      AND u.rol != 'admin'
  LOOP
    -- Crear notificación para cada usuario
    INSERT INTO notificaciones (
      usuario_id,
      titulo,
      mensaje,
      tipo,
      leida,
      created_at,
      updated_at
    ) VALUES (
      v_usuario_id,
      p_titulo,
      p_mensaje,
      p_tipo,
      FALSE,
      NOW(),
      NOW()
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION crear_notificacion_masiva_ligas_activas IS 
'Crea notificaciones masivas solo para usuarios inscritos en ligas activas (estado = abierta)';
