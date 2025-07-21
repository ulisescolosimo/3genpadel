-- Script de migración para consolidar las tablas jugador y usuarios
-- Ejecutar en orden para evitar errores de dependencias

-- 1. Agregar campos faltantes a la tabla usuarios
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS ranking_puntos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS cuenta_activada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dni integer,
ADD COLUMN IF NOT EXISTS foto text,
ADD COLUMN IF NOT EXISTS password text;

-- 2. Migrar datos de jugador a usuarios
-- Primero, actualizar usuarios existentes que ya tienen jugador_id
UPDATE public.usuarios 
SET 
  ranking_puntos = j.ranking_puntos,
  cuenta_activada = j.cuenta_activada,
  dni = j.dni,
  foto = j.foto,
  password = j.password,
  nombre = COALESCE(usuarios.nombre, j.nombre),
  apellido = COALESCE(usuarios.apellido, j.apellido),
  telefono = COALESCE(usuarios.telefono, j.telefono),
  nivel = COALESCE(usuarios.nivel, j.nivel),
  fecha_nacimiento = COALESCE(usuarios.fecha_nacimiento, j.fecha_nacimiento)
FROM public.jugador j
WHERE usuarios.jugador_id = j.id;

-- 3. Insertar jugadores que no tienen usuario correspondiente
INSERT INTO public.usuarios (
  id,
  email,
  nombre,
  apellido,
  telefono,
  nivel,
  fecha_nacimiento,
  ranking_puntos,
  cuenta_activada,
  dni,
  foto,
  password,
  rol,
  created_at,
  updated_at
)
SELECT 
  j.auth_id,
  j.email,
  j.nombre,
  j.apellido,
  j.telefono,
  j.nivel,
  j.fecha_nacimiento,
  j.ranking_puntos,
  j.cuenta_activada,
  j.dni,
  j.foto,
  j.password,
  'user',
  j.created_at,
  j.updated_at
FROM public.jugador j
WHERE j.auth_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.usuarios u WHERE u.id = j.auth_id
);

-- 4. Crear tabla temporal para mapear IDs de jugador a usuarios
CREATE TEMP TABLE jugador_to_usuario_mapping AS
SELECT 
  j.id as jugador_id,
  u.id as usuario_id
FROM public.jugador j
LEFT JOIN public.usuarios u ON u.email = j.email
WHERE u.id IS NOT NULL;

-- 5. Actualizar las foreign keys en ligainscripciones
-- Primero agregar las nuevas columnas
ALTER TABLE public.ligainscripciones 
ADD COLUMN titular_1_usuario_id uuid,
ADD COLUMN titular_2_usuario_id uuid,
ADD COLUMN suplente_1_usuario_id uuid,
ADD COLUMN suplente_2_usuario_id uuid;

-- Actualizar con los nuevos IDs de usuario
UPDATE public.ligainscripciones 
SET 
  titular_1_usuario_id = m.usuario_id
FROM jugador_to_usuario_mapping m
WHERE ligainscripciones.titular_1_id = m.jugador_id;

UPDATE public.ligainscripciones 
SET 
  titular_2_usuario_id = m.usuario_id
FROM jugador_to_usuario_mapping m
WHERE ligainscripciones.titular_2_id = m.jugador_id;

UPDATE public.ligainscripciones 
SET 
  suplente_1_usuario_id = m.usuario_id
FROM jugador_to_usuario_mapping m
WHERE ligainscripciones.suplente_1_id = m.jugador_id;

UPDATE public.ligainscripciones 
SET 
  suplente_2_usuario_id = m.usuario_id
FROM jugador_to_usuario_mapping m
WHERE ligainscripciones.suplente_2_id = m.jugador_id;

-- 6. Eliminar las columnas antiguas de ligainscripciones
ALTER TABLE public.ligainscripciones 
DROP COLUMN titular_1_id,
DROP COLUMN titular_2_id,
DROP COLUMN suplente_1_id,
DROP COLUMN suplente_2_id;

-- 7. Renombrar las nuevas columnas
ALTER TABLE public.ligainscripciones 
RENAME COLUMN titular_1_usuario_id TO titular_1_id;

ALTER TABLE public.ligainscripciones 
RENAME COLUMN titular_2_usuario_id TO titular_2_id;

ALTER TABLE public.ligainscripciones 
RENAME COLUMN suplente_1_usuario_id TO suplente_1_id;

ALTER TABLE public.ligainscripciones 
RENAME COLUMN suplente_2_usuario_id TO suplente_2_id;

-- 8. Agregar las nuevas foreign keys
ALTER TABLE public.ligainscripciones 
ADD CONSTRAINT ligainscripciones_titular_1_id_fkey 
FOREIGN KEY (titular_1_id) REFERENCES public.usuarios(id);

ALTER TABLE public.ligainscripciones 
ADD CONSTRAINT ligainscripciones_titular_2_id_fkey 
FOREIGN KEY (titular_2_id) REFERENCES public.usuarios(id);

ALTER TABLE public.ligainscripciones 
ADD CONSTRAINT ligainscripciones_suplente_1_id_fkey 
FOREIGN KEY (suplente_1_id) REFERENCES public.usuarios(id);

ALTER TABLE public.ligainscripciones 
ADD CONSTRAINT ligainscripciones_suplente_2_id_fkey 
FOREIGN KEY (suplente_2_id) REFERENCES public.usuarios(id);

-- 9. Eliminar la foreign key de usuarios a jugador
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_jugador_id_fkey;

ALTER TABLE public.usuarios 
DROP COLUMN jugador_id;

-- 10. Eliminar la tabla jugador
DROP TABLE public.jugador;

-- 11. Limpiar tabla temporal
DROP TABLE jugador_to_usuario_mapping;

-- Verificación final
SELECT 'Migración completada exitosamente' as status; 