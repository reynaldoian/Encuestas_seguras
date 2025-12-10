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
// PARTICIPANTES
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

    const voteUrl = `${window.location.origin}/Encuestas_lis/vote.html?token=${tokenResult.token}`;
    
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
        // 1. Obtener participantes que NO han votado
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
        
        // 2. Generar tokens y enlaces para cada uno
        const invitaciones = [];
        
        for (const participante of participantesPendientes) {
            const tokenResult = await generarTokenInvitacion(participante.email);
            
            if (tokenResult.success) {
                const voteUrl = `${window.location.origin}/Encuestas_lis/vote.html?token=${tokenResult.token}`;
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
        
        // 3. Enviar emails con EmailJS
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

    // ✅ CORREGIDO: IDs UUID entre comillas simples
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

    console.log('🗑️ Eliminando pregunta con ID:', id); // DEBUG
    
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