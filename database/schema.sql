CREATE DATABASE turnero;
USE turnero;

CREATE TABLE turnos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre_cliente VARCHAR(100) NOT NULL,
    cedula_cliente VARCHAR(20) NOT NULL,
    estudio ENUM('Radiografía', 'Mamografía', 'Ecografía', 'Osteodensitometría') NOT NULL,
    estado ENUM('pendiente', 'recepcion', 'confirmado', 'en_estudio', 'completado', 'enviado', 'Llamado') DEFAULT 'pendiente',
    recepcionista_id INT,
    modulo_estudio ENUM('1', '2', '3', 'Mamografía', 'Radiografía', 'Osteodensitometría', 'Ecografía') NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    tipo_financiamiento ENUM('EPS', 'MP', 'ASEG', 'PART', 'MAG', 'IPS') NOT NULL,
    preferencial ENUM('SI', 'NO') NOT NULL DEFAULT 'NO',
    PRIMARY KEY (id)
);