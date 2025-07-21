// Script de prueba para verificar autenticación
// Ejecutar en la consola del navegador después de hacer login con Google

async function testAuth() {
  console.log('=== TEST AUTH ===')
  
  // Obtener usuario actual
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('Usuario autenticado:', user)
  console.log('Error usuario:', userError)
  
  if (!user) {
    console.error('No hay usuario autenticado')
    return
  }
  
  // Buscar en tabla usuarios por ID
  const { data: usuarioPorId, error: errorId } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()
  
  console.log('Usuario por ID:', usuarioPorId)
  console.log('Error por ID:', errorId)
  
  // Buscar en tabla usuarios por email
  const { data: usuarioPorEmail, error: errorEmail } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .single()
  
  console.log('Usuario por email:', usuarioPorEmail)
  console.log('Error por email:', errorEmail)
  
  // Listar todos los usuarios
  const { data: todosUsuarios, error: errorTodos } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('Últimos 5 usuarios:', todosUsuarios)
  console.log('Error todos:', errorTodos)
}

// Función para crear usuario manualmente si no existe
async function createUserManually() {
  console.log('=== CREATE USER MANUALLY ===')
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('No hay usuario autenticado')
    return
  }
  
  // Extraer nombre y apellido
  const fullName = user.user_metadata?.full_name || ""
  const nameParts = fullName.split(" ")
  const nombre = nameParts[0] || user.email?.split("@")[0] || ""
  const apellido = nameParts.slice(1).join(" ") || ""
  
  console.log('Datos a insertar:', {
    id: user.id,
    email: user.email.toLowerCase(),
    nombre,
    apellido,
    dni: null,
    ranking_puntos: 0,
    cuenta_activada: true,
    rol: 'user',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    nivel: "Principiante"
  })
  
  // Crear usuario
  const { data: newUser, error: insertError } = await supabase
    .from('usuarios')
    .insert({
      id: user.id,
      email: user.email.toLowerCase(),
      nombre: nombre,
      apellido: apellido,
      dni: null,
      ranking_puntos: 0,
      cuenta_activada: true,
      rol: 'user',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      nivel: "Principiante"
    })
    .select()
    .single()
  
  console.log('Usuario creado:', newUser)
  console.log('Error creación:', insertError)
  
  return newUser
}

// Ejecutar pruebas
console.log('Ejecuta testAuth() para verificar el estado actual')
console.log('Ejecuta createUserManually() para crear usuario manualmente si no existe') 