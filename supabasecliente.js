// ============================================
// CONFIGURACIÓN DE SUPABASE CLIENT
// Configurado para: hmeqdnzehahsgpkzpttn.supabase.co
// ============================================

// TU CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://hmeqdnzehahsgpkzpttn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXFkbnplaGFoc2dwa3pwdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjQ3NTcsImV4cCI6MjA4MDYwMDc1N30.6i50cs0bmNSSGOFFVq1-_WEOPA3-PVtyu-NoygYMcbg'; // REEMPLAZAR con tu clave anon/public

// Crear cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNCIONES PARA PARTICIPANTES
// ============================================

/**
 * Registrar un nuevo participante
 */
async function registrarParticipante(datos) {
  try {
    const { data, error } = await supabase
      .from('participantes')
      .insert([{
        correo: datos.correo,
        nombre: datos.nombre,
        apellido: datos.apellido,
        campo1: datos.campo1 || null,
        campo2: datos.campo2 || null,
        campo3: datos.campo3 || null
      }])
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error al registrar participante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los participantes
 */
async function obtenerParticipantes() {
  try {
    const { data, error } = await supabase
      .from('participantes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar si un participante puede votar
 */
async function puedeVotar(correo) {
  try {
    const { data, error } = await supabase
      .rpc('puede_votar', { p_correo: correo });

    if (error) throw error;
    return { success: true, puedeVotar: data };
  } catch (error) {
    console.error('Error al verificar si puede votar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener información de un participante por correo
 */
async function obtenerParticipantePorCorreo(correo) {
  try {
    const { data, error } = await supabase
      .from('participantes')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener participante:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar un participante
 */
async function eliminarParticipante(correo) {
  try {
    const { error } = await supabase
      .from('participantes')
      .delete()
      .eq('correo', correo);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES PARA PREGUNTAS
// ============================================

/**
 * Crear una nueva pregunta
 */
async function crearPregunta(pregunta, opciones) {
  try {
    // Insertar pregunta
    const { data: preguntaData, error: preguntaError } = await supabase
      .from('preguntas')
      .insert([{ pregunta }])
      .select();

    if (preguntaError) throw preguntaError;

    const idPregunta = preguntaData[0].id;

    // Insertar opciones
    const opcionesData = opciones.map((opcion, index) => ({
      id_pregunta: idPregunta,
      opcion,
      orden: index + 1
    }));

    const { error: opcionesError } = await supabase
      .from('opciones')
      .insert(opcionesData);

    if (opcionesError) throw opcionesError;

    return { success: true, data: preguntaData[0] };
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todas las preguntas con sus opciones
 */
async function obtenerPreguntasConOpciones() {
  try {
    const { data: preguntas, error: preguntasError } = await supabase
      .from('preguntas')
      .select(`
        *,
        opciones (*)
      `)
      .eq('activa', true)
      .order('orden', { ascending: true });

    if (preguntasError) throw preguntasError;

    // Ordenar opciones dentro de cada pregunta
    preguntas.forEach(pregunta => {
      pregunta.opciones.sort((a, b) => a.orden - b.orden);
    });

    return { success: true, data: preguntas };
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una pregunta
 */
async function eliminarPregunta(idPregunta) {
  try {
    const { error } = await supabase
      .from('preguntas')
      .delete()
      .eq('id', idPregunta);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES PARA VOTAR
// ============================================

/**
 * Registrar respuestas de un participante
 */
async function registrarVoto(correo, respuestas) {
  try {
    // Verificar que el participante puede votar
    const verificacion = await puedeVotar(correo);
    if (!verificacion.success || !verificacion.puedeVotar) {
      return { success: false, error: 'Este correo no puede votar o ya ha votado' };
    }

    // Preparar datos de respuestas
    const respuestasData = respuestas.map(r => ({
      correo,
      id_pregunta: r.idPregunta,
      id_opcion: r.idOpcion
    }));

    // Insertar respuestas
    const { error } = await supabase
      .from('respuestas')
      .insert(respuestasData);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error al registrar voto:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES PARA RESULTADOS
// ============================================

/**
 * Obtener estadísticas generales
 */
async function obtenerEstadisticasGenerales() {
  try {
    const { data, error } = await supabase
      .rpc('obtener_estadisticas_generales');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener resultados de una pregunta específica
 */
async function obtenerResultadosPregunta(idPregunta) {
  try {
    const { data, error } = await supabase
      .rpc('obtener_resultados_pregunta', { p_id_pregunta: idPregunta });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener todos los resultados consolidados
 */
async function obtenerResultadosCompletos() {
  try {
    const { data, error } = await supabase
      .from('vista_resultados')
      .select('*');

    if (error) throw error;

    // Agrupar por pregunta
    const resultadosPorPregunta = {};
    data.forEach(row => {
      if (!resultadosPorPregunta[row.id_pregunta]) {
        resultadosPorPregunta[row.id_pregunta] = {
          idPregunta: row.id_pregunta,
          pregunta: row.pregunta,
          opciones: []
        };
      }
      resultadosPorPregunta[row.id_pregunta].opciones.push({
        idOpcion: row.id_opcion,
        opcion: row.opcion,
        votos: row.votos,
        porcentaje: row.porcentaje || 0
      });
    });

    return { success: true, data: Object.values(resultadosPorPregunta) };
  } catch (error) {
    console.error('Error al obtener resultados completos:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES PARA INVITACIONES
// ============================================

/**
 * Generar token de invitación para un participante
 */
async function generarTokenInvitacion(correo) {
  try {
    const { data, error } = await supabase
      .rpc('generar_token_invitacion', { p_correo: correo });

    if (error) throw error;
    return { success: true, token: data };
  } catch (error) {
    console.error('Error al generar token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validar token de invitación
 */
async function validarTokenInvitacion(token) {
  try {
    const { data, error } = await supabase
      .from('invitaciones')
      .select('correo, fecha_expiracion')
      .eq('token', token)
      .single();

    if (error) throw error;

    // Verificar si el token ha expirado
    if (new Date(data.fecha_expiracion) < new Date()) {
      return { success: false, error: 'El token ha expirado' };
    }

    return { success: true, correo: data.correo };
  } catch (error) {
    console.error('Error al validar token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar invitaciones usando tu Edge Function
 */
async function enviarInvitaciones(correos = [], enviarATodos = false) {
  try {
    const response = await fetch(
      'https://hmeqdnzehahsgpkzpttn.supabase.co/functions/v1/resend-email',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correos,
          enviarATodos,
          asunto: 'Invitación a Participar en Encuesta',
          mensajePersonalizado: 'Tu participación es importante para nosotros.'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar invitaciones:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Verificar conexión con Supabase
 */
async function verificarConexion() {
  try {
    const { error } = await supabase
      .from('participantes')
      .select('count')
      .limit(1);

    return { success: !error };
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false };
  }
}

/**
 * Suscribirse a cambios en tiempo real
 */
function suscribirseACambios(tabla, callback) {
  const subscription = supabase
    .channel(`${tabla}_changes`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: tabla },
      callback
    )
    .subscribe();

  return subscription;
}

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('✅ Cliente Supabase inicializado');
console.log('📡 URL:', "https://hmeqdnzehahsgpkzpttn.supabase.co");

// Verificar conexión al cargar
verificarConexion().then(result => {
  if (result.success) {
    console.log('✅ Conexión con Supabase exitosa');
  } else {
    console.error('❌ Error de conexión con Supabase');
  }
});