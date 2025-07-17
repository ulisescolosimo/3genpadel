-- Datos de ejemplo para el sistema de ligas
-- Ejecutar después de crear las tablas

-- Insertar ligas de ejemplo
INSERT INTO public.ligas (nombre, fecha_inicio, estado, descripcion, formato, horarios, costo_inscripcion, costo_partido, cronograma, importante) VALUES
(
  'Ligas Agosto 2025',
  '2025-08-02',
  'abierta',
  'Ligas competitivas de agosto 2025 con formato de clasificación y eliminatorias',
  '2 partidos de clasificación + Llave eliminatoria',
  'Sábados o Domingos desde las 20hs',
  20000,
  12000,
  '• 02/08 o 03/08 - Primer partido de Clasificación
• 09/08 o 10/08 - Segundo partido de Clasificación
• 16/08 o 17/08 - Octavos de Final
• 23/08 o 25/08 - Cuartos de Final
• 30/08 o 31/08 - Semifinales
• 06/09 - Finales',
  '• No se puede elegir día de juego
• No se permiten postergaciones
• No hay partidos durante la semana
• Ganadores de categorías 2025 solo pueden anotarse en superior'
),
(
  'Ligas Septiembre 2025',
  '2025-09-06',
  'abierta',
  'Ligas de septiembre 2025 con formato de liga regular',
  'Liga regular con 8 fechas + Playoffs',
  'Sábados desde las 19hs',
  25000,
  15000,
  '• 06/09 - Fecha 1
• 13/09 - Fecha 2
• 20/09 - Fecha 3
• 27/09 - Fecha 4
• 04/10 - Fecha 5
• 11/10 - Fecha 6
• 18/10 - Fecha 7
• 25/10 - Fecha 8
• 01/11 - Playoffs',
  '• Se juega todos los sábados
• Se permiten hasta 2 postergaciones por equipo
• Los playoffs son eliminatorios'
),
(
  'Liga Principiantes Octubre',
  '2025-10-04',
  'abierta',
  'Liga especial para jugadores que están comenzando en el padel',
  'Liga regular con entrenamiento incluido',
  'Domingos desde las 16hs',
  15000,
  8000,
  '• 04/10 - Fecha 1 + Entrenamiento
• 11/10 - Fecha 2 + Entrenamiento
• 18/10 - Fecha 3 + Entrenamiento
• 25/10 - Fecha 4 + Entrenamiento
• 01/11 - Torneo Final',
  '• Incluye 1 hora de entrenamiento por fecha
• Nivel básico requerido
• Se permite hasta 3 postergaciones'
);

-- Insertar categorías para las ligas
INSERT INTO public.liga_categorias (liga_id, categoria, max_inscripciones) VALUES
-- Categorías para Liga Agosto 2025
(1, 'C6', 16),
(1, 'C7', 16),
(1, 'C8', 16),

-- Categorías para Liga Septiembre 2025
(2, 'C5', 12),
(2, 'C6', 12),
(2, 'C7', 12),
(2, 'C8', 12),

-- Categorías para Liga Principiantes
(3, 'C8', 8),
(3, 'C9', 8);

-- Insertar algunas inscripciones de ejemplo (opcional)
INSERT INTO public.ligainscripciones (
  liga_categoria_id,
  titular_1_nombre,
  titular_1_apellido,
  titular_2_nombre,
  titular_2_apellido,
  suplente_1_nombre,
  suplente_1_apellido,
  suplente_2_nombre,
  suplente_2_apellido,
  contacto_celular,
  comprobante_url,
  comprobante_filename,
  aclaraciones,
  estado
) VALUES
(
  1, -- C6 de Liga Agosto
  'Juan',
  'Pérez',
  'Carlos',
  'González',
  'Miguel',
  'Rodríguez',
  'Luis',
  'Martínez',
  '+54 9 11 1234-5678',
  'https://example.com/comprobante1.pdf',
  'comprobante1.pdf',
  'Equipo experimentado, buscamos competir en alto nivel',
  'aprobada'
),
(
  1, -- C6 de Liga Agosto (otra inscripción)
  'Ana',
  'López',
  'María',
  'Fernández',
  'Carmen',
  'García',
  'Isabel',
  'Moreno',
  '+54 9 11 2345-6789',
  'https://example.com/comprobante2.pdf',
  'comprobante2.pdf',
  'Primera vez en ligas, muy emocionadas',
  'pendiente'
),
(
  2, -- C7 de Liga Agosto
  'Roberto',
  'Silva',
  'Diego',
  'Torres',
  'Andrés',
  'Vargas',
  'Felipe',
  'Castro',
  '+54 9 11 3456-7890',
  'https://example.com/comprobante3.pdf',
  'comprobante3.pdf',
  'Equipo consolidado, objetivo: llegar a finales',
  'aprobada'
); 