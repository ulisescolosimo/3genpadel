-- Create registros_torneo table
CREATE TABLE IF NOT EXISTS registros_torneo (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  torneo_id INTEGER REFERENCES torneo(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'profesional')),
  pareja TEXT,
  comentarios TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'cancelado')),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_registro_torneo_email 
ON registros_torneo(torneo_id, email) 
WHERE estado != 'cancelado';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registros_torneo_torneo_id ON registros_torneo(torneo_id);
CREATE INDEX IF NOT EXISTS idx_registros_torneo_email ON registros_torneo(email);

-- Add RLS policies
ALTER TABLE registros_torneo ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert registrations
CREATE POLICY "Allow public insert" ON registros_torneo
  FOR INSERT TO public
  WITH CHECK (true);

-- Allow anyone to read registrations
CREATE POLICY "Allow public read" ON registros_torneo
  FOR SELECT TO public
  USING (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registros_torneo_updated_at
    BEFORE UPDATE ON registros_torneo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 