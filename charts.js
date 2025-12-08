// ============================================
// MÓDULO DE GRÁFICAS - VERSIÓN CORREGIDA
// 🔥 SOLUCIÓN #2: Inicialización correcta de Chart.js
// ============================================

let chartInstances = {};

// ============================================
// CONFIGURACIÓN DE COLORES
// ============================================

const CHART_COLORS = {
    primary: '#4f46e5',
    secondary: '#06b6d4',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#a855f7',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#f97316'
};

const CHART_PALETTE = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.indigo,
    CHART_COLORS.teal,
    CHART_COLORS.orange,
    CHART_COLORS.danger
];

// ============================================
// CREAR GRÁFICAS
// ============================================

function crearGraficaBarras(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error('❌ Canvas no encontrado:', canvasId);
        return null;
    }

    // Destruir gráfica anterior
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    try {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votos',
                    data: data,
                    backgroundColor: CHART_PALETTE.map(color => color + '90'),
                    borderColor: CHART_PALETTE,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: titulo,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed.y / total) * 100).toFixed(1) : 0;
                                return `${context.parsed.y} votos (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        chartInstances[canvasId] = chart;
        console.log('✅ Gráfica creada:', canvasId);
        return chart;
    } catch (error) {
        console.error('❌ Error creando gráfica:', error);
        return null;
    }
}

function crearGraficaPastel(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error('❌ Canvas no encontrado:', canvasId);
        return null;
    }

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    try {
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: CHART_PALETTE.map(color => color + '90'),
                    borderColor: CHART_PALETTE,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: titulo,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.parsed} votos (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        chartInstances[canvasId] = chart;
        console.log('✅ Gráfica pastel creada:', canvasId);
        return chart;
    } catch (error) {
        console.error('❌ Error creando gráfica:', error);
        return null;
    }
}

function crearGraficaDona(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error('❌ Canvas no encontrado:', canvasId);
        return null;
    }

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    try {
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: CHART_PALETTE.map(color => color + '90'),
                    borderColor: CHART_PALETTE,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: titulo,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                cutout: '65%'
            }
        });

        chartInstances[canvasId] = chart;
        console.log('✅ Gráfica dona creada:', canvasId);
        return chart;
    } catch (error) {
        console.error('❌ Error creando gráfica:', error);
        return null;
    }
}

function crearGraficaHorizontal(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error('❌ Canvas no encontrado:', canvasId);
        return null;
    }

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    try {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votos',
                    data: data,
                    backgroundColor: CHART_PALETTE.map(color => color + '90'),
                    borderColor: CHART_PALETTE,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: titulo,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        chartInstances[canvasId] = chart;
        console.log('✅ Gráfica horizontal creada:', canvasId);
        return chart;
    } catch (error) {
        console.error('❌ Error creando gráfica:', error);
        return null;
    }
}

// ============================================
// DESCARGAS
// ============================================

function descargarGrafica(canvasId, nombreArchivo) {
    const chart = chartInstances[canvasId];
    if (!chart) {
        alert('No se encontró la gráfica');
        return;
    }

    try {
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `${nombreArchivo}.png`;
        link.href = url;
        link.click();
    } catch (error) {
        console.error('❌ Error descargando gráfica:', error);
        alert('Error al descargar la gráfica');
    }
}

async function descargarTodasGraficas() {
    for (const [canvasId, chart] of Object.entries(chartInstances)) {
        const preguntaIndex = canvasId.split('-')[1];
        descargarGrafica(canvasId, `grafica-pregunta-${preguntaIndex}`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// ============================================
// EXPORTACIONES
// ============================================

async function generarReportePDF(estadisticas, resultados) {
    const contenidoHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Encuesta</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
        h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
        .stat-box { border: 2px solid #e5e7eb; padding: 20px; text-align: center; border-radius: 10px; }
        .stat-value { font-size: 2em; font-weight: bold; color: #4f46e5; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: bold; }
    </style>
</head>
<body>
    <h1>📊 Reporte de Encuesta</h1>
    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
    
    <h2>Estadísticas Generales</h2>
    <div class="stats">
        <div class="stat-box">
            <div class="stat-value">${estadisticas.total_participantes}</div>
            <div>Total Participantes</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${estadisticas.participantes_votaron}</div>
            <div>Votos Emitidos</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${estadisticas.tasa_participacion}%</div>
            <div>Participación</div>
        </div>
    </div>
    
    <h2>Resultados por Pregunta</h2>
    ${resultados.map(pregunta => `
        <div style="margin: 30px 0;">
            <h3>${pregunta.pregunta}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Opción</th>
                        <th>Votos</th>
                        <th>Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
                    ${pregunta.opciones.map(opcion => `
                        <tr>
                            <td>${opcion.opcion}</td>
                            <td>${opcion.votos}</td>
                            <td>${opcion.porcentaje}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}
</body>
</html>
    `;

    const blob = new Blob([contenidoHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `reporte-encuesta-${Date.now()}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function exportarCSV(resultados) {
    let csv = 'Pregunta,Opcion,Votos,Porcentaje\n';
    
    resultados.forEach(pregunta => {
        pregunta.opciones.forEach(opcion => {
            csv += `"${pregunta.pregunta}","${opcion.opcion}",${opcion.votos},${opcion.porcentaje}%\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `resultados-${Date.now()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function exportarJSON(estadisticas, resultados) {
    const datos = {
        fecha_generacion: new Date().toISOString(),
        estadisticas: estadisticas,
        resultados: resultados
    };

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `datos-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function copiarResultados(resultados) {
    let texto = '📊 RESULTADOS DE ENCUESTA\n\n';
    
    resultados.forEach((pregunta, index) => {
        texto += `${index + 1}. ${pregunta.pregunta}\n`;
        pregunta.opciones.forEach(opcion => {
            texto += `   • ${opcion.opcion}: ${opcion.votos} votos (${opcion.porcentaje}%)\n`;
        });
        texto += '\n';
    });

    navigator.clipboard.writeText(texto).then(() => {
        alert('✅ Resultados copiados');
    }).catch(() => {
        alert('❌ No se pudo copiar');
    });
}

// ============================================
// 🔥 SOLUCIÓN #2: RENDERIZADO CORRECTO
// ============================================

function renderizarGraficasCompletas(resultados, tipoGrafica = 'barras') {
    console.log('📊 Renderizando gráficas:', resultados.length);
    
    if (!resultados || resultados.length === 0) {
        return '<p style="text-align: center; padding: 30px; color: #6b7280;">No hay datos para mostrar</p>';
    }
    
    let html = '';
    
    resultados.forEach((pregunta, index) => {
        const canvasId = `chart-${index}`;
        
        html += `
            <div class="chart-container" style="margin-bottom: 40px; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0; color: #1f2937;">${pregunta.pregunta}</h3>
                    <button onclick="descargarGrafica('${canvasId}', 'grafica-${index}')" class="btn btn-sm" style="background: #6b7280; color: white; padding: 8px 16px;">
                        💾 Descargar
                    </button>
                </div>
                <div style="position: relative; height: 350px;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
    });
    
    return html;
}

function inicializarGraficas(resultados, tipoGrafica = 'barras') {
    console.log('🎨 Inicializando gráficas:', tipoGrafica);
    
    if (!resultados || resultados.length === 0) {
        console.warn('⚠️ No hay resultados para graficar');
        return;
    }
    
    // Esperar a que el DOM esté listo
    setTimeout(() => {
        resultados.forEach((pregunta, index) => {
            const canvasId = `chart-${index}`;
            const labels = pregunta.opciones.map(o => o.opcion);
            const data = pregunta.opciones.map(o => o.votos);
            
            console.log(`📈 Creando gráfica ${index + 1}:`, canvasId);
            
            switch(tipoGrafica) {
                case 'barras':
                    crearGraficaBarras(canvasId, labels, data, pregunta.pregunta);
                    break;
                case 'pastel':
                    crearGraficaPastel(canvasId, labels, data, pregunta.pregunta);
                    break;
                case 'dona':
                    crearGraficaDona(canvasId, labels, data, pregunta.pregunta);
                    break;
                case 'horizontal':
                    crearGraficaHorizontal(canvasId, labels, data, pregunta.pregunta);
                    break;
                default:
                    crearGraficaBarras(canvasId, labels, data, pregunta.pregunta);
            }
        });
        
        console.log('✅ Gráficas inicializadas:', Object.keys(chartInstances).length);
    }, 100);
}

