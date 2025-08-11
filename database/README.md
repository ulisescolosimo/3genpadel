# Database Migrations

This directory contains SQL migration files for the Padel Final application database.

## Current Migrations

### 1. Add jugadores_ganadores column to liga_partidos table

**File**: `add_jugadores_ganadores_column.sql`

**Purpose**: Adds the missing `jugadores_ganadores` column to the `liga_partidos` table to fix the PGRST204 error.

**What it does**:
- Adds a `jugadores_ganadores` column as a UUID array
- Sets default value to empty array
- Creates a GIN index for better query performance
- Adds a constraint to ensure max 2 players per match (doubles)
- Updates existing records to have empty arrays instead of NULL

**Error it fixes**:
```
{
    "code": "PGRST204",
    "details": null,
    "hint": null,
    "message": "Could not find the 'jugadores_ganadores' column of 'liga_partidos' in the schema cache"
}
```

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Click "Run" to execute the migration

### Option 2: Using psql command line

```bash
psql -h your-host -U your-user -d your-database -f add_jugadores_ganadores_column.sql
```

### Option 3: Using Supabase CLI

```bash
supabase db push
```

## Verification

After applying the migration, you can verify it worked by:

1. Checking the table structure in Supabase Dashboard
2. Running a test query to see if the column exists
3. Testing the admin partidos functionality

## Rollback

If you need to rollback this migration:

```sql
-- Remove the constraint
ALTER TABLE liga_partidos DROP CONSTRAINT IF EXISTS check_jugadores_ganadores_length;

-- Remove the index
DROP INDEX IF EXISTS idx_liga_partidos_jugadores_ganadores;

-- Remove the column
ALTER TABLE liga_partidos DROP COLUMN IF EXISTS jugadores_ganadores;
```

## Notes

- This migration is safe to run on production databases
- It will not affect existing data
- The new column will be populated with empty arrays for existing records
- Make sure to test the functionality after applying the migration
