-- Insert 3 sample tournaments with different capacity configurations
INSERT INTO torneo (
    nombre,
    fecha_inicio,
    fecha_fin,
    ubicacion,
    categoria,
    estado,
    cupo_maximo,
    plazas_disponibles
) VALUES 
(
    'Torneo de Invierno 2024',
    '2024-07-15',
    '2024-07-17',
    'Club de Pádel Central',
    'Mixto',
    'abierto',
    32,
    32
),
(
    'Copa Verano 2024',
    '2024-12-20',
    '2024-12-22',
    'Padel Arena Premium',
    'Masculino',
    'abierto',
    16,
    16
),
(
    'Torneo Amistoso Primavera',
    '2024-09-10',
    '2024-09-11',
    'Club Deportivo Local',
    'Femenino',
    'abierto',
    NULL,
    NULL
); 