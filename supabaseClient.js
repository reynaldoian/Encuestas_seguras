// ============================================
// CONFIGURACIÓN DE SUPABASE CLIENT - VERSIÓN CORREGIDA
// ============================================

const SUPABASE_URL = 'https://hmeqdnzehahsgpkzpttn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXFkbnplaGFoc2dwa3pwdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjQ3NTcsImV4cCI6MjA4MDYwMDc1N30.6i50cs0bmNSSGOFFVq1-_WEOPA3-PVtyu-NoygYMcbg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PARTICIPANTES
// ============================================

async function registrarParticipante(datos) {
  try {
    console.log('🔍 Registrando participante:', datos.correo);
    
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        email: datos.correo,
        nombre: datos.nombre,
        apellido: datos.apellido,
        campo1: datos.campo1 || null,
        campo2: datos.campo2 || null,
        campo3: datos.campo3 || null
      }])
      .select();

    if (error) {
      console.error('❌ Error en insert:', error);
      throw error;
    }
    
    console.log('✅ Participante registrado:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error al registrar:', error);
    
    if (error.code === '23505') {
      return { success: false, error: 'Este correo ya está registrado' };
    }
    
    return { success: false, error: error.message };
  }
}

async function obtenerParticipantes() {
  try {
    console.log('📋 Obteniendo participantes...');
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('registrado', { ascending: false });

    if (error) throw error;
    
    console.log('✅ Participantes obtenidos:', data.length);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function eliminarParticipante(correo) {
  try {
    console.log('🗑️ Eliminando participante:', correo);
    
    // Primero eliminar votos asociados
    const { error: errorVotos } = await supabase
      .from('votes')
      .delete()
      .eq('participant_email', correo);
    
    if (errorVotos) {
      console.warn('⚠️ Error al eliminar votos:', errorVotos);
    }
    
    // Eliminar tokens de invitación
    const { error: errorTokens } = await supabase
      .from('invitaciones')
      .delete()
      .eq('correo', correo);
    
    if (errorTokens) {
      console.warn('⚠️ Error al eliminar tokens:', errorTokens);
    }
    
    // Luego eliminar participante
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('email', correo);

    if (error) throw error;
    
    console.log('✅ Participante eliminado');
    return { success: true };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function puedeVotar(correo) {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('ha_votado')
      .eq('email', correo)
      .single();

    if (error) throw error;
    return { success: true, puedeVotar: !data.ha_votado };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function obtenerParticipantePorCorreo(correo) {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('email', correo)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// PREGUNTAS - SOLUCIÓN #3: ELIMINACIÓN EN CASCADA
// ============================================

async function crearPregunta(pregunta, opciones) {
  try {
    console.log('🔍 Creando pregunta:', pregunta);
    
    const { data: preguntaData, error: preguntaError } = await supabase
      .from('positions')
      .insert([{ titulo: pregunta }])
      .select();

    if (preguntaError) throw preguntaError;

    const idPregunta = preguntaData[0].id;
    const opcionesData = opciones.map((opcion, index) => ({
      position_id: idPregunta,
      texto: opcion,
      orden: index + 1
    }));

    const { error: opcionesError } = await supabase
      .from('options')
      .insert(opcionesData);

    if (opcionesError) throw opcionesError;
    
    console.log('✅ Pregunta creada con', opciones.length, 'opciones');
    return { success: true, data: preguntaData[0] };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function obtenerPreguntasConOpciones() {
  try {
    console.log('📋 Obteniendo preguntas...');
    
    const { data: preguntas, error: preguntasError } = await supabase
      .from('positions')
      .select(`
        id,
        titulo,
        options (
          id,
          texto,
          orden
        )
      `)
      .order('id', { ascending: true });
      
    if (preguntasError) throw preguntasError;

    const preguntasFormateadas = preguntas.map(p => ({
      id: p.id,
      pregunta: p.titulo,
      opciones: (p.options || [])
        .sort((a, b) => a.orden - b.orden)
        .map(o => ({
          id: o.id,
          opcion: o.texto,
          orden: o.orden
        }))
    }));

    console.log('✅ Preguntas obtenidas:', preguntasFormateadas.length);
    return { success: true, data: preguntasFormateadas };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// 🔥 SOLUCIÓN #3: Eliminación completa en cascada
async function eliminarPregunta(idPregunta) {
  try {
    console.log('🗑️ Eliminando pregunta:', idPregunta);
    
    // 1. Obtener todas las opciones de esta pregunta
    const { data: opciones, error: errorOpciones } = await supabase
      .from('options')
      .select('id')
      .eq('position_id', idPregunta);
    
    if (errorOpciones) {
      console.error('❌ Error al obtener opciones:', errorOpciones);
      throw errorOpciones;
    }
    
    console.log(`📝 Encontradas ${opciones?.length || 0} opciones`);
    
    // 2. Eliminar votos asociados a cada opción
    if (opciones && opciones.length > 0) {
      const idsOpciones = opciones.map(o => o.id);
      
      const { error: errorVotos } = await supabase
        .from('votes')
        .delete()
        .in('option_id', idsOpciones);
      
      if (errorVotos) {
        console.warn('⚠️ Error al eliminar votos:', errorVotos);
      } else {
        console.log('✅ Votos eliminados');
      }
    }
    
    // 3. Eliminar opciones
    const { error: errorDeleteOpciones } = await supabase
      .from('options')
      .delete()
      .eq('position_id', idPregunta);
    
    if (errorDeleteOpciones) {
      console.error('❌ Error al eliminar opciones:', errorDeleteOpciones);
      throw errorDeleteOpciones;
    }
    
    console.log('✅ Opciones eliminadas');
    
    // 4. Finalmente, eliminar la pregunta
    const { error: errorPregunta } = await supabase
      .from('positions')
      .delete()
      .eq('id', idPregunta);

    if (errorPregunta) {
      console.error('❌ Error al eliminar pregunta:', errorPregunta);
      throw errorPregunta;
    }
    
    console.log('✅ Pregunta eliminada completamente');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error al eliminar pregunta:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// VOTAR
// ============================================

async function registrarVoto(correo, respuestas) {
  try {
    console.log('🗳️ Registrando voto para:', correo);
    
    // 1. Verificar que puede votar
    const verificacion = await puedeVotar(correo);
    if (!verificacion.success || !verificacion.puedeVotar) {
      return { success: false, error: 'Este correo no puede votar o ya ha votado' };
    }

    // 2. Preparar datos de votos
    const respuestasData = respuestas.map(r => ({
      participant_email: correo,
      position_id: r.idPregunta,
      option_id: r.idOpcion
    }));

    // 3. Insertar votos
    const { error: errorVotos } = await supabase
      .from('votes')
      .insert(respuestasData);

    if (errorVotos) throw errorVotos;
    
    // 4. Marcar como votado
    const { error: errorUpdate } = await supabase
      .from('participants')
      .update({ ha_votado: true })
      .eq('email', correo);

    if (errorUpdate) {
      console.warn('⚠️ Error al actualizar ha_votado:', errorUpdate);
    }
    
    console.log('✅ Voto registrado');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error al registrar voto:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// RESULTADOS
// ============================================

async function obtenerEstadisticasGenerales() {
  try {
    console.log('📊 Obteniendo estadísticas...');
    
    const { count: totalParticipantes, error: errorTotal } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    if (errorTotal) throw errorTotal;

    const { count: participantesVotaron, error: errorVotaron } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('ha_votado', true);

    if (errorVotaron) throw errorVotaron;

    const tasaParticipacion = totalParticipantes > 0 
      ? ((participantesVotaron / totalParticipantes) * 100).toFixed(1) 
      : 0;

    const stats = {
      total_participantes: totalParticipantes || 0,
      participantes_votaron: participantesVotaron || 0,
      tasa_participacion: parseFloat(tasaParticipacion)
    };
    
    console.log('✅ Estadísticas:', stats);
    return { success: true, data: stats };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function obtenerResultadosPregunta(idPregunta) {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        option_id,
        options!inner (
          id,
          texto,
          position_id
        )
      `)
      .eq('options.position_id', idPregunta);

    if (error) throw error;

    const votosPorOpcion = {};
    data.forEach(voto => {
      const opcionId = voto.option_id;
      votosPorOpcion[opcionId] = (votosPorOpcion[opcionId] || 0) + 1;
    });

    const { data: opciones, error: errorOpciones } = await supabase
      .from('options')
      .select('id, texto')
      .eq('position_id', idPregunta)
      .order('orden', { ascending: true });

    if (errorOpciones) throw errorOpciones;

    const totalVotos = data.length;
    const resultados = opciones.map(opcion => ({
      opcion: opcion.texto,
      votos: votosPorOpcion[opcion.id] || 0,
      porcentaje: totalVotos > 0 
        ? ((votosPorOpcion[opcion.id] || 0) / totalVotos * 100).toFixed(1)
        : 0
    }));

    return { success: true, data: resultados };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

async function obtenerResultadosCompletos() {
  try {
    console.log('📊 Obteniendo resultados completos...');
    
    const preguntasResult = await obtenerPreguntasConOpciones();
    if (!preguntasResult.success) throw new Error(preguntasResult.error);

    const resultados = [];
    for (const pregunta of preguntasResult.data) {
      const resultadoPregunta = await obtenerResultadosPregunta(pregunta.id);
      if (resultadoPregunta.success) {
        resultados.push({
          pregunta: pregunta.pregunta,
          opciones: resultadoPregunta.data
        });
      }
    }

    console.log('✅ Resultados obtenidos:', resultados.length, 'preguntas');
    return { success: true, data: resultados };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// INVITACIONES - TOKENS
// ============================================

async function generarTokenInvitacion(correo) {
  try {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);

    const { data, error } = await supabase
      .from('invitaciones')
      .insert([{
        correo: correo,
        token: token,
        fecha_expiracion: fechaExpiracion.toISOString()
      }])
      .select();

    if (error) throw error;
    return { success: true, token: token };
  } catch (error) {
    console.error('❌ Error generando token:', error);
    return { success: false, error: error.message };
  }
}

async function validarTokenInvitacion(token) {
  try {
    const { data, error } = await supabase
      .from('invitaciones')
      .select('correo, fecha_expiracion')
      .eq('token', token)
      .single();

    if (error) throw error;

    if (new Date(data.fecha_expiracion) < new Date()) {
      return { success: false, error: 'El token ha expirado' };
    }

    return { success: true, correo: data.correo };
  } catch (error) {
    console.error('❌ Error validando token:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🔥 ENVÍO DE EMAILS (USANDO EDGE FUNCTION) - NUEVA IMPLEMENTACIÓN
// ============================================

async function enviarInvitaciones(correos = [], enviarATodos = false, enlaceBase = '') {
  try {
    console.log('📧 INICIANDO ENVÍO DE EMAILS REAL (VÍA EDGE FUNCTION)');
    
    if (!enlaceBase || enlaceBase.trim() === '') {
      throw new Error('Se requiere el enlace base de la encuesta');
    }

    let correosAEnviar = correos;

    // 1. Obtener correos (Si se selecciona "Enviar a todos")
    if (enviarATodos) {
      const { data, error } = await supabase
        .from('participants')
        .select('email')
        .eq('ha_votado', false);

      if (error) throw error;
      correosAEnviar = data.map(p => p.email);
    }

    if (!correosAEnviar || correosAEnviar.length === 0) {
      return { success: false, error: 'No hay correos pendientes para enviar' };
    }

    // 2. Generar tokens y enlaces (Mantenemos la lógica de la BD aquí)
    const invitaciones = [];
    
    for (const correo of correosAEnviar) {
      const tokenResult = await generarTokenInvitacion(correo);
      
      if (tokenResult.success) {
        invitaciones.push({
          email: correo,
          link: `${enlaceBase}?token=${tokenResult.token}` // Enlace completo
        });
      }
    }
    
    if (invitaciones.length === 0) {
      throw new Error('No se pudo generar ningún token válido');
    }

    console.log(`✅ ${invitaciones.length} invitaciones preparadas. Invocando Edge Function...`);

    // 3. 🔥 LLAMAR A LA EDGE FUNCTION DE SUPABASE (resend-email)
    const edgeFunctionResponse = await supabase.functions.invoke('resend-email', {
      method: 'POST',
      body: {
        invitaciones: invitaciones, // Enviamos el array con {email, link}
      }
    });

    if (edgeFunctionResponse.error) {
        // Manejar errores de invocación de red o timeout
        console.error('❌ Error al invocar Edge Function:', edgeFunctionResponse.error);
        // Intentar parsear el error para un mejor mensaje si es posible
        try {
            const errorData = JSON.parse(edgeFunctionResponse.error.message);
            throw new Error(errorData.error || `Fallo de invocación: ${edgeFunctionResponse.error.message}`);
        } catch (e) {
             throw new Error(`Fallo de invocación: ${edgeFunctionResponse.error.message}`);
        }
    }
    
    // Asumiendo que la función devuelve { success: true, count: N }
    const resultadoEdge = edgeFunctionResponse.data;
    
    // Verifica si la función se ejecutó pero devolvió un error JSON
    if (!resultadoEdge || resultadoEdge.success === false) {
      throw new Error(resultadoEdge.error || 'Error desconocido reportado por Edge Function');
    }

    console.log(`✅ Edge Function responded. ${resultadoEdge.count} emails enviados.`);
    
    return { 
      success: true, 
      data: {
        count: resultadoEdge.count,
        resultado: {
          resultados: invitaciones,
          mensaje: `${resultadoEdge.count} emails enviados correctamente vía Edge Function.`
        }
      }
    };

  } catch (error) {
    console.error('❌ ERROR en enviarInvitaciones:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// UTILIDADES
// ============================================

async function verificarConexion() {
  try {
    const { error } = await supabase
      .from('participants')
      .select('count')
      .limit(1);

    return { success: !error };
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return { success: false };
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('✅ Cliente Supabase inicializado');

verificarConexion().then(result => {
  if (result.success) {
    console.log('✅ Conexión con Supabase exitosa');
  } else {
    console.error('❌ Error de conexión');
  }
});