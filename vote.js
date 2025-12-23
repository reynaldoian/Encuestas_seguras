// ============================================
// VOTE.JS 
// ============================================

let correoActual = null;

// ============================================
// NOTIFICACIONES
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
// RENDERIZADO
// ============================================
function renderError(titulo, mensaje, emoji = '❌') {
    return `
        <div class="card">
            <div class="status-message">
                <div class="status-icon">${emoji}</div>
                <h2 class="status-title error">${titulo}</h2>
                <p class="status-text">${mensaje}</p>
            </div>
        </div>
    `;
}

function renderSuccess(titulo, mensaje) {
    return `
        <div class="card">
            <div class="status-message">
                <div class="status-icon">✅</div>
                <h2 class="status-title success">${titulo}</h2>
                <p class="status-text">${mensaje}</p>
            </div>
        </div>
    `;
}

function renderVotingForm(participante, preguntas) {
    return `
        <div class="card">
            <div class="voter-info">
                <p>
                    <strong>Votando como:</strong><br>
                    ${participante.nombre} ${participante.apellido}<br>
                    <span style="font-size: 14px; color: #6b7280;">${participante.email}</span>
                </p>
            </div>
            
            <div class="questions-container">
                ${preguntas.map((pregunta, index) => `
                    <div class="question-block">
                        <h3 class="question-text">
                            <span class="question-number">${index + 1}</span>
                            ${pregunta.pregunta}
                        </h3>
                        <div class="options-list">
                            ${pregunta.opciones.map(opcion => `
                                <label class="voting-option">
                                    <input 
                                        type="radio" 
                                        name="pregunta_${pregunta.id}" 
                                        value="${opcion.id}"
                                        data-pregunta-id="${pregunta.id}"
                                        data-opcion-id="${opcion.id}"
                                        onchange="selectOption(this)"
                                    >
                                    ${opcion.opcion}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn btn-success" onclick="handleSubmitVote()" style="width: 100%; padding: 16px; font-size: 17px; margin-top: 30px;">
                ✅ Enviar Mi Voto
            </button>
        </div>
    `;
}

// ============================================
// INTERACCIONES
// ============================================
function selectOption(radio) {
    const parent = radio.closest('.options-list');
    const labels = parent.querySelectorAll('.voting-option');
    
    labels.forEach(label => label.classList.remove('selected'));
    
    if (radio.checked) {
        radio.closest('.voting-option').classList.add('selected');
    }
}

// ✅ FUNCIÓN ACTUALIZADA CON DEBUG COMPLETO
async function handleSubmitVote() {
    console.log('=== INICIANDO ENVÍO DE VOTO ===');
    console.log('📧 Correo actual:', correoActual);
    
    const respuestas = [];
    const radios = document.querySelectorAll('input[type="radio"]:checked');
    
    console.log('📋 Radios seleccionados:', radios.length);
    
    if (radios.length === 0) {
        showNotification('Por favor responda todas las preguntas', 'error');
        return;
    }

    radios.forEach((radio, index) => {
        const preguntaId = radio.dataset.preguntaId;
        const opcionId = radio.dataset.opcionId;
        
        console.log(`📋 Radio ${index + 1}:`, {
            name: radio.name,
            value: radio.value,
            dataset: {
                preguntaId: preguntaId,
                opcionId: opcionId
            }
        });
        
        respuestas.push({
            idPregunta: preguntaId,
            idOpcion: opcionId
        });
    });

    console.log('📋 Respuestas finales:', respuestas);

    if (!confirm('¿Está seguro de enviar su voto? Esta acción no se puede deshacer.')) {
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';

    try {
        const result = await registrarVoto(correoActual, respuestas);
        
        if (result.success) {
            document.getElementById('votingContainer').innerHTML = renderSuccess(
                '¡Gracias por Participar!',
                'Su voto ha sido registrado exitosamente.'
            );
            showNotification('✅ Voto registrado exitosamente');
        } else {
            btn.disabled = false;
            btn.textContent = '✅ Enviar Mi Voto';
            showNotification('❌ ' + result.error, 'error');
        }
    } catch (error) {
        btn.disabled = false;
        btn.textContent = '✅ Enviar Mi Voto';
        showNotification('❌ Error: ' + error.message, 'error');
    }
    
    console.log('=== FIN ENVÍO DE VOTO ===');
}

// ============================================
// INICIALIZACIÓN CON DEPURACIÓN
// ============================================
async function init() {
    console.log('🔄 Iniciando verificación de votación...');
    const container = document.getElementById('votingContainer');

    // Obtener parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    console.log('🔗 Parámetros URL:', { token, email });

    // Validar token o email
    if (!token && !email) {
        console.error('❌ Sin token ni email en URL');
        container.innerHTML = renderError(
            'Acceso Inválido',
            'Debe acceder mediante el enlace enviado a su correo electrónico.',
            '⚠️'
        );
        return;
    }

    let correoParticipante;

    // Validar token si existe
    if (token) {
        console.log('🔐 Validando token...');
        const tokenResult = await validarTokenInvitacion(token);
        console.log('🔐 Resultado token:', tokenResult);
        
        if (!tokenResult.success) {
            console.error('❌ Token inválido:', tokenResult.error);
            container.innerHTML = renderError(
                'Token Inválido o Expirado',
                tokenResult.error,
                '❌'
            );
            return;
        }
        correoParticipante = tokenResult.correo;
    } else {
        correoParticipante = email;
    }

    console.log('📧 Correo participante:', correoParticipante);
    correoActual = correoParticipante;

    // Obtener participante
    console.log('👤 Obteniendo participante...');
    const participanteResult = await obtenerParticipantePorCorreo(correoParticipante);
    console.log('👤 Resultado participante:', participanteResult);
    
    if (!participanteResult.success) {
        console.error('❌ Error obteniendo participante:', participanteResult.error);
        container.innerHTML = renderError(
            'Correo No Registrado',
            `El correo ${correoParticipante} no está registrado en el sistema.`,
            '❌'
        );
        return;
    }

    const participante = participanteResult.data;
    console.log('👤 Participante encontrado:', participante);

    // Verificar si ya votó
    if (participante.ha_votado) {
        console.log('✅ Participante ya votó');
        container.innerHTML = renderSuccess(
            '¡Gracias por Participar!',
            'Su voto ya ha sido registrado exitosamente.'
        );
        return;
    }

    // Obtener preguntas
    console.log('❓ Obteniendo preguntas...');
    const preguntasResult = await obtenerPreguntasConOpciones();
    console.log('❓ Resultado preguntas:', preguntasResult);
    
    if (!preguntasResult.success) {
        console.error('❌ Error obteniendo preguntas:', preguntasResult.error);
        container.innerHTML = renderError(
            'Error al Cargar Encuesta',
            'No se pudieron cargar las preguntas de la encuesta.',
            '⚠️'
        );
        return;
    }
    
    if (preguntasResult.data.length === 0) {
        console.error('❌ No hay preguntas configuradas');
        container.innerHTML = renderError(
            'Encuesta No Disponible',
            'No hay preguntas configuradas para esta encuesta.',
            '⚠️'
        );
        return;
    }

    console.log(`✅ ${preguntasResult.data.length} preguntas cargadas`);
    
    // Renderizar formulario
    container.innerHTML = renderVotingForm(participante, preguntasResult.data);
    console.log('✅ Formulario de votación renderizado');
}

// ============================================
// EJECUCIÓN AL CARGAR LA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM cargado, verificando conexión...');
    
    try {
        const conexion = await verificarConexion();
        console.log('🔗 Resultado conexión:', conexion);
        
        if (!conexion.success) {
            document.getElementById('votingContainer').innerHTML = renderError(
                'Error de Conexión',
                'No se pudo conectar con el servidor. Por favor, intente más tarde.',
                '⚠️'
            );
            return;
        }
        
        console.log('✅ Conexión exitosa, iniciando votación...');
        await init();
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        document.getElementById('votingContainer').innerHTML = renderError(
            'Error Inesperado',
            'Ocurrió un error al cargar la página. Por favor, recargue.',
            '❌'
        );
    }
});

// ============================================
// FUNCIONES DE DEPURACIÓN (agregar a la consola)
// ============================================
// Para depurar, abre la consola y ejecuta:
console.log('🔧 Comandos de depuración disponibles:');
console.log('   - obtenerParticipantePorCorreo("tu@email.com")');
console.log('   - obtenerPreguntasConOpciones()');
console.log('   - verificarConexion()');
console.log('   - validarTokenInvitacion("token")');
