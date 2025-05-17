-- Primero creamos la tabla perfiles si no existe
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL DEFAULT 'usuario',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitamos RLS (Row Level Security)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Creamos políticas de seguridad
CREATE POLICY "Los usuarios pueden ver sus propios perfiles"
    ON public.perfiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar sus propios perfiles"
    ON public.perfiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Ahora creamos el usuario en auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@ejemplo.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Finalmente creamos el perfil del administrador
INSERT INTO public.perfiles (
  id,
  nombre,
  apellidos,
  email,
  rol,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@ejemplo.com'),
  'Administrador',
  'Sistema',
  'admin@ejemplo.com',
  'admin',
  now(),
  now()
); 