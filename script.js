// Variables globales
let currentFileInput = null;
let excelData = [];
let tendenciaChart = null;
let comparacionChart = null;
let datosAnalisis = [];
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRe_SO-lnkG4p6whgSAS7mk8mGMGoruoi-AP_V1-wvFIcz8vhS2IY5EZT0LNldvG0-Vie62-4mvoRaB/pub?output=csv';
function mostrarNotificacion(mensaje, esError = false) {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${esError ? 'error' : 'exito'}`;
  notificacion.textContent = mensaje;
  notificacion.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px; border-radius: 5px; z-index: 1000;';
  document.body.appendChild(notificacion);
  
  setTimeout(() => document.body.removeChild(notificacion), 3000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Configurar eventos
  setupEventListeners();
  setupFileInput();
});

function setupEventListeners() {
  // Login
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });

  // Registro
  document.getElementById('registerBtn').addEventListener('click', mostrarRegistro);

  // Menús
  document.getElementById('userBtn').addEventListener('click', () => toggleDropdown('dropdownMenu'));
  document.getElementById('menuBtn').addEventListener('click', () => toggleDropdown('dropdownMenu'));
  document.getElementById('userBtnAnalisis').addEventListener('click', () => toggleDropdown('dropdownMenuAnalisis'));
  document.getElementById('menuBtnAnalisis').addEventListener('click', () => toggleDropdown('dropdownMenuAnalisis'));
  document.getElementById('userBtnReportes').addEventListener('click', () => toggleDropdown('dropdownMenuReportes'));
  document.getElementById('menuBtnReportes').addEventListener('click', () => toggleDropdown('dropdownMenuReportes'));

  // Navegación
  document.getElementById('analisisLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarAnalisis();
  });
  document.getElementById('reportesLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarReportes();
  });
  document.getElementById('logoutLink').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });
  document.getElementById('presupuestoLink').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });
  document.getElementById('reportesLinkAnalisis').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarReportes();
  });
  document.getElementById('logoutLinkAnalisis').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });
  document.getElementById('presupuestoLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarPresupuesto();
  });
  document.getElementById('analisisLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    mostrarAnalisis();
  });
  document.getElementById('logoutLinkReportes').addEventListener('click', function(e) {
    e.preventDefault();
    cerrarSesion();
  });

  // Botones
  document.getElementById('backBtn').addEventListener('click', mostrarPresupuesto);
  document.getElementById('volverBtn').addEventListener('click', mostrarAnalisis);
  document.getElementById('closeModal').addEventListener('click', cerrarModal);
  document.getElementById('generateAnalysis').addEventListener('click', generarAnalisis);
  document.getElementById('generateReportBtn').addEventListener('click', generarReporte);
  document.getElementById('exportPdfBtn').addEventListener('click', exportarPDF);
  document.getElementById('downloadTemplate').addEventListener('click', descargarPlantilla);
  document.getElementById('googleSheetsBtn').addEventListener('click', conectarGoogleSheets);
}

function setupFileInput() {
  if (currentFileInput) {
    currentFileInput.removeEventListener('change', handleFileUpload);
  }
  
  const fileInput = document.getElementById('excelInput');
  fileInput.value = '';
  fileInput.addEventListener('change', handleFileUpload);
  currentFileInput = fileInput;
}

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      excelData = XLSX.utils.sheet_to_json(firstSheet, { header: ['item', 'planificado', 'real'] });
      const html = XLSX.utils.sheet_to_html(firstSheet);
      
      document.getElementById('excelPreview').innerHTML = html;
      abrirModal();
    } catch (error) {
      alert('Error al leer el archivo: ' + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

//PARA EL EXCEL
function abrirModal() {
  document.getElementById('excelModal').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('excelModal').style.display = 'none';
}

function generarAnalisis() {
  if (excelData.length === 0) {
    alert('No hay datos para analizar');
    return;
  }
  
  procesarDatosAnalisis(excelData);
  cerrarModal();
  mostrarAnalisis();
}

function procesarDatosAnalisis(data) {
  const tbody = document.getElementById('analisisTableBody');
  const alertBox = document.getElementById('alertBox');
  let alertHTML = '<h3>Alertas:</h3><ul>';
  let hasAlerts = false;
  
  tbody.innerHTML = '';
  
  data.slice(1).forEach(row => {
    if (!row.item || row.item.toString().trim() === '') return;
    
    const cleanPlanificado = parseFloat(row.planificado?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const cleanReal = parseFloat(row.real?.toString().replace(/[^0-9.-]/g, '')) || 0;
    const diferencia = cleanReal - cleanPlanificado;
    const porcentaje = cleanPlanificado !== 0 ? ((diferencia / cleanPlanificado) * 100).toFixed(1) : 0;
    
    const rowHTML = `
      <tr>
        <td>${row.item}</td>
        <td>S/${cleanPlanificado.toLocaleString('es-PE')}</td>
        <td>S/${cleanReal.toLocaleString('es-PE')}</td>
        <td class="${diferencia >= 0 ? 'up' : 'down'}">
          ${Math.abs(porcentaje)}% ${diferencia >= 0 ? '▲' : '▼'}
        </td>
      </tr>
    `;
    tbody.innerHTML += rowHTML;
    
    if (Math.abs(porcentaje) > 10) {
      hasAlerts = true;
      alertHTML += `
        <li>
          <strong>${row.item}:</strong> ${diferencia >= 0 ? '+' : ''}${porcentaje}% 
          (S/${Math.abs(diferencia).toLocaleString('es-PE')})
        </li>
      `;
    }
  });
  
  alertHTML += '</ul>';
  alertBox.innerHTML = hasAlerts ? alertHTML : '<p>No hay alertas significativas</p>';
}



//PARA ENTRAR AL GOOGLE SHEET
// Reemplaza la URL existente con esta
  const googleBtn = document.querySelector('.google-btn');
  if(googleBtn) {
    googleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.open('https://docs.google.com/spreadsheets/d/1UR2uZN4uSN6sK_7DhIF4ls16ipNXdcQbz5n23puVBwI/edit#gid=0', '_blank');
    });
  } else {
    console.error('Botón Google Sheets no encontrado');
  }

// En la función mostrarAnalisis:
function mostrarAnalisis() {
  ocultarTodasSecciones();
  document.getElementById("analisisSection").style.display = "block";
  
  // Usar datosAnalisis en lugar de excelData
  if (datosAnalisis.length > 0) {
    actualizarTabla(datosAnalisis);
  }
}
//ANALISIS DE DESVIACIONES
// Agregar estas funciones

async function cargarDatosGoogleSheets() {
  try {
    const timestamp = Date.now();
    const url = `${GOOGLE_SHEET_URL}&t=${timestamp}`; // Cache busting
    
    console.log("Iniciando carga...");
    const startTime = performance.now(); // Medición de tiempo
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const csvData = await response.text();
    console.log("Tiempo de respuesta:", (performance.now() - startTime).toFixed(2) + "ms");
    
    datosAnalisis = procesarCSV(csvData);
    return true;
    
  } catch (error) {
    console.error("Error en carga:", error);
    mostrarNotificacion('Error de conexión. Intenta nuevamente', true);
    return false;
  }
}

function procesarCSV(csv) {
  return csv
    .split('\n')
    .slice(1)
    .filter(row => row.trim() !== '')
    .map(row => {
      // Manejar diferentes formatos de CSV
      const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
                        .map(c => c.replace(/^"|"$/g, '').trim());
      
      // Verificar estructura de datos
      if (columns.length < 3) {
        console.error('Fila inválida:', row);
        return null;
      }
      
      return {
        item: columns[0],
        planificado: parseFloat(columns[1].replace(/[^0-9.-]/g, '')) || 0,
        real: parseFloat(columns[2].replace(/[^0-9.-]/g, '')) || 0
      };
    })
    .filter(item => item !== null); // Filtrar filas inválidas
}

document.getElementById('generarAnalisisBtn').addEventListener('click', async function() {
  try {
    // 1. Siempre cargar datos frescos de Google Sheets
    const exito = await cargarDatosGoogleSheets();
    
    if(!exito) {
      mostrarNotificacion('Error al cargar datos del Sheet', true);
      return;
    }
    
    // 2. Verificar si realmente hay datos
    if(datosAnalisis.length === 0) {
      mostrarNotificacion('El Google Sheet está vacío', true);
      return;
    }
    
    // 3. Mostrar análisis
    mostrarAnalisis();
    actualizarTabla(datosAnalisis);
    
  } catch (error) {
    console.error("Error general:", error);
    mostrarNotificacion('Error crítico. Ver consola', true);
  }
});

function actualizarTabla(datos) {
  const tbody = document.getElementById('analisisTableBody');
  const alertBox = document.getElementById('alertBox');
  
  tbody.innerHTML = '';
  alertBox.innerHTML = '';
  let alertas = [];

  datos.forEach(item => {
    const diferencia = item.real - item.planificado;
    const porcentaje = item.planificado !== 0 
      ? ((diferencia / item.planificado) * 100).toFixed(1)
      : 0;

    const rowHTML = `
      <tr>
        <td>${item.item}</td>
        <td>S/${item.planificado.toLocaleString('es-PE')}</td>
        <td>S/${item.real.toLocaleString('es-PE')}</td>
        <td class="${diferencia >= 0 ? 'up' : 'down'}">
          ${Math.abs(porcentaje)}% ${diferencia >= 0 ? '▲' : '▼'}
        </td>
      </tr>
    `;
    tbody.innerHTML += rowHTML;

    if (Math.abs(porcentaje) > 10) {
      alertas.push(`
        <li>
          <strong>${item.item}:</strong> ${diferencia >= 0 ? '+' : ''}${porcentaje}% 
          (S/${Math.abs(diferencia).toLocaleString('es-PE')})
        </li>
      `);
    }
  });

  if (alertas.length > 0) {
    alertBox.innerHTML = `
      <h3>Alertas:</h3>
      <ul>${alertas.join('')}</ul>
    `;
  } else {
    alertBox.innerHTML = '<p>No hay alertas significativas</p>';
  }
}

async function actualizarDatos() {
  const loader = document.createElement('div');
  loader.className = 'loader';
  document.body.appendChild(loader);

  try {
    await cargarDatosGoogleSheets();
    console.log("Datos listos para actualizar tabla:", datosAnalisis); // 🟢
    
    if(datosAnalisis.length === 0) {
      throw new Error("No hay datos después de procesar");
    }
    
    actualizarTabla(datosAnalisis);
    mostrarNotificacion('Datos actualizados correctamente');
    
  } catch (error) {
    console.error("Error en actualizarDatos:", error); // 🔴
    mostrarNotificacion('Error: Ver consola para detalles', true);
    
  } finally {
    document.body.removeChild(loader);
  }
}

// REPORTES / CHARTS
// Función para generar gráficos
function mostrarReportes() {
  ocultarTodo();
  document.getElementById("reportesSection").style.display = "block";
  cargarGraficos(); // Asegúrate que esta función existe
}

function cargarGraficos() {
  const items = datosAnalisis.map(item => item.item);
  const planificado = datosAnalisis.map(item => item.planificado);
  const real = datosAnalisis.map(item => item.real);

  // Gráfico de líneas (Tendencia)
  new Chart(document.getElementById("lineChart").getContext("2d"), {
    type: "line",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
      datasets: [{
        label: "Planificado",
        data: [20000, 22000, 21000, 23000, 22500, 24000],
        borderColor: "#4e4376",
        tension: 0.3
      }, {
        label: "Real",
        data: [18500, 21500, 20500, 22500, 22000, 23500],
        borderColor: "#2b5876",
        tension: 0.3
      }]
    }
  });

  // Gráfico de barras (Comparación)
  new Chart(document.getElementById("barChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: items,
      datasets: [{
        label: "Planificado",
        data: planificado,
        backgroundColor: "#4e4376"
      }, {
        label: "Real",
        data: real,
        backgroundColor: "#2b5876"
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Exportación a PDF
document.getElementById("exportPdf").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Capturar el contenido con html2canvas
  const reportContent = document.getElementById("reportesSection");
  
  // Configurar opciones de captura
  const options = {
    scale: 2, // Mejor calidad
    useCORS: true // Permitir recursos cruzados
  };

  // Usar html2canvas para convertir a imagen
  const canvas = await html2canvas(reportContent, options);
  const imgData = canvas.toDataURL('image/png');
  
  // Calcular dimensiones
  const imgWidth = doc.internal.pageSize.getWidth() - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Agregar imagen al PDF
  doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  
  // Guardar PDF
  doc.save('reporte-costos.pdf');
});




// Funciones de navegación
function toggleDropdown(id) {
  const dropdown = document.getElementById(id);
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function mostrarLogin() {
  ocultarTodasSecciones();
  document.getElementById('loginSection').style.display = 'flex';
}

function mostrarPresupuesto() {
  ocultarTodasSecciones();
  document.getElementById('presupuestoSection').style.display = 'block';
  setupFileInput();
}

function mostrarAnalisis() {
  ocultarTodasSecciones();
  document.getElementById('analisisSection').style.display = 'block';
  document.getElementById('generateReportBtn').style.display = 'block';
  
  if (excelData.length > 0) {
    procesarDatosAnalisis(excelData);
  }
}

function mostrarReportes() {
  ocultarTodasSecciones();
  document.getElementById('reportesSection').style.display = 'block';
  document.getElementById('generateReportBtn').style.display = 'none';
  
  if (!window.chartsInitialized) {
    inicializarGraficos();
  }
}

function ocultarTodasSecciones() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('presupuestoSection').style.display = 'none';
  document.getElementById('analisisSection').style.display = 'none';
  document.getElementById('reportesSection').style.display = 'none';
}

function generarReporte() {
  mostrarReportes();
}

function inicializarGraficos() {
  // Destruir gráficos existentes
  if (tendenciaChart) tendenciaChart.destroy();
  if (comparacionChart) comparacionChart.destroy();

  // Datos de ejemplo (deberían venir del Excel)
  const datosTendencia = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Planificado',
        data: [15000, 14500, 16000, 15500, 17000, 16500],
        borderColor: '#4e4376',
        backgroundColor: 'rgba(78, 67, 118, 0.1)',
        tension: 0.3
      },
      {
        label: 'Real',
        data: [18500, 15200, 16800, 16200, 17500, 18000],
        borderColor: '#2b5876',
        backgroundColor: 'rgba(43, 88, 118, 0.1)',
        tension: 0.3
      }
    ]
  };

  const datosComparacion = {
    labels: ['Materiales', 'Mano de obra', 'Equipos', 'Subcontratos', 'Gastos generales'],
    datasets: [
      {
        label: 'Planificado',
        data: [15000, 20000, 8000, 12000, 5000],
        backgroundColor: '#4e4376'
      },
      {
        label: 'Real',
        data: [18500, 22300, 7200, 15750, 4800],
        backgroundColor: '#2b5876'
      }
    ]
  };

  // Crear gráficos
  tendenciaChart = new Chart(
    document.getElementById('tendenciaChart'),
    {
      type: 'line',
      data: datosTendencia,
      options: { responsive: true }
    }
  );

  comparacionChart = new Chart(
    document.getElementById('comparacionChart'),
    {
      type: 'bar',
      data: datosComparacion,
      options: { responsive: true }
    }
  );

  window.chartsInitialized = true;
}

function exportarPDF() {
  const exportBtn = document.getElementById('exportPdfBtn');
  exportBtn.disabled = true;
  exportBtn.textContent = 'Generando PDF...';

  // 1. Forzar renderizado de gráficos
  if (tendenciaChart) {
    tendenciaChart.update();
    tendenciaChart.render();
  }
  if (comparacionChart) {
    comparacionChart.update();
    comparacionChart.render();
  }

  // 2. Ocultar elementos innecesarios
  document.querySelectorAll('.reportes-actions, .user-menu').forEach(el => {
    el.style.visibility = 'hidden';
  });

  // 3. Esperar 500ms para asegurar renderizado
  setTimeout(() => {
    const element = document.getElementById('reportesSection');
    
    // 4. Configuración óptima para html2canvas
    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      backgroundColor: '#FFFFFF'
    };

    // 5. Generar PDF
    html2canvas(element, options).then(canvas => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calcular dimensiones proporcionales
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
      pdf.save('reporte_nanghi.pdf');
      
    }).catch(error => {
      console.error('Error:', error);
      alert('Error al generar PDF. Por favor intente nuevamente.');
    }).finally(() => {
      // Restaurar UI
      document.querySelectorAll('.reportes-actions, .user-menu').forEach(el => {
        el.style.visibility = 'visible';
      });
      exportBtn.disabled = false;
      exportBtn.textContent = 'Exportar como PDF';
    });
  }, 500);
}

function descargarPlantilla() {
  alert("Descargando plantilla...");
  // Implementar descarga real aquí
}

function conectarGoogleSheets() {
  alert("Conectando a Google Sheets...");
  // Implementar conexión real aquí
}

function mostrarRegistro() {
  alert("Función de registro en desarrollo");
}

function cerrarSesion() {
  mostrarLogin();
}

// Iniciar
mostrarLogin();
