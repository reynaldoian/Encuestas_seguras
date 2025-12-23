
// ============================================
// CONFIGURACIÓN DE SUPABASE CLIENT - VERSIÓN CORREGIDA CON EMAILJS
// ============================================

const SUPABASE_URL = 'https://hmeqdnzehahsgpkzpttn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXFkbnplaGFoc2dwa3pwdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjQ3NTcsImV4cCI6MjA4MDYwMDc1N30.6i50cs0bmNSSGOFFVq1-_WEOPA3-PVtyu-NoygYMcbg';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// EMAILJS CONFIGURACIÓN - EMAILJS + SUPABASE
// ============================================

// Configuración de EmailJS (tus credenciales reales)
const emailjsConfig = {
  serviceID: 'service_c8mykiy',           // ✅ Tu Service ID real
  templateID: 'template_dd5qzlq',         // ✅ Tu Template ID real
  publicKey: 'DKLmstEK3OXZar938'      // ✅ Tu Public Key real
};

// Inicializar EmailJS (DENTRO de este archivo)
if (typeof emailjs !== 'undefined') {
  emailjs.init(emailjsConfig.publicKey);
}

// ============================================
// FUNCIÓN COMPLETA DE EMAIL - EMAILJS + SUPABASE
// ============================================

async function enviarEmailEmailJS(email, link) {
  try {
    console.log('📧 Enviando email con EmailJS...');
    console.log('📧 DESTINATARIO:', email); // ← Verifica este log
    console.log('🔗 Link:', link);

    // ✅ Los parámetros del template
    const templateParams = {
      to_email: email,        // ← Este es el destinatario
      link: link,
      from_name: 'Incorporación',
      year: new Date().getFullYear(),
      reply_to: 'reynaldoian0596@gmail.com'
    };

    console.log('📧 Template params:', templateParams); // ← Verifica esto

    // Enviar con EmailJS
    const response = await emailjs.send(
      emailjsConfig.serviceID,
      emailjsConfig.templateID,
      templateParams
    );

    console.log('✅ Email enviado con EmailJS:', response);
    return { 
      success: true, 
      id: response.text,
      mensaje: 'Email enviado correctamente con EmailJS'
    };

  } catch (error) {
    console.error('❌ Error con EmailJS:', error);
    return { 
      success: false, 
      error: error.text || error.message 
    };
  }
}

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
    
    // Primero eliminar los votos asociados
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
      .select(`id, titulo, options (id, texto, orden)`)
      .order('id', { ascending: true });

    if (preguntasError) throw preguntasError; // ✅ CORREGIDO: preguntasError

    const preguntasFormateadas = preguntas.map(p => ({
      id: p.id.toString(), // ✅ Asegurar que sea string
      pregunta: p.titulo,
      opciones: (p.options || [])
        .sort((a, b) => a.orden - b.orden)
        .map(o => ({
          id: o.id.toString(), // ✅ Asegurar que sea string
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
async function eliminarPregunta(idPregunta) {
  try {
    console.log('🗑️ Eliminando pregunta:', idPregunta);
    
    // 1. Primero eliminar los votos asociados
    const { data: opciones, error: errorOpciones } = await supabase
      .from('options')
      .select('id')
      .eq('position_id', idPregunta);

    if (errorOpciones) throw errorOpciones;

    if (opciones && opciones.length > 0) {
      const opcionesIds = opciones.map(o => o.id);
      
      // Eliminar votos de estas opciones
      const { error: errorVotos } = await supabase
        .from('votes')
      .delete()
      .in('option_id', opcionesIds);
      
      if (errorVotos) throw errorVotos;
    }

    // 2. Eliminar opciones
    const { error: errorDeleteOpciones } = await supabase
      .from('options')
      .delete()
      .eq('position_id', idPregunta);
    
    if (errorDeleteOpciones) throw errorDeleteOpciones;
    
    // 3. Finalmente, eliminar la pregunta
    const { error: errorPregunta } = await supabase
      .from('positions')
      .delete()
      .eq('id', idPregunta);

    if (errorPregunta) throw errorPregunta;
    
    console.log('✅ Pregunta eliminada completamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}
// ============================================
// UTILIDADES - VALIDACIÓN UUID
// ============================================

function validarUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    console.warn('⚠️ UUID no es string o está vacío:', uuid);
    return false;
  }
  
  // Patrón UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const isValid = uuidPattern.test(uuid);
  
  if (!isValid) {
    console.warn('⚠️ UUID con formato inválido:', uuid);
  }
  
  return isValid;
}

// ============================================
// VOTAR
// ============================================

async function registrarVoto(correo, respuestas) {
  try {
    console.log('🗳️ Registrando voto para:', correo);
    console.log('📋 Respuestas recibidas:', respuestas);
    
    // 1. Verificar que puede votar
    const verificacion = await puedeVotar(correo);
    if (!verificacion.success || !verificacion.puedeVotar) {
      return { success: false, error: 'Este correo no puede votar o ya ha votado' };
    }

    // 2. Validar y preparar datos
    const respuestasData = respuestas.map((r, index) => {
      console.log(`📋 Validando respuesta ${index + 1}:`, r);
      
      // Convertir a string y validar
      const positionId = r.idPregunta?.toString() || '';
      const optionId = r.idOpcion?.toString() || '';
      
      if (!validarUUID(positionId)) {
        throw new Error(`ID de pregunta inválido: ${positionId}`);
      }
      
      if (!validarUUID(optionId)) {
        throw new Error(`ID de opción inválido: ${optionId}`);
      }
      
      return {
        participant_email: correo,
        position_id: positionId,
        option_id: optionId,
        fecha: new Date().toISOString()
      };
    });

    console.log('📤 Datos a insertar:', respuestasData);

    // 3. Insertar votos
    for (let i = 0; i < respuestasData.length; i++) {
      const voto = respuestasData[i];
      console.log(`📤 Insertando voto ${i + 1}:`, voto);
      
      const { error: errorVoto } = await supabase
        .from('votes')
        .insert([voto]);

      if (errorVoto) {
        console.error(`❌ Error al insertar voto ${i + 1}:`, errorVoto);
        console.error('📊 Detalles del error:', {
          message: errorVoto.message,
          code: errorVoto.code,
          details: errorVoto.details
        });
        throw errorVoto;
      }
    }
    
    // 4. Actualizar estado del participante
    const { error: errorUpdate } = await supabase
      .from('participants')
      .update({ ha_votado: true })
      .eq('email', correo);

    if (errorUpdate) {
      console.warn('⚠️ Error al actualizar ha_votado:', errorUpdate);
    }
    
    console.log('✅ Voto registrado exitosamente');
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

// En supabaseClient.js, reemplaza obtenerResultadosPregunta con esta:

async function obtenerResultadosPregunta(idPregunta) {
  try {
    console.log('📊 Obteniendo resultados para pregunta ID:', idPregunta);
    
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

    console.log('✅ Resultados obtenidos:', resultados);
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
      .from('tokenInvitaciones')
      .insert([{
        correo: correo,
        token: token,
        fechaExpiracion: fechaExpiracion.toISOString()
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
      .from('tokenInvitaciones')
      .select('correo, fechaExpiracion')
      .eq('token', token)
      .single();

    if (error) throw error;

    if (new Date(data.fechaExpiracion) < new Date()) {
      return { success: false, error: 'El token ha expirado' };
    }

    return { success: true, correo: data.correo };
  } catch (error) {
    console.error('❌ Error validando token:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🔥 ENVÍO DE EMAILS (USANDO EMAILJS) - IMPLEMENTACIÓN COMPLETA
// ============================================

// Función para enviar emails con EmailJS
async function enviarEmailEmailJS(email, link) {
  try {
    console.log('📧 Enviando email con EmailJS...');
    console.log('📧 Para:', email);
    console.log('🔗 Link:', link);
    console.log('📧 From: Incorporación <luzyverdad2025@gmail.com>');
    console.log('📧 Service ID:', emailjsConfig.serviceID);
    console.log('📧 Template ID:', emailjsConfig.templateID);

    // Parámetros para el template
    const templateParams = {
      to_email: email,
      link: link,
      from_name: 'Incorporación',
      year: new Date().getFullYear(),
      reply_to: 'luzyverdad2025@gmail.com'
    };

    // Enviar con EmailJS
    const response = await emailjs.send(
      emailjsConfig.serviceID,
      emailjsConfig.templateID,
      templateParams
    );

    console.log('✅ Email enviado con EmailJS:', response);
    return { 
      success: true, 
      id: response.id,
      mensaje: 'Email enviado correctamente con EmailJS'
    };

  } catch (error) {
    console.error('❌ Error con EmailJS:', error);
    return { 
      success: false, 
      error: error.message 
    };
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

// ============================================
// 🔥 ENVÍO DE EMAILS (USANDO EMAILJS) - IMPLEMENTACIÓN COMPLETA
// ============================================

// Función para enviar emails con EmailJS
async function enviarEmailEmailJS(email, link) {
  try {
    console.log('📧 Enviando email con EmailJS...');
    console.log('📧 Para:', email);
    console.log('🔗 Link:', link);
    console.log('📧 From: Incorporación <luzyverdad2025@gmail.com>');
    console.log('📧 Service ID:', emailjsConfig.serviceID);
    console.log('📧 Template ID:', emailjsConfig.templateID);

    // Parámetros para el template
    const templateParams = {
      to_email: email,
      link: link,
      from_name: 'Incorporación',
      year: new Date().getFullYear(),
      reply_to: 'luzyverdad2025@gmail.com'
    };

    // Enviar con EmailJS
    const response = await emailjs.send(
      emailjsConfig.serviceID,
      emailjsConfig.templateID,
      templateParams
    );

    console.log('✅ Email enviado con EmailJS:', response);
    return { 
      success: true, 
      id: response.id,
      mensaje: 'Email enviado correctamente con EmailJS'
    };

  } catch (error) {
    console.error('❌ Error con EmailJS:', error);
    return { 
      success: false, 
      error: error.message 
    };
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

// ============================================
// RESULTADOS
// ============================================

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
// 🔥 ENVÍO DE EMAILS (USANDO EMAILJS) - IMPLEMENTACIÓN COMPLETA
// ============================================

// Función para enviar emails con EmailJS
async function enviarInvitaciones(correos = []) {
  try {
    console.log('📧 INICIANDO ENVÍO DE EMAILS CON EMAILJS');
    console.log('📧 Correos recibidos:', correos.length);
    console.log('📧 Usando EmailJS con:', {
      service: emailjsConfig.serviceID,
      template: emailjsConfig.templateID
    });
    
    // Validar que hay correos
    if (!correos || correos.length === 0) {
      console.error('❌ Array de correos vacío o undefined');
      return { success: false, error: 'No hay correos para enviar' };
    }

    // Enviar cada email con EmailJS
    const resultados = [];
    
    for (const invitacion of correos) {
      console.log('📤 Enviando a:', invitacion.email);
      
      const resultado = await enviarEmailEmailJS(invitacion.email, invitacion.link);
      
      resultados.push({
        email: invitacion.email,
        link: invitacion.link,
        enviado: resultado.success,
        id: resultado.id || null,
        mensaje: resultado.mensaje || resultado.error
      });
    }

    const exitosos = resultados.filter(r => r.enviado).length;
    
    console.log(`✅ EmailJS: ${exitosos}/${correos.length} emails enviados`);
    
    return { 
      success: true, 
      data: {
        count: exitosos,
        resultado: {
          resultados: resultados,
          mensaje: `${exitosos} emails enviados con EmailJS`
        }
      }
    };

  } catch (error) {
    console.error('❌ ERROR con EmailJS:', error);
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

console.log('✅ Cliente Supabase inicializado con EmailJS');
console.log('📧 EmailJS configurado con:', emailjsConfig);

verificarConexion().then(result => {
  if (result.success) {
    console.log('✅ Conexión con Supabase exitosa');
  } else {
    console.error('❌ Error de conexión');
  }
});
