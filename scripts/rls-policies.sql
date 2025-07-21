-- Políticas RLS para la tabla usuarios
-- Permitir que los usuarios actualicen su propio perfil

-- Política para permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile" ON usuarios
FOR SELECT USING (auth.uid() = id::uuid);

-- Política para permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON usuarios
FOR UPDATE USING (auth.uid() = id::uuid);

-- Política para permitir que los usuarios inserten su propio perfil (si no existe)
CREATE POLICY "Users can insert own profile" ON usuarios
FOR INSERT WITH CHECK (auth.uid() = id::uuid);

-- Política para permitir que los administradores vean todos los perfiles
CREATE POLICY "Admins can view all profiles" ON usuarios
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id::uuid = auth.uid() AND rol = 'admin'
  )
);

-- Política para permitir que los administradores actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles" ON usuarios
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id::uuid = auth.uid() AND rol = 'admin'
  )
);

-- Política para permitir que los administradores inserten perfiles
CREATE POLICY "Admins can insert profiles" ON usuarios
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id::uuid = auth.uid() AND rol = 'admin'
  )
);

-- Habilitar RLS en la tabla usuarios si no está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY; 