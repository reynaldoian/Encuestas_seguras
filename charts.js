// ============================================
// MÓDULO DE GRÁFICAS Y EXPORTACIÓN
// Sistema de visualización de resultados con Chart.js
// ============================================

let chartInstances = {}; // Almacenar instancias de gráficas

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
// GENERAR GRÁFICAS
// ============================================

/**
 * Crear gráfica de barras para una pregunta
 */
function crearGraficaBarras(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destruir gráfica anterior si existe
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Votos',
                data: data,
                backgroundColor: CHART_PALETTE.map(color => color + '90'), // 90 = transparencia
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
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    chartInstances[canvasId] = chart;
    return chart;
}

/**
 * Crear gráfica de pastel para una pregunta
 */
function crearGraficaPastel(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destruir gráfica anterior si existe
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

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
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
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
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });

    chartInstances[canvasId] = chart;
    return chart;
}

/**
 * Crear gráfica de dona para una pregunta
 */
function crearGraficaDona(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destruir gráfica anterior si existe
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

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
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
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
            },
            cutout: '65%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
            }
        }
    });

    chartInstances[canvasId] = chart;
    return chart;
}

/**
 * Crear gráfica horizontal de barras
 */
function crearGraficaHorizontal(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destruir gráfica anterior si existe
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed.x / total) * 100).toFixed(1) : 0;
                            return `${context.parsed.x} votos (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    chartInstances[canvasId] = chart;
    return chart;
}

// ============================================
// FUNCIONES DE DESCARGA
// ============================================

/**
 * Descargar una gráfica específica como imagen PNG
 */
function descargarGrafica(canvasId, nombreArchivo) {
    const chart = chartInstances[canvasId];
    if (!chart) {
        alert('No se encontró la gráfica para descargar');
        return;
    }

    // Obtener imagen en base64
    const url = chart.toBase64Image();
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.download = `${nombreArchivo}.png`;
    link.href = url;
    link.click();
}

/**
 * Descargar todas las gráficas como ZIP
 */
async function descargarTodasGraficas() {
    // Nota: Requeriría una librería como JSZip
    // Por simplicidad, descargaremos una por una
    
    for (const [canvasId, chart] of Object.entries(chartInstances)) {
        const preguntaIndex = canvasId.split('-')[1];
        descargarGrafica(canvasId, `grafica-pregunta-${preguntaIndex}`);
        
        // Esperar 500ms entre descargas
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

/**
 * Generar reporte completo en PDF
 */
async function generarReportePDF(estadisticas, resultados) {
    // Crear contenido HTML para el reporte
    const contenidoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Encuesta</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    line-height: 1.6;
                }
                h1 {
                    color: #4f46e5;
                    border-bottom: 3px solid #4f46e5;
                    padding-bottom: 10px;
                }
                h2 {
                    color: #1f2937;
                    margin-top: 30px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin: 30px 0;
                }
                .stat-box {
                    border: 2px solid #e5e7eb;
                    padding: 20px;
                    text-align: center;
                    border-radius: 10px;
                }
                .stat-value {
                    font-size: 2em;
                    font-weight: bold;
                    color: #4f46e5;
                }
                .stat-label {
                    color: #6b7280;
                    font-size: 0.9em;
                }
                .result-section {
                    margin: 30px 0;
                    padding: 20px;
                    background: #f9fafb;
                    border-radius: 10px;
                }
                .result-item {
                    margin: 10px 0;
                    padding: 10px;
                    background: white;
                    border-left: 4px solid #4f46e5;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                th {
                    background: #f3f4f6;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <h1>📊 Reporte de Encuesta</h1>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
            
            <h2>Estadísticas Generales</h2>
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-value">${estadisticas.total_participantes}</div>
                    <div class="stat-label">Total Participantes</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${estadisticas.participantes_votaron}</div>
                    <div class="stat-label">Votos Emitidos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${estadisticas.tasa_participacion}%</div>
                    <div class="stat-label">Tasa de Participación</div>
                </div>
            </div>
            
            <h2>Resultados por Pregunta</h2>
            ${resultados.map(pregunta => `
                <div class="result-section">
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
            
            <div class="footer">
                <p>Sistema de Encuestas - Generado automáticamente</p>
            </div>
        </body>
        </html>
    `;

    // Crear Blob y descargar
    const blob = new Blob([contenidoHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `reporte-encuesta-${Date.now()}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Exportar datos a CSV
 */
function exportarCSV(resultados) {
    let csv = 'Pregunta,Opción,Votos,Porcentaje\n';
    
    resultados.forEach(pregunta => {
        pregunta.opciones.forEach(opcion => {
            csv += `"${pregunta.pregunta}","${opcion.opcion}",${opcion.votos},${opcion.porcentaje}%\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `resultados-encuesta-${Date.now()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Exportar datos a JSON
 */
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
    link.download = `datos-encuesta-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Copiar resultados al portapapeles
 */
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
        alert('✅ Resultados copiados al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('❌ No se pudo copiar al portapapeles');
    });
}

/**
 * Imprimir resultados
 */
function imprimirResultados() {
    window.print();
}

// ============================================
// FUNCIÓN PRINCIPAL: RENDERIZAR GRÁFICAS
// ============================================

/**
 * Renderizar todas las gráficas con los resultados
 */
function renderizarGraficasCompletas(resultados, tipoGrafica = 'barras') {
    let html = '';
    
    resultados.forEach((pregunta, index) => {
        const canvasId = `chart-${index}`;
        const labels = pregunta.opciones.map(o => o.opcion);
        const data = pregunta.opciones.map(o => o.votos);
        
        html += `
            <div class="chart-container" style="margin-bottom: 40px; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #1f2937;">${pregunta.pregunta}</h3>
                    <button onclick="descargarGrafica('${canvasId}', 'grafica-${index}')" class="btn btn-sm" style="background: #6b7280; color: white;">
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

/**
 * Inicializar gráficas después de renderizar el HTML
 */
function inicializarGraficas(resultados, tipoGrafica = 'barras') {
    resultados.forEach((pregunta, index) => {
        const canvasId = `chart-${index}`;
        const labels = pregunta.opciones.map(o => o.opcion);
        const data = pregunta.opciones.map(o => o.votos);
        
        // Esperar a que el canvas esté en el DOM
        setTimeout(() => {
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
        }, 100);
    });
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        crearGraficaBarras,
        crearGraficaPastel,
        crearGraficaDona,
        crearGraficaHorizontal,
        descargarGrafica,
        descargarTodasGraficas,
        generarReportePDF,
        exportarCSV,
        exportarJSON,
        copiarResultados,
        imprimirResultados,
        renderizarGraficasCompletas,
        inicializarGraficas
    };
}