# Sistema de Ranking de Jugadores - Padel Final

## Descripción General

El sistema de ranking de Padel Final permite gestionar los puntos de los jugadores en diferentes categorías, con soporte para perfiles vinculados a usuarios registrados y perfiles "fantasma" para jugadores sin cuenta.

## Estructura de la Base de Datos

### Tabla: `ranking_jugadores`

```sql
CREATE TABLE ranking_jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  nombre VARCHAR NOT NULL,
  apellido VARCHAR NOT NULL,
  categoria VARCHAR NOT NULL,
  puntos INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos clave:**
- `usuario_id`: ID del usuario registrado (NULL para perfiles fantasma)
- `nombre` + `apellido`: Identificación del jugador
- `categoria`: Categoría del ranking (ej: C1, C2, C3, etc.)
- `puntos`: Puntos acumulados en esa categoría

## Lógica de Asignación de Puntos

### Flujo Principal: `handleRankingProfile(jugador, puntos, categoria)`

La función sigue este orden de prioridad:

#### 1. **Verificar Perfil Vinculado Existente**
- Si el jugador tiene `usuario_id`, busca un perfil ya vinculado en la misma categoría
- Si existe, suma los puntos al perfil existente
- **Prioridad máxima**: Evita duplicados y mantiene consistencia

#### 2. **Buscar Perfil Fantasma Existente**
- Si no hay perfil vinculado, busca un perfil fantasma con el mismo nombre en la misma categoría
- Si existe, suma los puntos al perfil fantasma
- **Mantiene historial**: Conserva los puntos acumulados antes de la vinculación

#### 3. **Crear Nuevo Perfil**
- Solo si no existe ningún perfil (vinculado o fantasma) en esa categoría
- Crea un perfil nuevo con los puntos iniciales

### Ejemplo de Flujo

```
Jugador: "Juan Pérez" con usuario_id: "123"
Categoría: "C1"
Puntos a asignar: 3

1. ✅ Buscar perfil vinculado para usuario "123" en categoría "C1"
2. ❌ No existe perfil vinculado
3. ✅ Buscar perfil fantasma "Juan Pérez" en categoría "C1"
4. ❌ No existe perfil fantasma
5. ✅ Crear nuevo perfil vinculado con 3 puntos
```

## Gestión de Perfiles Fantasma

### ¿Qué son los Perfiles Fantasma?

Los perfiles fantasma son registros de jugadores que:
- No tienen `usuario_id` (no están vinculados a una cuenta)
- Acumulan puntos normalmente
- Se pueden vincular posteriormente cuando el jugador se registre

### Ventajas del Sistema

1. **Sin Pérdida de Datos**: Los puntos se mantienen aunque el jugador no tenga cuenta
2. **Vinculación Automática**: Cuando se registra, se pueden sincronizar todos sus perfiles
3. **Consistencia**: No se duplican puntos al vincular perfiles

### Sincronización Automática

#### Función: `syncGhostProfilesForNewUser(userId, nombre, apellido)`

Cuando un usuario se registra, esta función:

1. Busca todos los perfiles fantasma con su nombre
2. Los vincula automáticamente a su cuenta
3. Fusiona puntos si ya tiene perfiles vinculados en las mismas categorías
4. Elimina perfiles fantasma duplicados

#### Función: `linkGhostProfileToUser(ghostProfileId, userId)`

Vincula un perfil fantasma específico a un usuario:

1. Verifica si ya existe un perfil vinculado en la misma categoría
2. Si existe: fusiona puntos y elimina el fantasma
3. Si no existe: simplemente vincula el fantasma

## Casos de Uso Comunes

### 1. **Jugador Nuevo sin Cuenta**
```
- Se crea perfil fantasma
- Acumula puntos normalmente
- Cuando se registra, se sincroniza automáticamente
```

### 2. **Jugador con Cuenta Existente**
```
- Se busca perfil vinculado en la categoría
- Se suman puntos al perfil existente
- No se crean duplicados
```

### 3. **Cambio de Categoría**
```
- Cada categoría mantiene puntos separados
- Un jugador puede tener múltiples perfiles (uno por categoría)
- Los puntos no se transfieren entre categorías
```

### 4. **Vinculación Manual**
```
- Admin puede vincular perfiles fantasma a usuarios
- Se fusionan puntos automáticamente
- Se mantiene historial completo
```

## Funciones Disponibles

### Core Functions
- `handleRankingProfile(jugador, puntos, categoria)` - Asignar puntos
- `linkGhostProfileToUser(ghostProfileId, userId)` - Vincular fantasma
- `syncGhostProfilesForNewUser(userId, nombre, apellido)` - Sincronización automática

### Utility Functions
- `getGhostProfiles()` - Obtener todos los perfiles fantasma
- `findDuplicateProfiles()` - Detectar duplicados
- `mergeDuplicateProfiles(profiles)` - Fusionar duplicados
- `searchProfilesByName(nombre, apellido)` - Buscar por nombre

## Logs y Debugging

El sistema incluye logs detallados para debugging:

```
🔄 handleRankingProfile llamado para Juan Pérez
📊 Puntos a sumar: 3, Categoría: C1
👤 Jugador con cuenta vinculada: 123
📈 Perfil vinculado encontrado - actualizando puntos: 5 + 3 = 8
✅ Puntos actualizados en perfil vinculado: 8
```

## Consideraciones de Rendimiento

1. **Índices Recomendados**:
   ```sql
   CREATE INDEX idx_ranking_jugadores_usuario_categoria ON ranking_jugadores(usuario_id, categoria);
   CREATE INDEX idx_ranking_jugadores_nombre_apellido ON ranking_jugadores(nombre, apellido);
   CREATE INDEX idx_ranking_jugadores_categoria ON ranking_jugadores(categoria);
   ```

2. **Consultas Optimizadas**: Las búsquedas se hacen por índices específicos
3. **Transacciones**: Las operaciones críticas usan transacciones para consistencia

## Migración y Mantenimiento

### Limpieza de Duplicados
```javascript
// Detectar duplicados
const duplicates = await findDuplicateProfiles()

// Fusionar duplicados
const result = await mergeDuplicateProfiles(duplicates)
```

### Sincronización Masiva
```javascript
// Para todos los usuarios registrados
const users = await getAllUsers()
for (const user of users) {
  await syncGhostProfilesForNewUser(user.id, user.nombre, user.apellido)
}
```

## Troubleshooting

### Problema: Puntos Duplicados
**Causa**: Llamadas múltiples a `handleRankingProfile`
**Solución**: Verificar logs y asegurar que solo se llame una vez por operación

### Problema: Perfiles No Vinculados
**Causa**: Nombres diferentes entre perfil fantasma y usuario
**Solución**: Usar `searchProfilesByName` para búsquedas flexibles

### Problema: Categorías Incorrectas
**Causa**: Mismatch entre categoría de liga y categoría de ranking
**Solución**: Verificar que `getCategoriaFromPartido` retorne la categoría correcta
