-- Crear tabla Jugador
CREATE TABLE IF NOT EXISTS Jugador (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    foto TEXT,
    fecha_nacimiento DATE,
    nivel VARCHAR(50),
    ranking_puntos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla Torneo
CREATE TABLE IF NOT EXISTS Torneo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    ubicacion VARCHAR(150),
    categoria VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'abierto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla Inscripcion
CREATE TABLE IF NOT EXISTS Inscripcion (
    id SERIAL PRIMARY KEY,
    jugador_id INTEGER REFERENCES Jugador(id) ON DELETE CASCADE,
    torneo_id INTEGER REFERENCES Torneo(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_pago VARCHAR(50) DEFAULT 'pendiente',
    mercadopago_preference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jugador_id, torneo_id)
);

-- Crear tabla Partido
CREATE TABLE IF NOT EXISTS Partido (
    id SERIAL PRIMARY KEY,
    torneo_id INTEGER REFERENCES Torneo(id) ON DELETE CASCADE,
    jugador1_id INTEGER REFERENCES Jugador(id) ON DELETE SET NULL,
    jugador2_id INTEGER REFERENCES Jugador(id) ON DELETE SET NULL,
    ganador_id INTEGER REFERENCES Jugador(id) ON DELETE SET NULL,
    fecha_partido TIMESTAMP,
    resultado VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla RankingHistorico
CREATE TABLE IF NOT EXISTS RankingHistorico (
    id SERIAL PRIMARY KEY,
    jugador_id INTEGER REFERENCES Jugador(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    puntos INTEGER,
    posicion INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla Interaccion
CREATE TABLE IF NOT EXISTS Interaccion (
    id SERIAL PRIMARY KEY,
    de_jugador_id INTEGER REFERENCES Jugador(id) ON DELETE CASCADE,
    para_jugador_id INTEGER REFERENCES Jugador(id) ON DELETE CASCADE,
    tipo VARCHAR(50),
    contenido TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_jugador_updated_at
    BEFORE UPDATE ON Jugador
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_torneo_updated_at
    BEFORE UPDATE ON Torneo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inscripcion_updated_at
    BEFORE UPDATE ON Inscripcion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partido_updated_at
    BEFORE UPDATE ON Partido
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ranking_historico_updated_at
    BEFORE UPDATE ON RankingHistorico
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interaccion_updated_at
    BEFORE UPDATE ON Interaccion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 