-- Crear tabla LigaInscripciones
CREATE TABLE IF NOT EXISTS LigaInscripciones (
    id SERIAL PRIMARY KEY,
    -- Información del equipo
    titular_1_nombre VARCHAR(100) NOT NULL,
    titular_1_apellido VARCHAR(100) NOT NULL,
    titular_2_nombre VARCHAR(100) NOT NULL,
    titular_2_apellido VARCHAR(100) NOT NULL,
    suplente_1_nombre VARCHAR(100) NOT NULL,
    suplente_1_apellido VARCHAR(100) NOT NULL,
    suplente_2_nombre VARCHAR(100) NOT NULL,
    suplente_2_apellido VARCHAR(100) NOT NULL,
    
    -- Información de la liga
    categoria VARCHAR(10) NOT NULL CHECK (categoria IN ('C6', 'C7', 'C8')),
    contacto_celular VARCHAR(20) NOT NULL,
    
    -- Archivo de comprobante
    comprobante_url TEXT,
    comprobante_filename VARCHAR(255),
    
    -- Aclaraciones adicionales
    aclaraciones TEXT,
    
    -- Estado de la inscripción
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    
    -- Información de la liga específica
    liga_nombre VARCHAR(100) DEFAULT 'Ligas Agosto 2025',
    liga_fecha_inicio DATE DEFAULT '2025-08-02',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_liga_inscripciones_updated_at
    BEFORE UPDATE ON LigaInscripciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_liga_inscripciones_categoria ON LigaInscripciones(categoria);
CREATE INDEX idx_liga_inscripciones_estado ON LigaInscripciones(estado);
CREATE INDEX idx_liga_inscripciones_created_at ON LigaInscripciones(created_at); 