# 🎾 PLAN DE IMPLEMENTACIÓN - CIRCUITOOKA 3GEN 2026

## 📋 ÍNDICE
1. [Fase 1: Base de Datos](#fase-1-base-de-datos)
2. [Fase 2: Backend y Lógica de Negocio](#fase-2-backend-y-lógica-de-negocio)
3. [Fase 3: Frontend Admin](#fase-3-frontend-admin)
4. [Fase 4: Frontend Usuario](#fase-4-frontend-usuario)
5. [Fase 5: Automatizaciones](#fase-5-automatizaciones)
6. [Fase 6: Testing y Ajustes](#fase-6-testing-y-ajustes)

---

## 🗄️ FASE 1: BASE DE DATOS
**Duración estimada: 1-2 semanas**

### 1.1 Diseño del Esquema de Base de Datos
- [ ] **1.1.1** Crear tabla `circuitooka_etapas`
  - Campos: id, nombre, fecha_inicio, fecha_fin, año, estado (activa/finalizada), created_at, updated_at
  - Relación: Ninguna (tabla independiente)
  
- [ ] **1.1.2** Crear tabla `circuitooka_divisiones`
  - Campos: id, numero_division (1-4), nombre, descripcion, orden, created_at
  - Relación: Ninguna (tabla de configuración)
  
- [ ] **1.1.3** Crear tabla `circuitooka_inscripciones`
  - Campos: id, etapa_id, usuario_id, division_id, fecha_inscripcion, estado (activa/pausada/finalizada), 
    division_solicitada (para casos especiales), evaluacion_organizador (boolean), created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas, usuario_id → usuarios, division_id → circuitooka_divisiones
  - Índices: etapa_id, usuario_id, division_id, estado
  
- [ ] **1.1.4** Crear tabla `circuitooka_partidos`
  - Campos: id, etapa_id, division_id, fecha_partido, jugador_a1_id, jugador_a2_id, jugador_b1_id, jugador_b2_id,
    equipo_ganador (A/B), sets_equipo_a, sets_equipo_b, games_equipo_a, games_equipo_b, 
    resultado_detallado (JSON), estado (pendiente/jugado/cancelado/WO), cancha, horario, created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas, division_id → circuitooka_divisiones, 
    jugador_*_id → usuarios
  - Índices: etapa_id, division_id, fecha_partido, estado
  
- [ ] **1.1.5** Crear tabla `circuitooka_parejas`
  - Campos: id, etapa_id, division_id, fecha_partido, jugador_1_id, jugador_2_id, 
    tipo_formacion (elegida_por_jugadores/asignada_organizacion), estado (confirmada/cancelada), created_at
  - Relaciones: etapa_id → circuitooka_etapas, division_id → circuitooka_divisiones, jugador_*_id → usuarios
  - Índices: etapa_id, division_id, fecha_partido
  
- [ ] **1.1.6** Crear tabla `circuitooka_rankings`
  - Campos: id, etapa_id, division_id, usuario_id, partidos_ganados, partidos_jugados, 
    promedio_individual, promedio_general, bonus_por_jugar, promedio_final, 
    diferencia_sets, diferencia_games, victorias_mejores_parejas, posicion_ranking,
    minimo_requerido, cumple_minimo (boolean), created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas, division_id → circuitooka_divisiones, usuario_id → usuarios
  - Índices: etapa_id, division_id, usuario_id, posicion_ranking, promedio_final
  
- [ ] **1.1.7** Crear tabla `circuitooka_encuestas_disponibilidad`
  - Campos: id, etapa_id, semana_numero, fecha_inicio_semana, fecha_fin_semana, 
    fecha_envio, fecha_cierre, estado (abierta/cerrada/procesada), created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas
  - Índices: etapa_id, semana_numero, estado
  
- [ ] **1.1.8** Crear tabla `circuitooka_respuestas_disponibilidad`
  - Campos: id, encuesta_id, usuario_id, disponible (boolean), fecha_respuesta, created_at
  - Relaciones: encuesta_id → circuitooka_encuestas_disponibilidad, usuario_id → usuarios
  - Índices: encuesta_id, usuario_id
  - Constraint: UNIQUE(encuesta_id, usuario_id)
  
- [ ] **1.1.9** Crear tabla `circuitooka_confirmaciones_partido`
  - Campos: id, partido_id, usuario_id, confirmado (boolean), pareja_elegida_id (nullable),
    fecha_confirmacion, puede_reemplazar (boolean), created_at, updated_at
  - Relaciones: partido_id → circuitooka_partidos, usuario_id → usuarios, 
    pareja_elegida_id → usuarios
  - Índices: partido_id, usuario_id
  
- [ ] **1.1.10** Crear tabla `circuitooka_reemplazos`
  - Campos: id, partido_id, jugador_original_id, jugador_reemplazo_id, 
    tipo_reemplazo (inscripto_circuito/nuevo_inscripto), fecha_reemplazo, created_at
  - Relaciones: partido_id → circuitooka_partidos, jugador_*_id → usuarios
  - Índices: partido_id, jugador_original_id
  
- [ ] **1.1.11** Crear tabla `circuitooka_ascensos_descensos`
  - Campos: id, etapa_id, usuario_id, division_origen_id, division_destino_id, 
    tipo_movimiento (ascenso/descenso), promedio_final, posicion_origen, posicion_destino,
    motivo (automatico/playoff), fecha_movimiento, created_at
  - Relaciones: etapa_id → circuitooka_etapas, usuario_id → usuarios, 
    division_*_id → circuitooka_divisiones
  - Índices: etapa_id, usuario_id, tipo_movimiento
  
- [ ] **1.1.12** Crear tabla `circuitooka_playoffs`
  - Campos: id, etapa_id, division_origen_id, division_destino_id, tipo_playoff (ascenso/descenso),
    jugador_1_superior_id, jugador_2_superior_id, jugador_1_inferior_id, jugador_2_inferior_id,
    partido_id, resultado, estado (pendiente/jugado), fecha_playoff, created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas, division_*_id → circuitooka_divisiones,
    jugador_*_id → usuarios, partido_id → circuitooka_partidos
  - Índices: etapa_id, division_origen_id, estado
  
- [ ] **1.1.13** Crear tabla `circuitooka_configuracion`
  - Campos: id, etapa_id, cupos_ascenso_porcentaje (default 20), cupos_ascenso_minimo (default 2),
    cupos_ascenso_maximo (default 10), jugadores_playoff_por_division (default 4),
    horario_turno_noche_inicio (default '20:00'), horario_turno_noche_fin (default '23:00'),
    created_at, updated_at
  - Relaciones: etapa_id → circuitooka_etapas
  - Índices: etapa_id

### 1.2 Funciones y Triggers de Base de Datos
- [ ] **1.2.1** Crear función `calcular_promedio_jugador(usuario_id, etapa_id, division_id)`
  - Calcula: promedio_individual, promedio_general, bonus_por_jugar, promedio_final
  - Calcula: minimo_requerido basado en partidos de la división
  - Actualiza tabla circuitooka_rankings
  
- [ ] **1.2.2** Crear función `calcular_minimo_requerido(etapa_id, division_id)`
  - Fórmula: PARTIDOS_JUGADOS_DIVISION / (CANTIDAD_JUGADORES_INSCRIPTOS / 2)
  - Retorna el mínimo requerido para esa división en ese momento
  
- [ ] **1.2.3** Crear trigger `actualizar_ranking_despues_partido`
  - Se dispara cuando se actualiza estado de partido a "jugado"
  - Recalcula rankings de los 4 jugadores involucrados
  
- [ ] **1.2.4** Crear función `obtener_posicion_ranking(usuario_id, etapa_id, division_id)`
  - Calcula posición en el ranking basado en promedio_final
  - Considera desempates: diferencia_sets, diferencia_games, victorias_mejores_parejas
  
- [ ] **1.2.5** Crear función `calcular_cupos_ascenso_descenso(etapa_id, division_id)`
  - Calcula cupos según: 20% de jugadores inscriptos (min 2, max 10)
  - Retorna número de cupos para ascenso y descenso

### 1.3 Políticas de Seguridad (RLS)
- [ ] **1.3.1** Configurar RLS para todas las tablas
- [ ] **1.3.2** Políticas para usuarios: pueden ver sus propios datos
- [ ] **1.3.3** Políticas para admin: acceso completo
- [ ] **1.3.4** Políticas para rankings: lectura pública, escritura solo admin

### 1.4 Datos Iniciales
- [ ] **1.4.1** Insertar divisiones base (División 1, 2, 3, 4)
- [ ] **1.4.2** Crear primera etapa de prueba (Febrero-Abril 2026)
- [ ] **1.4.3** Configurar parámetros por defecto en circuitooka_configuracion

---

## ⚙️ FASE 2: BACKEND Y LÓGICA DE NEGOCIO
**Duración estimada: 2-3 semanas**

### 2.1 Utilidades de Cálculo de Promedios
- [ ] **2.1.1** Crear `lib/circuitooka/promedios.js`
  - Función `calcularPromedioIndividual(partidosGanados, partidosJugados)`
  - Función `calcularPromedioGeneral(partidosGanados, partidosJugados, partidosDivision)`
  - Función `calcularBonusPorJugar(partidosJugados, partidosDivision)`
  - Función `calcularPromedioFinal(individual, general, bonus)`
  - Función `calcularMinimoRequerido(partidosDivision, jugadoresInscriptos)`
  - Función `validarMinimoRequerido(partidosJugados, minimoRequerido)`

- [ ] **2.1.2** Crear `lib/circuitooka/rankings.js`
  - Función `actualizarRankingJugador(usuarioId, etapaId, divisionId)`
  - Función `obtenerRankingCompleto(etapaId, divisionId)`
  - Función `calcularPosicionRanking(usuarioId, etapaId, divisionId)`
  - Función `obtenerEstadisticasJugador(usuarioId, etapaId)`
  - Función `calcularDesempates(usuario1, usuario2, etapaId, divisionId)`

### 2.2 Lógica de Ascensos y Descensos
- [ ] **2.2.1** Crear `lib/circuitooka/ascensos-descensos.js`
  - Función `calcularCuposAscensoDescenso(etapaId, divisionId)`
  - Función `identificarJugadoresAscenso(etapaId, divisionId, cupos)`
  - Función `identificarJugadoresDescenso(etapaId, divisionId, cupos)`
  - Función `identificarJugadoresPlayoff(etapaId, divisionId)`
  - Función `procesarAscensosDescensos(etapaId)`
  - Función `aplicarCambioDivision(usuarioId, divisionOrigen, divisionDestino, tipo)`

### 2.3 Sistema de Sorteos
- [ ] **2.3.1** Crear `lib/circuitooka/sorteos.js`
  - Función `formarParejasDisponibles(etapaId, divisionId, fechaPartido)`
  - Función `asignarParejasSinCompanero(etapaId, divisionId, fechaPartido)`
  - Función `sortearPartidos(etapaId, divisionId, fechaPartido, parejas)`
  - Función `manejarParejaImpar(parejas)`
  - Función `validarParejasRepetidas(partido1, partido2, historial)`

### 2.4 Gestión de Encuestas
- [ ] **2.4.1** Crear `lib/circuitooka/encuestas.js`
  - Función `crearEncuestaSemanal(etapaId, semanaNumero, fechaInicio, fechaFin)`
  - Función `enviarEncuestaUsuarios(encuestaId)`
  - Función `procesarRespuestasEncuesta(encuestaId)`
  - Función `obtenerJugadoresDisponibles(encuestaId)`
  - Función `cerrarEncuesta(encuestaId)`

### 2.5 Gestión de Reemplazos
- [ ] **2.5.1** Crear `lib/circuitooka/reemplazos.js`
  - Función `solicitarReemplazo(partidoId, jugadorOriginalId, jugadorReemplazoId)`
  - Función `validarReemplazo(jugadorReemplazoId, divisionId)`
  - Función `procesarReemplazoNuevoJugador(jugadorReemplazoId, etapaId, divisionId)`
  - Función `actualizarPartidoConReemplazo(partidoId, reemplazo)`

### 2.6 Sistema de Playoffs
- [ ] **2.6.1** Crear `lib/circuitooka/playoffs.js`
  - Función `identificarZonasRepechaje(etapaId, divisionId)`
  - Función `formarParejasPlayoff(etapaId, divisionId, tipoPlayoff)`
  - Función `crearPartidosPlayoff(playoffs)`
  - Función `procesarResultadoPlayoff(playoffId, resultado)`
  - Función `aplicarAscensosDescensosPlayoff(playoffId)`

### 2.7 APIs REST
- [ ] **2.7.1** Crear `app/api/circuitooka/etapas/route.js`
  - GET: Listar todas las etapas
  - GET con query: Obtener etapa específica
  - POST: Crear nueva etapa (solo admin)
  - PUT: Actualizar etapa (solo admin)
  
- [ ] **2.7.2** Crear `app/api/circuitooka/inscripciones/route.js`
  - GET: Listar inscripciones (con filtros)
  - POST: Crear inscripción individual
  - PUT: Actualizar inscripción
  - DELETE: Cancelar inscripción
  
- [ ] **2.7.3** Crear `app/api/circuitooka/rankings/route.js`
  - GET: Obtener ranking completo de una división
  - GET con query: Obtener ranking de un jugador específico
  - POST: Recalcular ranking (solo admin)
  
- [ ] **2.7.4** Crear `app/api/circuitooka/partidos/route.js`
  - GET: Listar partidos (con filtros)
  - POST: Crear partido (solo admin o sistema)
  - PUT: Actualizar resultado de partido
  - DELETE: Cancelar partido
  
- [ ] **2.7.5** Crear `app/api/circuitooka/parejas/route.js`
  - GET: Listar parejas formadas para una fecha
  - POST: Formar pareja (jugador selecciona compañero)
  - PUT: Actualizar pareja
  - DELETE: Cancelar pareja
  
- [ ] **2.7.6** Crear `app/api/circuitooka/encuestas/route.js`
  - GET: Obtener encuesta activa
  - POST: Responder encuesta de disponibilidad
  - PUT: Actualizar respuesta
  - POST /procesar: Procesar encuesta y generar sorteos (solo admin)
  
- [ ] **2.7.7** Crear `app/api/circuitooka/sorteos/route.js`
  - POST: Ejecutar sorteo de partidos para una fecha
  - GET: Obtener resultados de sorteo
  - POST /manual: Sorteo manual (solo admin)
  
- [ ] **2.7.8** Crear `app/api/circuitooka/ascensos-descensos/route.js`
  - GET: Obtener ascensos/descensos de una etapa
  - POST: Procesar ascensos/descensos al finalizar etapa (solo admin)
  - GET /playoffs: Obtener partidos de playoff
  
- [ ] **2.7.9** Crear `app/api/circuitooka/reemplazos/route.js`
  - POST: Solicitar reemplazo
  - PUT: Aprobar/rechazar reemplazo
  - GET: Listar reemplazos pendientes
  
- [ ] **2.7.10** Crear `app/api/circuitooka/promedios/route.js`
  - GET: Obtener promedio de un jugador
  - POST: Recalcular promedios de una división (solo admin)
  - GET /minimo: Obtener mínimo requerido de una división

---

## 🎨 FASE 3: FRONTEND ADMIN
**Duración estimada: 2-3 semanas**

### 3.1 Estructura Base Admin
- [ ] **3.1.1** Crear `app/admin/circuitooka/layout.jsx`
  - Layout con navegación específica de Circuitooka
  - Menú lateral con todas las secciones
  
- [ ] **3.1.2** Crear `app/admin/circuitooka/page.jsx` (Dashboard)
  - Vista general con estadísticas
  - Resumen de etapas activas
  - Partidos pendientes
  - Rankings por división
  - Accesos rápidos

### 3.2 Gestión de Etapas
- [ ] **3.2.1** Crear `app/admin/circuitooka/etapas/page.jsx`
  - Listado de todas las etapas
  - Crear nueva etapa
  - Editar etapa existente
  - Activar/desactivar etapa
  - Ver estadísticas de etapa
  
- [ ] **3.2.2** Crear `app/admin/circuitooka/etapas/[id]/page.jsx`
  - Detalle completo de etapa
  - Jugadores inscriptos por división
  - Partidos jugados/pendientes
  - Configuración de cupos
  - Botón para procesar ascensos/descensos

### 3.3 Gestión de Divisiones
- [ ] **3.3.1** Crear `app/admin/circuitooka/divisiones/page.jsx`
  - Listado de divisiones
  - Editar descripción de divisiones
  - Ver jugadores por división
  - Estadísticas por división

### 3.4 Gestión de Inscripciones
- [ ] **3.4.1** Crear `app/admin/circuitooka/inscripciones/page.jsx`
  - Listado de todas las inscripciones
  - Filtros: etapa, división, estado
  - Aprobar/rechazar solicitudes especiales (División 2)
  - Ver historial de inscripciones
  - Exportar lista de inscriptos

### 3.5 Gestión de Partidos
- [ ] **3.5.1** Crear `app/admin/circuitooka/partidos/page.jsx`
  - Listado de partidos
  - Filtros: etapa, división, fecha, estado
  - Crear partido manualmente
  - Editar resultado de partido
  - Marcar partido como WO
  - Cancelar partido
  
- [ ] **3.5.2** Crear componente `PartidoForm.jsx`
  - Formulario para crear/editar partido
  - Selección de jugadores
  - Ingreso de resultado detallado
  - Validaciones

### 3.6 Gestión de Rankings
- [ ] **3.6.1** Crear `app/admin/circuitooka/rankings/page.jsx`
  - Rankings por división
  - Filtros: etapa, división
  - Ver detalle de cálculo de promedio
  - Recalcular rankings manualmente
  - Exportar rankings
  
- [ ] **3.6.2** Crear componente `RankingTable.jsx`
  - Tabla ordenable
  - Mostrar: posición, nombre, partidos, promedio, mínimo requerido
  - Indicadores visuales (ascenso/descenso/playoff)

### 3.7 Gestión de Ascensos y Descensos
- [ ] **3.7.1** Crear `app/admin/circuitooka/ascensos-descensos/page.jsx`
  - Vista previa de ascensos/descensos
  - Mostrar cupos calculados
  - Lista de jugadores que ascienden
  - Lista de jugadores que descienden
  - Lista de jugadores en playoff
  - Botón para procesar cambios
  - Confirmación antes de aplicar

### 3.8 Gestión de Sorteos
- [ ] **3.8.1** Crear `app/admin/circuitooka/sorteos/page.jsx`
  - Seleccionar etapa y fecha
  - Ver jugadores disponibles (de encuesta)
  - Ver parejas formadas
  - Ejecutar sorteo automático
  - Ajustar sorteo manualmente
  - Ver resultado del sorteo
  - Confirmar y crear partidos

### 3.9 Gestión de Encuestas
- [ ] **3.9.1** Crear `app/admin/circuitooka/encuestas/page.jsx`
  - Crear nueva encuesta semanal
  - Ver encuestas anteriores
  - Ver respuestas de encuesta activa
  - Enviar recordatorios
  - Cerrar encuesta
  - Procesar encuesta (generar sorteos)

### 3.10 Gestión de Playoffs
- [ ] **3.10.1** Crear `app/admin/circuitooka/playoffs/page.jsx`
  - Ver partidos de playoff pendientes
  - Crear partidos de playoff
  - Registrar resultados
  - Aplicar ascensos/descensos de playoff

### 3.11 Gestión de Reemplazos
- [ ] **3.11.1** Crear `app/admin/circuitooka/reemplazos/page.jsx`
  - Ver solicitudes de reemplazo pendientes
  - Aprobar/rechazar reemplazos
  - Gestionar inscripciones de nuevos jugadores por reemplazo

---

## 👤 FASE 4: FRONTEND USUARIO
**Duración estimada: 2-3 semanas**

### 4.1 Página Principal Circuitooka
- [ ] **4.1.1** Crear `app/circuitooka/page.jsx`
  - Landing page del circuito
  - Información general
  - Etapas activas
  - Cómo funciona
  - Botón de inscripción

### 4.2 Inscripción
- [ ] **4.2.1** Crear `app/circuitooka/inscripcion/page.jsx`
  - Formulario de inscripción
  - Selección de división inicial (con validaciones)
  - Solicitud especial para División 2
  - Pago de inscripción (integración MercadoPago)
  - Confirmación de inscripción

### 4.3 Disponibilidad
- [ ] **4.3.1** Crear `app/circuitooka/disponibilidad/page.jsx`
  - Ver encuesta activa
  - Responder disponibilidad
  - Ver historial de respuestas
  - Recordatorios

### 4.4 Selección de Pareja
- [ ] **4.4.1** Crear `app/circuitooka/parejas/page.jsx`
  - Ver jugadores disponibles de mi división
  - Buscar jugador para formar pareja
  - Enviar solicitud de pareja
  - Ver parejas formadas
  - Cancelar pareja (si es posible)

### 4.5 Mis Partidos
- [ ] **4.5.1** Crear `app/circuitooka/partidos/page.jsx`
  - Listado de mis partidos
  - Filtros: etapa, división, estado
  - Ver detalles de partido
  - Confirmar asistencia
  - Solicitar reemplazo
  - Ver resultados

- [ ] **4.5.2** Crear componente `PartidoCard.jsx`
  - Tarjeta con información del partido
  - Jugadores involucrados
  - Fecha, hora, cancha
  - Estado y acciones disponibles

### 4.6 Mi Ranking
- [ ] **4.6.1** Crear `app/circuitooka/ranking/page.jsx`
  - Ver mi posición en el ranking
  - Ver mi promedio desglosado
  - Ver estadísticas personales
  - Ver historial de partidos
  - Comparar con otros jugadores

- [ ] **4.6.2** Crear componente `MiRankingCard.jsx`
  - Tarjeta con ranking personal
  - Gráficos de evolución
  - Indicadores visuales

### 4.7 Rankings Públicos
- [ ] **4.7.1** Crear `app/circuitooka/rankings/page.jsx`
  - Rankings por división
  - Filtros: etapa, división
  - Búsqueda de jugadores
  - Ver perfil de jugador

- [ ] **4.7.2** Crear `app/circuitooka/rankings/[division]/page.jsx`
  - Ranking completo de una división
  - Tabla ordenable
  - Paginación

### 4.8 Divisiones
- [ ] **4.8.1** Crear `app/circuitooka/divisiones/page.jsx`
  - Ver todas las divisiones
  - Información de cada división
  - Ver jugadores por división
  - Ver partidos por división

- [ ] **4.8.2** Crear `app/circuitooka/divisiones/[division]/page.jsx`
  - Detalle de división específica
  - Ranking de la división
  - Partidos recientes
  - Próximos partidos

### 4.9 Perfil en Circuitooka
- [ ] **4.9.1** Integrar sección Circuitooka en `app/perfil/page.jsx`
  - Ver mis estadísticas de Circuitooka
  - Historial de etapas
  - Historial de divisiones
  - Logros y ascensos

---

## 🤖 FASE 5: AUTOMATIZACIONES
**Duración estimada: 1-2 semanas**

### 5.1 Sistema de Encuestas Automáticas
- [ ] **5.1.1** Crear función `crearEncuestaSemanalAutomatica()`
  - Se ejecuta todos los lunes
  - Crea encuesta para la semana siguiente
  - Envía notificaciones a jugadores inscriptos
  
- [ ] **5.1.2** Crear cron job o función programada
  - Configurar en Supabase Edge Functions o Vercel Cron
  - Ejecutar cada lunes a las 9:00 AM

### 5.2 Sistema de Sorteos Automáticos
- [ ] **5.2.1** Crear función `procesarSorteoSemanal()`
  - Se ejecuta después del cierre de encuesta
  - Procesa respuestas
  - Forma parejas
  - Ejecuta sorteo
  - Crea partidos
  
- [ ] **5.2.2** Integrar con sistema de encuestas
  - Trigger automático al cerrar encuesta

### 5.3 Cálculo Automático de Rankings
- [ ] **5.3.1** Crear función `recalcularRankingsAutomatico()`
  - Se ejecuta después de cada partido
  - Actualiza rankings de jugadores involucrados
  - Recalcula posiciones
  
- [ ] **5.3.2** Crear trigger en base de datos
  - Se dispara al actualizar partido

### 5.4 Notificaciones Automáticas
- [ ] **5.4.1** Crear `lib/circuitooka/notificaciones.js`
  - Función `enviarNotificacionEncuesta(encuestaId)`
  - Función `enviarNotificacionSorteo(partidos)`
  - Función `enviarNotificacionPartido(partidoId)`
  - Función `enviarNotificacionAscensoDescenso(usuarioId, tipo)`
  - Función `enviarRecordatorioConfirmacion()`

- [ ] **5.4.2** Integrar con sistema de notificaciones existente
  - Usar tabla `notificaciones` existente
  - Enviar emails si está configurado

### 5.5 Procesamiento de Ascensos/Descensos
- [ ] **5.5.1** Crear función `procesarFinEtapa()`
  - Se ejecuta al finalizar etapa
  - Calcula ascensos/descensos
  - Identifica playoffs
  - Envía notificaciones
  - Actualiza divisiones para próxima etapa

---

## 🧪 FASE 6: TESTING Y AJUSTES
**Duración estimada: 1-2 semanas**

### 6.1 Testing de Cálculos
- [ ] **6.1.1** Crear tests para cálculo de promedios
  - Test casos normales
  - Test casos límite (0 partidos, todos ganados, etc.)
  - Test mínimo requerido
  - Test validación de mínimo

- [ ] **6.1.2** Crear tests para rankings
  - Test ordenamiento correcto
  - Test desempates
  - Test posiciones

- [ ] **6.1.3** Crear tests para ascensos/descensos
  - Test cálculo de cupos
  - Test identificación de jugadores
  - Test aplicación de cambios

### 6.2 Testing de Flujos Completos
- [ ] **6.2.1** Test flujo completo de inscripción
  - Inscripción normal
  - Inscripción con solicitud especial
  - Inscripción en medio de etapa

- [ ] **6.2.2** Test flujo completo de partido
  - Formar pareja
  - Confirmar disponibilidad
  - Sorteo
  - Jugar partido
  - Registrar resultado
  - Actualizar rankings

- [ ] **6.2.3** Test flujo de ascenso/descenso
  - Finalizar etapa
  - Procesar ascensos
  - Aplicar cambios
  - Iniciar nueva etapa

### 6.3 Testing de Sorteos
- [ ] **6.3.1** Test algoritmo de sorteo
  - Parejas pares
  - Parejas impares
  - Sin repeticiones excesivas
  - Validación de reglas

### 6.4 Testing de UI/UX
- [ ] **6.4.1** Testing de usabilidad
  - Navegación intuitiva
  - Formularios claros
  - Mensajes de error útiles
  - Feedback visual

- [ ] **6.4.2** Testing responsive
  - Mobile
  - Tablet
  - Desktop

### 6.5 Testing de Performance
- [ ] **6.5.1** Optimizar consultas de base de datos
  - Índices correctos
  - Queries eficientes
  - Caché donde sea necesario

- [ ] **6.5.2** Testing de carga
  - Múltiples usuarios simultáneos
  - Cálculos pesados
  - Sorteos con muchos jugadores

### 6.6 Ajustes y Refinamiento
- [ ] **6.6.1** Revisar feedback de usuarios beta
- [ ] **6.6.2** Ajustar fórmulas si es necesario
- [ ] **6.6.3** Mejorar mensajes y textos
- [ ] **6.6.4** Optimizar procesos lentos
- [ ] **6.6.5** Documentar funcionalidades

### 6.7 Preparación para Producción
- [ ] **6.7.1** Configurar variables de entorno
- [ ] **6.7.2** Configurar backups de base de datos
- [ ] **6.7.3** Configurar monitoreo y logs
- [ ] **6.7.4** Crear documentación de usuario
- [ ] **6.7.5** Crear documentación técnica
- [ ] **6.7.6** Plan de rollback

---

## 📊 RESUMEN DE FASES

| Fase | Duración | Prioridad | Dependencias |
|------|----------|-----------|--------------|
| Fase 1: Base de Datos | 1-2 semanas | 🔴 Crítica | Ninguna |
| Fase 2: Backend | 2-3 semanas | 🔴 Crítica | Fase 1 |
| Fase 3: Frontend Admin | 2-3 semanas | 🟡 Alta | Fase 2 |
| Fase 4: Frontend Usuario | 2-3 semanas | 🟡 Alta | Fase 2 |
| Fase 5: Automatizaciones | 1-2 semanas | 🟢 Media | Fase 2, 3, 4 |
| Fase 6: Testing | 1-2 semanas | 🟡 Alta | Todas las anteriores |

**Total estimado: 9-15 semanas (2.5 - 4 meses)**

---

## 🎯 PRIORIZACIÓN PARA MVP

Si necesitas lanzar un MVP más rápido, prioriza:

1. **Fase 1 completa** (Base de datos)
2. **Fase 2 básica** (Cálculos y APIs esenciales)
3. **Fase 3 básica** (Admin mínimo viable)
4. **Fase 4 básica** (Usuario mínimo viable)
5. **Fase 5 manual** (Sin automatizaciones, todo manual)
6. **Fase 6 básica** (Testing crítico)

**MVP estimado: 6-8 semanas**

---

## 📝 NOTAS IMPORTANTES

- Todas las tareas deben seguir las convenciones del proyecto actual
- Usar componentes UI existentes cuando sea posible
- Mantener separación clara entre módulos
- Documentar decisiones importantes
- Revisar con el equipo antes de implementar cambios grandes


