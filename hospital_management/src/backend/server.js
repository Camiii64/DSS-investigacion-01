console.log("🔥 SERVIDOR MEDICONNECT - LOGIN, REGISTRO Y GESTIÓN DE CITAS");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(cors({origin: "http://localhost:5173"}));
app.use(express.json());

// ================================
// 🔌 CONEXIÓN A MYSQL
// ================================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  //ssl: { rejectUnauthorized: true } // 🔥 ESTO ES OBLIGATORIO PARA AZURE
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL exitosamente");
  }
});


// ==========================================
// 🔐 SISTEMA DE AUTENTICACIÓN
// ==========================================

// LOGIN (ACTUALIZADO CON BCRYPT)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 1. Buscar al usuario SOLO por su email
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  db.query(sql, [email], async (err, results) => { // <-- Añadimos async al callback
    if (err) {
      console.error("Error en login:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (results.length > 0) {
      const usuario = results[0];

      // 2. 🔐 COMPARAR LA CONTRASEÑA ESCRITA CON LA ENCRIPTADA
      const match = await bcrypt.compare(password, usuario.password);

      if (match) {
        // Si coinciden, login exitoso
        res.json({
          success: true,
          role: usuario.rol.toLowerCase(),
          id: usuario.id,
          nombre: usuario.nombre
        });
      } else {
        // Si no coinciden
        res.json({ success: false, message: "Credenciales incorrectas" });
      }
    } else {
      // Si el correo no existe
      res.json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});


// REGISTRO PACIENTE
app.post("/register", async (req, res) => { // <-- Añadimos async
  const { nombre_completo, telefono, tipo_sangre, fecha_nacimiento, email, password } = req.body;

  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  try {
    // 🔐 ENCRIPTAR LA CONTRASEÑA ANTES DE GUARDARLA
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Nota: Ahora insertamos hashedPassword en lugar de password
    const sqlUsuario = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'PACIENTE')";

    db.query(sqlUsuario, [nombre_completo, email, hashedPassword], (err, resultUsuario) => {
      if (err) {
        console.error(err);
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ success: false, message: "El correo ya existe" });

        return res.status(500).json({ success: false, message: "Error al registrar" });
      }

      const nuevoId = resultUsuario.insertId;

      const sqlPaciente = "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, ?, ?, ?)";

      db.query(sqlPaciente, [nuevoId, fecha_nacimiento, telefono, tipo_sangre], (err2) => {
        if (err2)
          return res.status(500).json({ success: false, message: "Error al guardar datos médicos" });

        res.json({ success: true, message: "Paciente registrado correctamente" });
      });
    });
  } catch (error) {
    console.error("Error al encriptar:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

//SECCION DE INGRESO DE USUARIOS 

//CREAR ADMINISTRADOR
app.post("/admin/create-admin", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, 'ADMIN')
    `;

    db.query(sql, [nombre, email, hashedPassword], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "El correo ya existe" });
        }
        return res.status(500).json({ error: err });
      }

      res.json({ success: true, message: "Admin creado correctamente" });
    });

  } catch (error) {
    res.status(500).json({ error: "Error encriptando contraseña" });
  }
});

//CREAR DOCTOR
app.post("/admin/create-doctor", async (req, res) => {
  const { nombre, email, password, especialidad, licencia } = req.body;

  if (!nombre || !email || !password || !especialidad || !licencia) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sqlUsuario = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, 'DOCTOR')
    `;

    db.query(sqlUsuario, [nombre, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "El correo ya existe" });
        }
        return res.status(500).json({ error: err });
      }

      const userId = result.insertId;

      const sqlDoctor = `
        INSERT INTO doctores (id, especialidad, licencia_medica)
        VALUES (?, ?, ?)
      `;

      db.query(sqlDoctor, [userId, especialidad, licencia], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2 });
        }

        res.json({ success: true, message: "Doctor creado correctamente" });
      });
    });

  } catch (error) {
    res.status(500).json({ error: "Error encriptando contraseña" });
  }
});

//CREAR PACIENTE (POR ADMIN)
app.post("/admin/create-paciente", async (req, res) => {
  const { nombre, email, password, fecha_nacimiento, telefono, tipo_sangre } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sqlUsuario = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, 'PACIENTE')
    `;

    db.query(sqlUsuario, [nombre, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "El correo ya existe" });
        }
        return res.status(500).json({ error: err });
      }

      const userId = result.insertId;

      const sqlPaciente = `
        INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre)
        VALUES (?, ?, ?, ?)
      `;

      db.query(sqlPaciente, [userId, fecha_nacimiento, telefono, tipo_sangre], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2 });
        }

        res.json({ success: true, message: "Paciente creado correctamente" });
      });
    });

  } catch (error) {
    res.status(500).json({ error: "Error encriptando contraseña" });
  }
});

// ==========================================
// 📅 CITAS - PACIENTE
// ==========================================

// OBTENER CITAS DEL PACIENTE
app.get("/citas/:paciente_id", (req, res) => {
  const { paciente_id } = req.params;

  const sql = `
    SELECT 
      c.id,
      d.especialidad AS doctor_tipo,
      DATE(c.fecha_solicitada) AS fecha,
      TIME(c.fecha_solicitada) AS hora,
      c.estado
    FROM citas c
    JOIN doctores d ON c.doctor_id = d.id
    WHERE c.paciente_id = ?
    ORDER BY c.fecha_solicitada DESC
  `;

  db.query(sql, [paciente_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});


// CREAR NUEVA CITA
app.post("/citas", (req, res) => {
  const { paciente_id, doctorType, date, time, reason } = req.body;

  const sqlDoctor = "SELECT id FROM doctores WHERE especialidad = ? LIMIT 1";

  db.query(sqlDoctor, [doctorType], (err, doctorResults) => {
    if (err) return res.status(500).json({ error: err });

    if (doctorResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay doctor disponible para esa especialidad"
      });
    }

    const doctor_id = doctorResults[0].id;
    const fecha_solicitada = `${date} ${time}:00`;

    const sqlInsert = `
      INSERT INTO citas (paciente_id, doctor_id, fecha_solicitada, motivo, estado)
      VALUES (?, ?, ?, ?, 'PENDIENTE')
    `;

    db.query(sqlInsert, [paciente_id, doctor_id, fecha_solicitada, reason], (err2, result) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: "Error al insertar cita" });
      }

      res.json({ success: true, id: result.insertId });
    });
  });
});


// CANCELAR CITA
app.put("/citas/:id/cancelar", (req, res) => {
  const { id } = req.params;

  const sql = "UPDATE citas SET estado = 'CANCELADA' WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ success: true });
  });
});


// ==========================================
// 👨‍⚕️ CITAS - DOCTOR
// ==========================================

app.get("/doctor/:doctorId/citas", (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT 
      c.id,
      c.fecha_solicitada,
      c.motivo,
      c.estado,
      c.respuesta_doctor,
      u.nombre AS patientName
    FROM citas c
    JOIN doctores d ON c.doctor_id = d.id
    JOIN pacientes p ON c.paciente_id = p.id
    JOIN usuarios u ON p.id = u.id
    WHERE d.especialidad = (
        SELECT especialidad FROM doctores WHERE id = ?
    )
    ORDER BY c.fecha_solicitada ASC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err });
    }

    console.log("CITAS ENCONTRADAS:", results); // ← AGREGA ESTO
    res.json(results);
  });
});



// RESPONDER CITA
app.put("/citas/:id/responder", (req, res) => {
  const { id } = req.params;
  const { estado, respuesta_doctor } = req.body;

  const sql = "UPDATE citas SET estado = ?, respuesta_doctor = ? WHERE id = ?";

  db.query(sql, [estado, respuesta_doctor, id], (err) => {
    if (err) return res.status(500).json({ error: err });

    res.json({ success: true });
  });
});



// ==========================================
// 👑 PANEL DE ADMINISTRADOR
// ==========================================

// 1. Obtener Estadísticas Globales
app.get("/admin/stats", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const [pacientes] = await dbPromise.query("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'PACIENTE'");
    const [doctores] = await dbPromise.query("SELECT COUNT(*) AS total FROM doctores");
    const [citasHoy] = await dbPromise.query("SELECT COUNT(*) AS total FROM citas WHERE DATE(fecha_solicitada) = CURDATE()");
    const [pendientes] = await dbPromise.query("SELECT COUNT(*) AS total FROM citas WHERE estado = 'PENDIENTE'");

    res.json({
      pacientes: pacientes[0].total,
      doctores: doctores[0].total,
      citasHoy: citasHoy[0].total,
      pendientes: pendientes[0].total
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

// 2. Obtener Lista de Pacientes
app.get("/admin/pacientes", (req, res) => {
  db.query("SELECT id, nombre, email FROM usuarios WHERE rol = 'PACIENTE' ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 3. Obtener Lista de Doctores
app.get("/admin/doctores", (req, res) => {
  const sql = `
    SELECT u.id, u.nombre, u.email, d.especialidad 
    FROM usuarios u JOIN doctores d ON u.id = d.id 
    WHERE u.rol = 'DOCTOR' ORDER BY u.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 4. Obtener Todas las Citas (Global)
app.get("/admin/citas", (req, res) => {
  const sql = `
    SELECT c.id, c.fecha_solicitada, c.estado, 
           up.nombre AS paciente_nombre, ud.nombre AS doctor_nombre 
    FROM citas c
    JOIN usuarios up ON c.paciente_id = up.id
    JOIN usuarios ud ON c.doctor_id = ud.id
    ORDER BY c.fecha_solicitada DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 5. Eliminar un Usuario (Paciente o Doctor)
app.delete("/admin/usuarios/:id", (req, res) => {
  // Gracias al "ON DELETE CASCADE" en tu base de datos, borrar al usuario
  // borrará automáticamente sus citas y su perfil de paciente/doctor.
  db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// 6. Eliminar una Cita permanentemente
app.delete("/admin/citas/:id", (req, res) => {
  db.query("DELETE FROM citas WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});