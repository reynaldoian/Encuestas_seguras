// ============================================
// APP.JS - Lógica Principal de la Aplicación
// ============================================

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ============================================
// SISTEMA DE PESTAÑAS
// ============================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remover active de todos
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activar seleccionado
            this.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Cargar datos según pestaña
            if (tabName === 'results') {
                cargarResultados();
            }
        });
    });
}

// ============================================
// FUNCIONES DE SUPABASE (las mismas de supabaseClient.js pero usando db)
// ============================================

// Registrar participante
async function registrarParticipante(datos) {
    try {
        console.log('🔍 Registrando participante:', datos.correo);
        
        const { data, error } = await db
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

// Obtener participantes
async function obtenerParticipantes() {
    try {
        console.log('📋 Obteniendo participantes...');
        
        const { data, error } = await db
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

// Eliminar participante
async function eliminarParticipante(correo) {
    try {
        console.log('🗑️ Eliminando participante:', correo);
        
        const { error: errorVotos } = await db
            .from('votes')
            .delete()
            .eq('participant_email', correo);
        
        if (errorVotos) {
            console.warn('⚠️ Error al eliminar votos:', errorVotos);
        }
        
        const { error: errorTokens } = await db
            .from('invitaciones')
            .delete()
            .eq('correo', correo);
        
        if (errorTokens) {
            console.warn('⚠️ Error al eliminar tokens:', errorTokens);
        }
        
        const { error } = await db
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

// Obtener participante por correo
async function obtenerParticipantePorCorreo(correo) {
    try {
        const { data, error } = await db
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

// Crear pregunta
async function crearPregunta(pregunta, opciones) {
    try {
        console.log('🔍 Creando pregunta:', pregunta);
        
        const { data: preguntaData, error: preguntaError } = await db
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

// Obtener preguntas con opciones
async function obtenerPreguntasConOpciones() {
    try {
        console.log('📋 Obteniendo preguntas...');
        
        const { data: preguntas, error: preguntasError } = await db
            .from('positions')
            .select(`id, titulo, options (id, texto, orden)`)
            .order('id', { ascending: true });

        if (preguntasError) throw preguntasError;

        const preguntasFormateadas = preguntas.map(p => ({
            id: p.id.toString(),
            pregunta: p.titulo,
            opciones: (p.options || [])
                .sort((a, b) => a.orden - b.orden)
                .map(o => ({
                    id: o.id.toString(),
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

// Eliminar pregunta
async function eliminarPregunta(idPregunta) {
    try {
        console.log('🗑️ Eliminando pregunta:', idPregunta);
        
        const { data: opciones, error: errorOpciones } = await db
            .from('options')
            .select('id')
            .eq('position_id', idPregunta);

        if (errorOpciones) throw errorOpciones;

        if (opciones && opciones.length > 0) {
            const opcionesIds = opciones.map(o => o.id);
            
            const { error: errorVotos } = await db
                .from('votes')
                .delete()
                .in('option_id', opcionesIds);
            
            if (errorVotos) throw errorVotos;
        }

        const { error: errorDeleteOpciones } = await db
            .from('options')
            .delete()
            .eq('position_id', idPregunta);
        
        if (errorDeleteOpciones) throw errorDeleteOpciones;
        
        const { error: errorPregunta } = await db
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

// Registrar voto
async function registrarVoto(correo, respuestas) {
    try {
        console.log('🗳️ Registrando voto para:', correo);
        
        // Convertir respuestas al formato correcto
        const respuestasData = respuestas.map(r => ({
            participant_email: correo,
            position_id: r.idPregunta,
            option_id: r.idOpcion,
            fecha: new Date().toISOString()
        }));

        console.log('📤 Datos a insertar:', respuestasData);

        // Insertar votos
        for (let i = 0; i < respuestasData.length; i++) {
            const voto = respuestasData[i];
            console.log(`📤 Insertando voto ${i + 1}:`, voto);
            
            const { error: errorVoto } = await db
                .from('votes')
                .insert([voto]);

            if (errorVoto) {
                console.error(`❌ Error al insertar voto ${i + 1}:`, errorVoto);
                throw errorVoto;
            }
        }
        
        // Actualizar estado del participante
        const { error: errorUpdate } = await db
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

// Generar token de invitación
async function generarTokenInvitacion(correo) {
    try {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);

        const { data, error } = await db
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

// Validar token de invitación
async function validarTokenInvitacion(token) {
    try {
        const { data, error } = await db
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

// Obtener estadísticas generales
async function obtenerEstadisticasGenerales() {
    try {
        console.log('📊 Obteniendo estadísticas...');
        
        const { count: totalParticipantes, error: errorTotal } = await db
            .from('participants')
            .select('*', { count: 'exact', head: true });

        if (errorTotal) throw errorTotal;

        const { count: participantesVotaron, error: errorVotaron } = await db
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

// Obtener resultados de pregunta
async function obtenerResultadosPregunta(idPregunta) {
    try {
        console.log('📊 Obteniendo resultados para pregunta ID:', idPregunta);
        
        const { data, error } = await db
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

        const { data: opciones, error: errorOpciones } = await db
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

// Obtener resultados completos
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

// Enviar invitaciones con EmailJS
async function enviarInvitaciones(correos = []) {
    try {
        console.log('📧 INICIANDO ENVÍO DE EMAILS CON EMAILJS');
        console.log('📧 Correos recibidos:', correos.length);
        
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

// Función para enviar emails con EmailJS
async function enviarEmailEmailJS(email, link) {
    try {
        console.log('📧 Enviando email con EmailJS...');
        
        // Configuración de EmailJS 
        const emailjsConfig = {
            serviceID: 'service_c8mykiy',          
            templateID: 'template_dd5qzlq',         
            publicKey: 'DKLmstEK3OXZar938'      
        };

        // Parámetros para el template
        const templateParams = {
            to_email: email,
            link: link,
            from_name: 'Incorporación',
            year: new Date().getFullYear(),
            reply_to: 'reynaldoian0596@gmail.com'
        };

        // Inicializar EmailJS si no está inicializado
        if (typeof emailjs !== 'undefined' && !window.emailjsInitialized) {
            emailjs.init(emailjsConfig.publicKey);
            window.emailjsInitialized = true;
        }

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

// Verificar conexión
async function verificarConexion() {
    try {
        const { error } = await db
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
// PARTICIPANTES (funciones originales)
// ============================================
async function handleRegistrarParticipante() {
    const email = document.getElementById('participantEmail').value.trim();
    const nombre = document.getElementById('participantNombre').value.trim();
    const apellido = document.getElementById('participantApellido').value.trim();
    const campo1 = document.getElementById('participantCampo1').value.trim();
    const campo2 = document.getElementById('participantCampo2').value.trim();
    const campo3 = document.getElementById('participantCampo3').value.trim();

    if (!email || !nombre || !apellido) {
        showNotification('Complete los campos obligatorios', 'error');
        return;
    }

    const result = await registrarParticipante({
        correo: email,
        nombre,
        apellido,
        campo1,
        campo2,
        campo3
    });

    if (result.success) {
        showNotification('✅ Participante registrado exitosamente');
        
        // Limpiar formulario
        ['participantEmail', 'participantNombre', 'participantApellido', 
         'participantCampo1', 'participantCampo2', 'participantCampo3'].forEach(id => {
            document.getElementById(id).value = '';
        });
        
        cargarParticipantes();
    } else {
        showNotification('❌ ' + result.error, 'error');
    }
}

async function cargarParticipantes() {
    const result = await obtenerParticipantes();
    const tbody = document.getElementById('participantsTableBody');
    const count = document.getElementById('participantCount');

    if (!result.success) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ef4444;">Error al cargar participantes</td></tr>';
        return;
    }

    const participantes = result.data;
    count.textContent = participantes.length;

    if (participantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">No hay participantes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = participantes.map(p => `
        <tr>
            <td>${p.email}</td>
            <td>${p.nombre}</td>
            <td>${p.apellido}</td>
            <td>
                ${p.ha_votado 
                    ? '<span class="badge badge-success">Votó</span>' 
                    : '<span class="badge badge-pending">Pendiente</span>'}
            </td>
            <td>
                <button class="btn-icon" onclick="handleEnviarInvitacion('${p.email}')" title="Enviar invitación">✉️</button>
                <button class="btn-icon" onclick="handleEliminarParticipante('${p.email}')" title="Eliminar">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function handleEliminarParticipante(correo) {
    if (!confirm('¿Está seguro de eliminar este participante?')) return;

    const result = await eliminarParticipante(correo);
    if (result.success) {
        showNotification('✅ Participante eliminado');
        cargarParticipantes();
    } else {
        showNotification('❌ ' + result.error, 'error');
    }
}

async function handleEnviarInvitacion(correo) {
    showNotification('📧 Generando enlace de invitación...');
    
    const tokenResult = await generarTokenInvitacion(correo);
    if (!tokenResult.success) {
        showNotification('❌ Error al generar token', 'error');
        return;
    }

    const voteUrl = `https://reynaldoian.github.io/Encuestas_seguras/vote.html?token=${tokenResult.token}`;
    
    try {
        await navigator.clipboard.writeText(voteUrl);
        showNotification('✅ Enlace copiado al portapapeles');
        
        mostrarModalEnlace(correo, voteUrl);
    } catch (err) {
        alert(`Enlace de votación:\n\n${voteUrl}`);
    }
}

async function handleEnviarATodos() {
    if (!confirm('¿Generar enlaces para todos los participantes pendientes?')) return;

    showNotification('📧 Generando enlaces...', 'warning');
    
    try {
        const participantesResult = await obtenerParticipantes();
        
        if (!participantesResult.success) {
            showNotification('❌ Error al obtener participantes', 'error');
            return;
        }
        
        const participantesPendientes = participantesResult.data.filter(p => !p.ha_votado);
        
        if (participantesPendientes.length === 0) {
            showNotification('ℹ️ No hay participantes pendientes', 'warning');
            return;
        }
        
        console.log('📋 Participantes pendientes:', participantesPendientes.length);
        
        const invitaciones = [];
        
        const URL_BASE = 'https://reynaldoian.github.io/Encuestas_seguras/vote.html';
        
        for (const participante of participantesPendientes) {
            const tokenResult = await generarTokenInvitacion(participante.email);
            
            if (tokenResult.success) {
                const voteUrl = `${URL_BASE}?token=${tokenResult.token}`;
                invitaciones.push({
                    email: participante.email,
                    link: voteUrl
                });
            }
        }
        
        console.log('🔗 Enlaces generados:', invitaciones.length);
        
        if (invitaciones.length === 0) {
            showNotification('❌ No se pudieron generar enlaces', 'error');
            return;
        }
        
        const result = await enviarInvitaciones(invitaciones);
        
        if (result.success) {
            mostrarModalEnlacesMultiples(invitaciones);
            showNotification(`✅ ${invitaciones.length} enlaces generados`);
        } else {
            showNotification('❌ Error: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('❌ Error en handleEnviarATodos:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    }
}

// ============================================
// PREGUNTAS
// ============================================
async function handleCrearPregunta() {
    const titulo = document.getElementById('positionTitulo').value.trim();
    const candidatos = document.getElementById('positionCandidatos').value.trim();

    if (!titulo || !candidatos) {
        showNotification('Complete todos los campos', 'error');
        return;
    }

    const opcionesArray = candidatos
        .split(',')
        .map(c => c.trim())
        .filter(c => c);

    if (opcionesArray.length === 0) {
        showNotification('Agregue al menos una opción', 'error');
        return;
    }

    const result = await crearPregunta(titulo, opcionesArray);

    if (result.success) {
        showNotification('✅ Pregunta creada exitosamente');
        document.getElementById('positionTitulo').value = '';
        document.getElementById('positionCandidatos').value = '';
        cargarPreguntas();
    } else {
        showNotification('❌ ' + result.error, 'error');
    }
}

async function cargarPreguntas() {
    const result = await obtenerPreguntasConOpciones();
    const container = document.getElementById('positionsList');
    const count = document.getElementById('positionCount');

    if (!result.success) {
        container.innerHTML = '<p style="text-align: center; padding: 30px; color: #ef4444;">Error al cargar preguntas</p>';
        return;
    }

    const preguntas = result.data;
    count.textContent = preguntas.length;

    if (preguntas.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">No hay preguntas creadas</p>';
        return;
    }

    container.innerHTML = preguntas.map(p => `
        <div class="position-item">
            <div class="position-header">
                <h4 class="position-title">${p.pregunta}</h4>
                <button class="btn-icon" onclick="handleEliminarPregunta('${p.id}')" title="Eliminar">🗑️</button>
            </div>
            <div class="candidates-list">
                ${p.opciones.map(o => `<span class="candidate-tag" data-opcion-id="${o.id}">${o.opcion}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

async function handleEliminarPregunta(id) {
    if (!confirm('¿Está seguro de eliminar esta pregunta?')) return;

    console.log('🗑️ Eliminando pregunta con ID:', id);
    
    const result = await eliminarPregunta(id);
    if (result.success) {
        showNotification('✅ Pregunta eliminada');
        cargarPreguntas();
    } else {
        showNotification('❌ ' + result.error, 'error');
    }
}

// ============================================
// RESULTADOS
// ============================================
let resultadosActuales = [];
let estadisticasActuales = null;

async function cargarResultados() {
    const statsResult = await obtenerEstadisticasGenerales();
    
    if (statsResult.success) {
        const stats = statsResult.data;
        estadisticasActuales = stats;
        document.getElementById('statTotalParticipants').textContent = stats.total_participantes;
        document.getElementById('statTotalVotes').textContent = stats.participantes_votaron;
        document.getElementById('statParticipationRate').textContent = stats.tasa_participacion + '%';
    }

    const resultadosResult = await obtenerResultadosCompletos();
    const container = document.getElementById('resultsContent');

    if (!resultadosResult.success || resultadosResult.data.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">No hay resultados disponibles</p>';
        return;
    }

    resultadosActuales = resultadosResult.data;

    const tipoGrafica = document.getElementById('tipoGrafica')?.value || 'barras';
    container.innerHTML = renderizarGraficasCompletas(resultadosActuales, tipoGrafica);
    inicializarGraficas(resultadosActuales, tipoGrafica);
}

function cambiarTipoGrafica() {
    cargarResultados();
}

function exportarDatos() {
    const modal = crearModalExportar();
    document.body.insertAdjacentHTML('beforeend', modal);
}

function generarReporte() {
    if (!estadisticasActuales || resultadosActuales.length === 0) {
        showNotification('No hay datos para generar el reporte', 'error');
        return;
    }
    
    generarReportePDF(estadisticasActuales, resultadosActuales);
    showNotification('✅ Reporte generado exitosamente');
}

// ============================================
// MODALES
// ============================================
function mostrarModalEnlace(correo, url) {
    const modal = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h3>✅ Enlace Generado</h3>
                <p style="color: #6b7280; margin-bottom: 15px;">Para: <strong>${correo}</strong></p>
                <div class="link-box">
                    <a href="${url}" target="_blank">${url}</a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin: 15px 0;">
                    ✅ El enlace ha sido copiado al portapapeles.
                </p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="navigator.clipboard.writeText('${url}'); showNotification('Copiado')" class="btn btn-primary" style="flex: 1;">
                        📋 Copiar
                    </button>
                    <button onclick="this.closest('.modal-overlay').remove();" class="btn" style="flex: 1; background: #6b7280; color: white;">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function mostrarModalEnlacesMultiples(resultados) {
    let enlaces = '<div style="max-height: 400px; overflow-y: auto;">';
    
    resultados.forEach(r => {
        enlaces += `
            <div class="link-item" style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                <strong>📧 ${r.email}</strong><br>
                <a href="${r.link}" target="_blank" class="link-url" style="color: #4f46e5; font-size: 12px; word-break: break-all;">${r.link}</a>
                <button onclick="navigator.clipboard.writeText('${r.link}'); showNotification('Enlace copiado')" class="btn-copy" style="margin-top: 8px; padding: 6px 12px; background: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    📋 Copiar
                </button>
            </div>
        `;
    });
    
    enlaces += '</div>';
    
    const modal = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content modal-large" onclick="event.stopPropagation()" style="max-width: 600px;">
                <h3>🔗 Enlaces Generados (${resultados.length})</h3>
                <p style="color: #6b7280; margin-bottom: 20px;">
                    Los enlaces han sido copiados. Envíalos a los participantes por tu medio preferido.
                </p>
                ${enlaces}
                <button onclick="this.closest('.modal-overlay').remove();" class="btn" style="width: 100%; background: #6b7280; color: white; margin-top: 20px;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

function crearModalExportar() {
    return `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h3>📥 Exportar Datos</h3>
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                    <button onclick="exportarCSV(resultadosActuales); this.closest('.modal-overlay').remove();" class="btn btn-primary">
                        📊 Exportar a CSV
                    </button>
                    <button onclick="exportarJSON(estadisticasActuales, resultadosActuales); this.closest('.modal-overlay').remove();" class="btn btn-primary">
                        📋 Exportar a JSON
                    </button>
                    <button onclick="copiarResultados(resultadosActuales); this.closest('.modal-overlay').remove();" class="btn btn-primary">
                        📝 Copiar Resultados
                    </button>
                    <button onclick="this.closest('.modal-overlay').remove();" class="btn" style="background: #6b7280; color: white;">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    initTabs();
    
    const conexion = await verificarConexion();
    if (conexion.success) {
        showNotification('✅ Conectado a Supabase');
        cargarParticipantes();
        cargarPreguntas();
    } else {
        showNotification('❌ Error de conexión con Supabase', 'error');
    }
});

// Función de validación UUID
function validarUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        console.warn('⚠️ UUID no es string o está vacío:', uuid);
        return false;
    }
    
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    const isValid = uuidPattern.test(uuid);
    
    if (!isValid) {
        console.warn('⚠️ UUID con formato inválido:', uuid);
    }
    
    return isValid;
}

// Función para verificar si puede votar
async function puedeVotar(correo) {
    try {
        const { data, error } = await db
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
