-- Política RLS simple solo para permitir actualizar avatar_url
-- Esta política permite que los usuarios actualicen solo el campo avatar_url de su propio perfil

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política simple para actualizar avatar_url usando email
CREATE POLICY "Users can update avatar_url" ON usuarios
FOR UPDATE USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON usuarios
FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Política para permitir que los usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile" ON usuarios
FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email); 