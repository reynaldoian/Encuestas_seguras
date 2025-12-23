// ============================================
// CONFIGURACIÓN DE SUPABASE - VERSIÓN UNIFICADA
// ============================================

const SUPABASE_URL = 'https://hmeqdnzehahsgpkzpttn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXFkbnplaGFoc2dwa3pwdHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjQ3NTcsImV4cCI6MjA4MDYwMDc1N30.6i50cs0bmNSSGOFFVq1-_WEOPA3-PVtyu-NoygYMcbg';

// ⚠️ IMPORTANTE: Usamos 'db' para evitar el SyntaxError de "already declared"
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CONFIGURACIÓN DE EMAILJS
// ============================================

const emailjsConfig = {
  serviceID: 'service_c8mykiy',
  templateID: 'template_dd5qzlq',
  publicKey: 'DKLmstEK3OXZar938'
};

if (typeof emailjs !== 'undefined') {
  emailjs.init(emailjsConfig.publicKey);
}

// ============================================
// FUNCIONES DE EMAIL
// ============================================

async function enviarEmailEmailJS(email, link) {
  try {
    const templateParams = {
      to_email: email,
      link: link,
      from_name: 'Incorporación',
      year: new Date().getFullYear(),
      reply_to: 'luzyverdad2025@gmail.com'
    };

    const response = await emailjs.send(
      emailjsConfig.serviceID,
      emailjsConfig.templateID,
      templateParams
    );

    return { success: true, id: response.text, mensaje: 'Email enviado' };
  } catch (error) {
    console.error('❌ Error EmailJS:', error);
    return { success: false, error: error.text || error.message };
  }
}

async function enviarInvitaciones(correos = []) {
  const resultados = [];
  for (const invitacion of correos) {
    const res = await enviarEmailEmailJS(invitacion.email, invitacion.link);
    resultados.push({ ...invitacion, enviado: res.success });
  }
  return { success: true, data: { count: resultados.filter(r => r.enviado).length, resultados } };
}

// ============================================
// GESTIÓN DE PARTICIPANTES
// ============================================

async function registrarParticipante(datos) {
  try {
    const { data, error } = await db.from('participants').insert([{
      email: datos.correo,
      nombre: datos.nombre,
      apellido: datos.apellido,
      campo1: datos.campo1,
      campo2: datos.campo2,
      campo3: datos.campo3
    }]).select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.code === '23505' ? 'Correo ya registrado' : error.message };
  }
}

async function obtenerParticipantes() {
  try {
    const { data, error } = await db.from('participants').select('*').order('registrado', { ascending: false });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function eliminarParticipante(correo) {
  try {
    await db.from('votes').delete().eq('participant_email', correo);
    await db.from('invitaciones').delete().eq('correo', correo);
    const { error } = await db.from('participants').delete().eq('email', correo);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// GESTIÓN DE PREGUNTAS Y VOTOS
// ============================================

async function obtenerPreguntasConOpciones() {
  try {
    const { data, error } = await db.from('positions').select(`id, titulo, options (id, texto, orden)`).order('id', { ascending: true });
    if (error) throw error;
    return { success: true, data: data.map(p => ({
      id: p.id.toString(),
      pregunta: p.titulo,
      opciones: (p.options || []).sort((a,b) => a.orden - b.orden).map(o => ({ id: o.id.toString(), opcion: o.texto }))
    }))};
  } catch (error) { return { success: false, error: error.message }; }
}

async function puedeVotar(correo) {
  try {
    const { data, error } = await db.from('participants').select('ha_votado').eq('email', correo).single();
    if (error) throw error;
    return { success: true, puedeVotar: !data.ha_votado };
  } catch (error) { return { success: false, error: error.message }; }
}

async function registrarVoto(correo, respuestas) {
  try {
    const verificacion = await puedeVotar(correo);
    if (!verificacion.success || !verificacion.puedeVotar) throw new Error('Ya ha votado');

    for (const r of respuestas) {
      const { error } = await db.from('votes').insert([{
        participant_email: correo,
        position_id: r.idPregunta,
        option_id: r.idOpcion,
        fecha: new Date().toISOString()
      }]);
      if (error) throw error;
    }

    await db.from('participants').update({ ha_votado: true }).eq('email', correo);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

// ============================================
// RESULTADOS Y ESTADÍSTICAS
// ============================================

async function obtenerEstadisticasGenerales() {
  try {
    const { count: total } = await db.from('participants').select('*', { count: 'exact', head: true });
    const { count: votaron } = await db.from('participants').select('*', { count: 'exact', head: true }).eq('ha_votado', true);
    return { success: true, data: { 
      total_participantes: total || 0, 
      participantes_votaron: votaron || 0,
      tasa_participacion: total > 0 ? ((votaron / total) * 100).toFixed(1) : 0
    }};
  } catch (error) { return { success: false, error: error.message }; }
}

async function obtenerResultadosPregunta(idPregunta) {
  try {
    const { data: votos } = await db.from('votes').select('option_id, options!inner(id, texto, position_id)').eq('options.position_id', idPregunta);
    const { data: opciones } = await db.from('options').select('id, texto').eq('position_id', idPregunta).order('orden', { ascending: true });
    
    const conteo = {};
    votos.forEach(v => conteo[v.option_id] = (conteo[v.option_id] || 0) + 1);

    return { success: true, data: opciones.map(o => ({
      opcion: o.texto,
      votos: conteo[o.id] || 0,
      porcentaje: votos.length > 0 ? ((conteo[o.id] || 0) / votos.length * 100).toFixed(1) : 0
    }))};
  } catch (error) { return { success: false, error: error.message }; }
}

async function obtenerResultadosCompletos() {
  try {
    const preguntas = await obtenerPreguntasConOpciones();
    const resultados = [];
    for (const p of preguntas.data) {
      const res = await obtenerResultadosPregunta(p.id);
      if (res.success) resultados.push({ pregunta: p.pregunta, opciones: res.data });
    }
    return { success: true, data: resultados };
  } catch (error) { return { success: false, error: error.message }; }
}

// ============================================
// INVITACIONES Y TOKENS
// ============================================

async function generarTokenInvitacion(correo) {
  try {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fecha = new Date(); fecha.setDate(fecha.getDate() + 7);
    const { error } = await db.from('invitaciones').insert([{ correo, token, fecha_expiracion: fecha.toISOString() }]);
    if (error) throw error;
    return { success: true, token };
  } catch (error) { return { success: false, error: error.message }; }
}

async function validarTokenInvitacion(token) {
  try {
    const { data, error } = await db.from('invitaciones').select('correo, fecha_expiracion').eq('token', token).single();
    if (error || new Date(data.fecha_expiracion) < new Date()) throw new Error('Token inválido o expirado');
    return { success: true, correo: data.correo };
  } catch (error) { return { success: false, error: error.message }; }
}

// ============================================
// UTILIDADES E INICIALIZACIÓN
// ============================================

async function verificarConexion() {
  try {
    const { error } = await db.from('participants').select('count', { count: 'exact', head: true }).limit(1);
    return { success: !error };
  } catch (error) { return { success: false }; }
}

console.log('✅ Sistema Supabase (db) y EmailJS unificado');
