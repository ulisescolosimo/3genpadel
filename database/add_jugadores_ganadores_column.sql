-- Migration: Add jugadores_ganadores column to liga_partidos table
-- This column stores an array of player IDs who won the match

-- Add the jugadores_ganadores column as an array of UUIDs
ALTER TABLE liga_partidos 
ADD COLUMN jugadores_ganadores UUID[] DEFAULT NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN liga_partidos.jugadores_ganadores IS 
'Array of player IDs who won the match. Used to track individual player victories for ranking purposes.';

-- Create an index on the array column for better query performance
CREATE INDEX idx_liga_partidos_jugadores_ganadores 
ON liga_partidos USING GIN (jugadores_ganadores);

-- Update existing records to have empty array instead of NULL
UPDATE liga_partidos 
SET jugadores_ganadores = '{}'::UUID[] 
WHERE jugadores_ganadores IS NULL;

-- Make the column NOT NULL with default empty array
ALTER TABLE liga_partidos 
ALTER COLUMN jugadores_ganadores SET NOT NULL,
ALTER COLUMN jugadores_ganadores SET DEFAULT '{}'::UUID[];

-- Add a check constraint to ensure the array has at most 2 elements (for doubles matches)
ALTER TABLE liga_partidos 
ADD CONSTRAINT check_jugadores_ganadores_length 
CHECK (array_length(jugadores_ganadores, 1) <= 2);
