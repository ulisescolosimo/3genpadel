-- Add cupo_maximo column to torneo table
ALTER TABLE torneo
ADD COLUMN cupo_maximo INTEGER DEFAULT NULL;

-- Add plazas_disponibles column to torneo table
ALTER TABLE torneo
ADD COLUMN plazas_disponibles INTEGER DEFAULT NULL;

-- Update existing records to set plazas_disponibles equal to cupo_maximo
UPDATE torneo
SET plazas_disponibles = cupo_maximo
WHERE cupo_maximo IS NOT NULL;

-- Create a trigger to update plazas_disponibles when a new registration is made
CREATE OR REPLACE FUNCTION update_plazas_disponibles()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the tournament has a cupo_maximo
    IF EXISTS (
        SELECT 1 FROM torneo 
        WHERE id = NEW.torneo_id 
        AND cupo_maximo IS NOT NULL
    ) THEN
        UPDATE torneo
        SET plazas_disponibles = plazas_disponibles - 1
        WHERE id = NEW.torneo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update plazas_disponibles when a registration is deleted
CREATE OR REPLACE FUNCTION restore_plazas_disponibles()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the tournament has a cupo_maximo
    IF EXISTS (
        SELECT 1 FROM torneo 
        WHERE id = OLD.torneo_id 
        AND cupo_maximo IS NOT NULL
    ) THEN
        UPDATE torneo
        SET plazas_disponibles = plazas_disponibles + 1
        WHERE id = OLD.torneo_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_plazas_on_registration
AFTER INSERT ON registros_torneo
FOR EACH ROW
EXECUTE FUNCTION update_plazas_disponibles();

CREATE TRIGGER restore_plazas_on_registration_delete
AFTER DELETE ON registros_torneo
FOR EACH ROW
EXECUTE FUNCTION restore_plazas_disponibles(); 