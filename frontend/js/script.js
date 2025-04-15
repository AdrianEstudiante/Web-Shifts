document.getElementById('turno-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const cedula = document.getElementById('cedula').value;
  const estudio = document.getElementById('estudio').value;

  // Enviar los datos al backend para solicitar un turno
  const response = await fetch('http://localhost:3000/api/solicitar-turno', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombre, cedula, estudio }),
  });

  const result = await response.json();
  if (response.ok) {
    alert(result.message);
    obtenerTurnos();  // Actualizar la lista de turnos después de solicitar uno
    // Limpiar los campos del formulario
    document.getElementById('turno-form').reset();
  } else {
    alert(result.error);
  }
});

// Obtener los turnos desde el backend y mostrar en la lista
async function obtenerTurnos() {
  const response = await fetch('http://localhost:3000/api/turnos');
  const turnos = await response.json();
  
  const lista = document.getElementById('turnos-lista');
  lista.innerHTML = '';  // Limpiar la lista antes de llenarla nuevamente
  
  turnos.forEach(turno => {
    const div = document.createElement('div');
    div.innerHTML = `Nombre: ${turno.nombre} | Cédula: ${turno.cedula} | Estudio: ${turno.estudio}`;
    lista.appendChild(div);
  });
}
// Función para enviar un turno a estudio
async function enviarAEstudio(id, estudio) {
try {
  const response = await fetch(`/api/enviar-turno/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modulo_estudio: estudio })
  });

  const data = await response.json();
  alert(data.message);
  cargarTurnosPendientes(); // Recargar la tabla después de enviar
} catch (error) {
  console.error('Error al enviar el turno a estudio:', error);
  alert('Error al enviar el turno a estudio');
}
}

// Cargar los turnos al iniciar la página
obtenerTurnos();