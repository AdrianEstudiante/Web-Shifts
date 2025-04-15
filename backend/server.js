// Importamos las dependencias necesarias
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

// Creamos la aplicación Express
const app = express();
const port = 3000;

// Configuración de la conexión a MySQL (Puerto 3310)
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3310,  
  user: 'root', 
  password: 'root', 
  database: 'turnero' //nombre base de datos
});

// Conexión a la base de datos MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos exitosa');
});

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

/*
// Ruta para crear el turno un turno (cliente)
app.post('/api/solicitar-turno', (req, res) => {
  const { nombre, cedula, estudio, financiamiento, preferencial } = req.body;
  
  // Verificar si los datos están presentes
  if (!nombre || !cedula || !estudio) {
    return res.status(400).json({ error: 'Faltan datos en la solicitud' });
  }

  // Aquí vamos a insertar el turno en la base de datos, en la base de datos esta nombre_vliente, cedula_cliente, tener ojo con eso
  const query = 'INSERT INTO turnos (nombre_cliente, cedula_cliente, estudio, estado, tipo_financiamiento, preferencial) VALUES (?, ?, ?,"pendiente",?,?)';
  
  connection.query(query, [nombre, cedula, estudio, financiamiento, preferencial], (err, results) => {
    if (err) {
      console.error('Error al insertar el turno:', err);
      return res.status(500).json({ error: 'Error al solicitar el turno' });
    }
    res.status(200).json({ message: 'Turno solicitado correctamente' });
  });
});
*/
app.post('/api/solicitar-turno', (req, res) => {
  const { nombre, cedula, estudio, financiamiento, preferencial, modulo_estudio } = req.body;

  // Validar que todos los datos requeridos estén presentes
  if (!nombre || !cedula || !estudio) {
    return res.status(400).json({ error: 'Faltan datos en la solicitud' });
  }

  // 1. OBTENER EL ÚLTIMO MÓDULO DE RECEPCIÓN ASIGNADO
  const getLastReceptionistQuery = `SELECT recepcionista_id FROM turnos ORDER BY id DESC LIMIT 1`;

  connection.query(getLastReceptionistQuery, (err, results) => {
    if (err) {
      console.error('Error al obtener el último recepcionista:', err);
      return res.status(500).json({ error: 'Error al obtener el recepcionista anterior' });
    }

    // Determinar el siguiente módulo de recepción (rotación del 1 al 4)
    const ultimoRecepcionista = results[0] ? parseInt(results[0].recepcionista_id) : 0;
    const nuevoRecepcionista = (ultimoRecepcionista % 4) + 1; // Si es 4, vuelve a 1

    // 2. ASIGNACIÓN SEGÚN EL TIPO DE ESTUDIO
    if (estudio === 'Radiografía') {
      // Si el estudio es "Radiografía", obtener el último módulo de Radiografía asignado
      const getLastRadiografiaQuery = `SELECT modulo_estudio FROM turnos WHERE estudio = 'Radiografía' ORDER BY id DESC LIMIT 1`;

      connection.query(getLastRadiografiaQuery, (err, results) => {
        if (err) {
          console.error('Error al obtener el último módulo de Radiografía:', err);
          return res.status(500).json({ error: 'Error al obtener el módulo anterior' });
        }

        // Determinar el siguiente módulo de Radiografía (rotación del 1 al 3)
        const ultimoModulo = results[0] ? parseInt(results[0].modulo_estudio) : 0;
        const nuevoModulo = (ultimoModulo % 3) + 1; // Si es 3, vuelve a 1

        // 3. INSERTAR EL TURNO CON EL MÓDULO DE RADIOGRAFÍA Y RECEPCIONISTA ASIGNADOS
        const insertQuery = `
          INSERT INTO turnos 
          (nombre_cliente, cedula_cliente, estudio, estado, tipo_financiamiento, preferencial, modulo_estudio, recepcionista_id)
          VALUES (?, ?, ?, "pendiente", ?, ?, ?, ?)`;

        connection.query(insertQuery, 
          [nombre, cedula, estudio, financiamiento, preferencial, nuevoModulo, nuevoRecepcionista], 
          (err) => {
            if (err) {
              console.error('Error al insertar el turno:', err);
              return res.status(500).json({ error: 'Error al solicitar el turno' });
            }

            // Confirmación de éxito
            res.status(200).json({ 
              message: 'Turno solicitado correctamente', 
              modulo_estudio: nuevoModulo,
              recepcionista: nuevoRecepcionista
            });
        });
      });
    } else {
      // Si el estudio NO es "Radiografía", asignar siempre el módulo 1
      const insertQuery = `
        INSERT INTO turnos 
        (nombre_cliente, cedula_cliente, estudio, estado, tipo_financiamiento, preferencial, modulo_estudio, recepcionista_id)
        VALUES (?, ?, ?, "pendiente", ?, ?, ?, ?)`;

      connection.query(insertQuery, 
        [nombre, cedula, estudio, financiamiento, preferencial, 1, nuevoRecepcionista], 
        (err) => {
          if (err) {
            console.error('Error al insertar el turno:', err);
            return res.status(500).json({ error: 'Error al solicitar el turno' });
          }

          // Confirmación de éxito
          res.status(200).json({ 
            message: 'Turno solicitado correctamente', 
            modulo_estudio: 1,
            recepcionista: nuevoRecepcionista
          });
      });
    }
  });
});




// Ruta para obtener los turnos (para los recepcionistas)
app.get('/api/turnos', (req, res) => {
  const query = "SELECT * FROM turnosphp WHERE estado = 'pendiente'";
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los turnos:', err);
      return res.status(500).json({ error: 'Error al obtener los turnos' });
    }
    res.json(results);
  });
});


/*
// Ruta recepcion modificar informacion del turno en estado pendiente
app.put('/api/actualizar-datos-turno/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, estudio, financiamiento, preferencial } = req.body;

  const query = 'UPDATE turnos SET nombre_cliente = ?, cedula_cliente = ?, estudio = ?, tipo_financiamiento = ?, preferencial = ? WHERE id = ?';
    connection.query(query, [nombre, cedula, estudio, financiamiento, preferencial, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar turno:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json({ message: 'Turno actualizado correctamente' });
    });
});
*/
app.put('/api/actualizar-datos-turno/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, estudio, financiamiento, preferencial, modulo_estudio, recepcionista_id } = req.body;

  if (!nombre || !cedula || !estudio || !financiamiento || !preferencial|| !modulo_estudio || !recepcionista_id) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = `
      UPDATE turnos 
      SET nombre_cliente = ?, 
          cedula_cliente = ?, 
          estudio = ?, 
          tipo_financiamiento = ?, 
          preferencial = ?,
          modulo_estudio = ?, 
          recepcionista_id = ? 
      WHERE id = ?`;

  connection.query(query, [nombre, cedula, estudio, financiamiento, preferencial,modulo_estudio,recepcionista_id,  id], (err, result) => {
      if (err) {
          console.error('Error al actualizar turno:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'El turno no fue encontrado' });
      }
      res.json({ message: 'Turno actualizado correctamente' });
  });
});



// Ruta para eliminar un turno (para los recepcionistas)
app.delete('/api/eliminar-turno/:id', (req, res) => {
  const turnoId = req.params.id;
  const query = 'DELETE FROM turnos WHERE id = ?';

  connection.query(query, [turnoId], (err, result) => {
    if (err) {
      console.error('Error al eliminar el turno:', err);
      return res.status(500).json({ error: 'Error al eliminar el turno' });
    }
    res.status(200).json({ message: 'Turno eliminado correctamente' });
  });
});

//Ruta para gestion del turno, enviarlo a la siguiente etapa - Enviar turno
app.put('/api/actualizar-estado-turno/:id', (req, res) => {
  const { id } = req.params;
  const { estado, recepcionista_id, modulo_estudio } = req.body;

  const query = `
    UPDATE turnos 
    SET estado = ?, recepcionista_id = ?, modulo_estudio = ?
    WHERE id = ?`;

  connection.query(query, [estado, recepcionista_id, modulo_estudio, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el turno:', err);
      return res.status(500).json({ error: 'Error al actualizar el turno' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    res.json({ message: 'Turno actualizado correctamente' });
  });
});

// Ruta para enviar un turno a los últimos cuatro
app.put('/api/enviar-turno/:id', (req, res) => {
  const { id } = req.params;
  const { modulo_estudio } = req.body; // Ejemplo: "Radiografía #1"

  const query = `
    UPDATE turnos 
    SET estado = 'enviado', modulo_estudio = ?
    WHERE id = ?`;

  connection.query(query, [modulo_estudio, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el turno:', err);
      return res.status(500).json({ error: 'Error al enviar el turno' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    res.json({ message: 'Turno enviado correctamente' });
  });
});

// Ruta para obtener los últimos cuatro turnos por módulo
app.get('/api/ultimos-cuatro/:modulo_estudio', (req, res) => {
  const { modulo_estudio } = req.params;

  const query = `
    SELECT * FROM turnos
    WHERE modulo_estudio = ? AND estado = 'confirmado'
    ORDER BY actualizado_en DESC
    LIMIT 4`;

  connection.query(query, [modulo_estudio], (err, results) => {
    if (err) {
      console.error('Error al obtener los últimos cuatro turnos:', err);
      return res.status(500).json({ error: 'Error al obtener los turnos' });
    }
    res.json(results);
  });
});

// Ruta para eliminar turnos más antiguos si exceden los cuatro
app.delete('/api/eliminar-turnos-viejos/:modulo_estudio', (req, res) => {
  const { modulo_estudio } = req.params;

  const query = `
    DELETE FROM turnos 
    WHERE id NOT IN (
      SELECT id 
      FROM (
        SELECT id
        FROM turnos
        WHERE modulo_estudio = ? AND estado = 'enviado'
        ORDER BY actualizado_en ASC
        LIMIT 4
      ) AS subquery
    ) AND modulo_estudio = ? AND estado = 'enviado'`;

  connection.query(query, [modulo_estudio, modulo_estudio], (err, result) => {
    if (err) {
      console.error('Error al eliminar turnos viejos:', err);
      return res.status(500).json({ error: 'Error al eliminar turnos viejos' });
    }
    res.json({ message: 'Turnos antiguos eliminados correctamente' });
  });
});


//Ruta para mostrar los ultimos cuatro turnos de cada estudio
app.get('/api/ultimos-turnos', (req, res) => {
  const query = `
    SELECT * FROM turnos 
    WHERE estado IN ('pendiente', 'en_estudio')
    ORDER BY fecha_hora DESC
    LIMIT 4`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los turnos:', err);
      return res.status(500).json({ error: 'Error al obtener los turnos' });
    }
    res.json(results);
  });
});

//Ruta para llamar un turno desde el estudio(Nodificar)
app.put('/api/llamar-turno-estudio/:id', (req, res) => {
  const { id } = req.params;
  const { modulo_estudio } = req.body;

  const query = `
    UPDATE turnos 
    SET estado = 'en_estudio', modulo_estudio = ?
    WHERE id = ?`;

  connection.query(query, [modulo_estudio, id], (err, result) => {
    if (err) {
      console.error('Error al llamar el turno:', err);
      return res.status(500).json({ error: 'Error al llamar el turno' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    res.json({ message: 'Turno llamado correctamente' });
  });
});
// Ruta para llamar a un turno recepcionistas (se ve reflejado en "turnos.html")
app.put('/api/llamar-turno/:id', async (req, res) => {
  const { id } = req.params;
  const { modulo_estudio } = req.body;

  try {
      await connection.promise().query('UPDATE turnos SET estado = "recepcion", modulo_estudio = ? WHERE id = ?',
          [modulo_estudio, id]
      );
      res.json({ message: 'Turno llamado correctamente' });
  } catch (error) {
      console.error('Error al llamar turno:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener solo los turnos pendientes
app.get('/api/turnos-pendientes', async (req, res) => {
  try {
      const [rows] = await connection.promise().query("SELECT * FROM turnos WHERE estado IN ('pendiente', 'recepcion') ORDER BY fecha_hora DESC");
      res.json(rows);
  } catch (error) {
      console.error('Error al obtener turnos pendientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener solo los turnos llamados (para "turnos.html")
app.get('/api/turnos-llamados', async (req, res) => {
  try {
      const [turnos] = await connection.promise().query('SELECT * FROM turnos WHERE estado = "recepcion" OR estado = "Llamado" ');
      res.json(turnos);
  } catch (error) {
      console.error('Error al obtener turnos llamados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/turnos/enviar-al-estudio/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el tipo de estudio y el módulo de estudio actual
    const [turno] = await connection.promise().query(
      'SELECT estudio, modulo_estudio FROM turnos WHERE id = ?',
      [id]
    );

    if (turno.length === 0) {
      return res.status(404).json({ success: false, message: "Turno no encontrado." });
    }

    let moduloEstudio = turno[0].modulo_estudio; // Mantener el valor actual por defecto

    // Asignar módulo de estudio según el tipo de estudio
    if (["Radiografía", "Mamografía", "Osteodensitometría"].includes(turno[0].estudio)) {
      moduloEstudio = 1;
    } else if (turno[0].estudio === "Ecografía") {
      moduloEstudio = Math.floor(Math.random() * 3) + 1; // Genera 1, 2 o 3
    }

    // Actualizar el estado y el módulo de estudio
    const [results] = await connection.promise().query(
      'UPDATE turnos SET estado = "enviado", modulo_estudio = ? WHERE id = ?',
      [moduloEstudio, id]
    );

    res.json({ success: true, message: "Turno enviado al estudio." });
  } catch (error) {
    console.error("Error al actualizar el turno:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});









//
//Llamar turno estudio
app.put('/api/turnos/llamar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await connection.promise().query('UPDATE turnos SET estado = "Llamado" WHERE id = ?', [id]);
    res.json({ success: true, message: "Turno llamado." });
  } catch (error) {
    console.error("Error al llamar el turno:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});
//Eliminar
app.delete('/api/turnos/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await connection.promise().query('DELETE FROM turnos WHERE id = ?', [id]);
    res.json({ success: true, message: "Turno eliminado." });
  } catch (error) {
    console.error("Error al eliminar el turno:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});
//Cerrar
app.put('/api/turnos/cerrar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await connection.promise().query('UPDATE turnos SET estado = "completado" WHERE id = ?', [id]);
    res.json({ success: true, message: "Turno cerrado." });
  } catch (error) {
    console.error("Error al cerrar el turno:", error);
    res.status(500).json({ success: false, message: "Error en el servidor." });
  }
});

let recepcionistaActual = 1; // Variable para asignación rotativa

app.get('/api/turnos-recepcion/:recepcionista', (req, res) => {
  const { recepcionista } = req.params;

  const query = `
    SELECT * FROM turnos
    WHERE recepcionista_id = ? AND estado IN ('pendiente', 'recepcion')`;

  connection.query(query, [recepcionista], (err, results) => {
    if (err) {
      console.error('Error al obtener los turnos del recepcionista:', err);
      return res.status(500).json({ error: 'Error al obtener los turnos del recepcionista' });
    }
    res.json(results);
  });
});


//---------------------------Turnos por Estudio---------------------
//Radiografia 
app.get('/api/turnos-pendientes/radiografia/:modulo_estudio', (req, res) => {
  const { modulo_estudio } = req.params;

  const query = `
    SELECT * FROM turnos
    WHERE estudio = "Radiografía"
    AND modulo_estudio = ?
    AND estado IN ('pendiente', 'enviado')
    ORDER BY id ASC`;

  connection.query(query, [modulo_estudio], (err, results) => {
      if (err) {
          console.error('Error al obtener los turnos de Radiografía:', err);
          return res.status(500).json({ error: 'Error al obtener los turnos de Radiografía' });
      }
      res.json(results);
  });
});

/*
app.get('/api/turnos-pendientes/radiografia/', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`SELECT * FROM turnos WHERE estudio = "Radiografía" AND estado = "enviado" ORDER BY id ASC`);

    // Agregar un campo 'panel' para distribuir los turnos en Radiografía 1, 2 y 3
    const turnosDistribuidos = rows.map((turno, index) => ({...turno, panel: (index % 3) + 1 // Asigna panel 1, 2 o 3 de forma cíclica
    }));

    res.json(turnosDistribuidos);
  } catch (error) {
    console.error('Error al cargar turnos de Radiografía:', error);
    res.status(500).json({ success: false, message: "Error al cargar los turnos." });
  }
});
*/

//Mamografía
app.get('/api/turnos-pendientes/mamografia', async (req, res) => {
  try {
    const [rows] = await connection.promise().query('SELECT * FROM turnos WHERE estudio = "Mamografía" AND estado = "enviado"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al cargar los turnos de Mamografía." });
  }
});

//Ecografía
app.get('/api/turnos-pendientes/ecografia', async (req, res) => {
  try {
    const [rows] = await connection.promise().query('SELECT * FROM turnos WHERE estudio = "Ecografía" AND estado = "enviado"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al cargar los turnos de Ecografía." });
  }
});

//Osteodensitometría
app.get('/api/turnos-pendientes/osteodensitometria', async (req, res) => {
  try {
    const [rows] = await connection.promise().query('SELECT * FROM turnos WHERE estudio = "Osteodensitometría" AND estado = "enviado"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al cargar los turnos de Osteodensitometría." });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});