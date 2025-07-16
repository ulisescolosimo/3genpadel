# Sistema de Inscripciones - Ligas Agosto 2025

## Descripción

Este sistema permite gestionar las inscripciones para las Ligas de Padel de Agosto 2025. Incluye un formulario público para que los equipos se inscriban y un panel de administración para gestionar las inscripciones.

## Características

### Formulario de Inscripción Público
- Información completa de la liga (fechas, costos, cronograma)
- Formulario con todos los campos requeridos:
  - 2 titulares (nombre y apellido)
  - 2 suplentes obligatorios (nombre y apellido)
  - Categoría (C6, C7, C8)
  - Contacto/celular
  - Comprobante de pago (archivo)
  - Aclaraciones opcionales
- Validación de campos requeridos
- Subida de archivos (hasta 1GB)
- Notificaciones de éxito/error

### Panel de Administración
- Vista de todas las inscripciones
- Filtros por categoría y estado
- Búsqueda por nombre o teléfono
- Estadísticas en tiempo real
- Gestión de estados (pendiente, aprobada, rechazada)
- Descarga de comprobantes
- Interfaz responsive y moderna

## Configuración

### 1. Base de Datos (Supabase)

Ejecutar las migraciones para crear las tablas necesarias:

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Iniciar sesión en Supabase
supabase login

# Vincular el proyecto
supabase link --project-ref TU_PROJECT_REF

# Ejecutar las migraciones
npm run db:push
```

### 2. Bucket de Almacenamiento

El sistema crea automáticamente un bucket llamado `liga-inscripciones` para almacenar los comprobantes de pago. Las políticas de seguridad están configuradas para:

- Permitir subida de archivos autenticados
- Permitir lectura pública de archivos
- Restringir actualización/eliminación a propietarios

### 3. Variables de Entorno

Asegúrate de tener configuradas las variables de entorno de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Estructura de Archivos

```
├── app/
│   ├── inscripciones/
│   │   ├── ligas/
│   │   │   ├── page.jsx (página principal de ligas)
│   │   │   └── agosto-2025/
│   │   │       └── page.jsx (formulario de inscripción)
│   │   └── page.jsx (página principal de inscripciones)
│   └── admin/
│       └── inscripciones-ligas/
│           └── page.jsx (panel de administración)
├── components/
│   └── AdminSidebar.jsx (sidebar actualizado con nuevo enlace)
├── supabase/
│   └── migrations/
│       ├── 20241201000000_create_liga_inscripciones.sql
│       └── 20241201000001_create_storage_bucket.sql
└── lib/
    └── supabase.js (configuración de Supabase)
```

## Uso

### Para Usuarios Públicos

1. Navegar a `/inscripciones/ligas`
2. Hacer clic en "Inscribirse" en la liga "Ligas Agosto 2025"
3. Completar el formulario con toda la información requerida
4. Subir el comprobante de pago
5. Enviar la inscripción

### Para Administradores

1. Acceder al panel de administración (`/admin`)
2. Navegar a "Inscripciones Ligas"
3. Ver todas las inscripciones con filtros y búsqueda
4. Revisar comprobantes de pago
5. Aprobar o rechazar inscripciones
6. Descargar archivos cuando sea necesario

## Información de la Liga

### Detalles de la Liga
- **Inicio**: 02 de Agosto 2025
- **Formato**: 2 partidos de clasificación + Llave eliminatoria
- **Periodicidad**: 1 partido por fin de semana
- **Horarios**: Sábados o Domingos desde las 20hs
- **Score**: Partidos al mejor de 3 sets con punto de oro
- **Costos**: 
  - Inscripción: $20.000 por equipo
  - Partido: $12.000 por jugador
- **Equipo**: 2 titulares + 1 suplente (obligatorio) + 2do suplente (obligatorio)
- **Premios**: Trofeo + Indumentaria o Vouchers para Paletas

### Cronograma Tentativo
- 02/08 o 03/08 - Primer partido de Clasificación
- 09/08 o 10/08 - Segundo partido de Clasificación
- 16/08 o 17/08 - Octavos de Final
- 23/08 o 25/08 - Cuartos de Final
- 30/08 o 31/08 - Semifinales
- 06/09 - Finales

### Reglas Importantes
- NO se puede elegir día de juego
- No se permiten postergaciones
- No hay partidos durante la semana
- Ganadores de categorías 2025 solo pueden anotarse en superior
- Ganadores de años anteriores pueden repetir

## Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **UI Components**: Radix UI, Lucide React
- **Formularios**: React Hook Form (implícito en los componentes)
- **Notificaciones**: React Hot Toast

## Mantenimiento

### Actualizar Información de la Liga

Para actualizar la información de la liga, editar el archivo:
`app/inscripciones/ligas/agosto-2025/page.jsx`

### Agregar Nuevas Ligas

1. Crear nueva migración en `supabase/migrations/`
2. Crear nueva página en `app/inscripciones/ligas/[nueva-liga]/`
3. Actualizar la lista de ligas en `app/inscripciones/ligas/page.jsx`

### Backup de Datos

Los datos se almacenan en Supabase y se pueden exportar usando:

```bash
supabase db dump --data-only
```

## Soporte

Para problemas técnicos o consultas sobre el sistema, contactar al equipo de desarrollo.

---

**Nota**: Este sistema está diseñado específicamente para las Ligas de Agosto 2025. Para futuras ligas, se recomienda crear una versión más genérica del sistema. 