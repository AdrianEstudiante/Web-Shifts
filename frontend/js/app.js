// Seleccionamos el formulario
const form = document.getElementById('turno-form');

form.addEventListener('submit', function (event) {
    event.preventDefault();  // Evita que el formulario se envíe de forma tradicional

    // Capturamos los datos del formulario
    const nombre = document.getElementById('nombre').value;
    const cedula = document.getElementById('cedula').value;
    const estudio = document.getElementById('estudio').value;
    const financiamiento = document.getElementById('financiamiento').value;  // Capturamos el financiamiento
    const preferencial = document.getElementById('preferencial').value;
    
    // Enviamos los datos al backend usando fetch
    fetch('/api/solicitar-turno', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',  // Indicamos que estamos enviando JSON
        },
        body: JSON.stringify({ nombre, cedula, estudio, financiamiento, preferencial}),  // Enviamos los datos como JSON
    })
    .then(response => response.json())  // Convertimos la respuesta a JSON
    .then(data => {
        console.log(data);  // Mostramos la respuesta del servidor
        alert('Turno solicitado correctamente');
        form.reset();
    })
    .catch(error => {
        console.error('Error al solicitar el turno:', error);
        alert('Hubo un problema al solicitar el turno');
    });
});
