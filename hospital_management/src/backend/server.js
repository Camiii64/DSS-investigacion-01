console.log("🔥 SERVIDOR MEDICONNECT - LOGIN, REGISTRO Y GESTIÓN DE CITAS");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
  } else {
    console.log("Conectado a MySQL exitosamente");
  }
});

// ==========================================
// 🔐 SISTEMA DE AUTENTICACIÓN
// ==========================================

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Error en login:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (results.length > 0) {
      const usuario = results[0];
      res.json({
        success: true,
        role: usuario.rol.toLowerCase(),
        id: usuario.id, // Enviamos el ID para que el frontend sepa de quién son las citas
        nombre: usuario.nombre
      });
    } else {
      res.json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});

// REGISTRO DE PACIENTE
app.post("/register", (req, res) => {
  const { nombre_completo, telefono, tipo_sangre, fecha_nacimiento, email, password } = req.body;

  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  const sqlUsuario = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'PACIENTE')";

  db.query(sqlUsuario, [nombre_completo, email, password], (err, resultUsuario) => {
    if (err) {
      console.error("Error insertando usuario:", err);
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "El correo ya existe" });
      return res.status(500).json({ success: false, message: "Error al registrar" });
    }

    const nuevoId = resultUsuario.insertId;
    const sqlPaciente = "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, ?, ?, ?)";

    db.query(sqlPaciente, [nuevoId, fecha_nacimiento, telefono, tipo_sangre], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Error al guardar datos médicos" });
      res.json({ success: true, message: "Paciente registrado correctamente" });
    });
  });
});

// ==========================================
// 📅 GESTIÓN DE CITAS (PACIENTE)
// ==========================================

// 1. Obtener citas de un paciente
app.get("/citas/:pacienteId", (req, res) => {
  const { pacienteId } = req.params;
  // Hacemos JOIN con doctores y usuarios para saber el nombre del médico
  const sql = `
    SELECT c.*, u.nombre AS nombre_doctor 
    FROM citas c
    JOIN doctores d ON c.doctor_id = d.id
    JOIN usuarios u ON d.id = u.id
    WHERE c.paciente_id = ? 
    ORDER BY c.fecha_solicitada DESC`;

  db.query(sql, [pacienteId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 2. Solicitar nueva cita
app.post("/citas", (req, res) => {
  const { paciente_id, doctor_id, fecha_solicitada, motivo } = req.body;
  const sql = `
    INSERT INTO citas (paciente_id, doctor_id, fecha_solicitada, motivo, estado) 
    VALUES (?, ?, ?, ?, 'PENDIENTE')`;

  db.query(sql, [paciente_id, doctor_id, fecha_solicitada, motivo], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al insertar cita" });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// ==========================================
// 👨‍⚕️ GESTIÓN DE CITAS (DOCTOR)
// ==========================================

// 1. Obtener citas del doctor conectado
app.get("/doctor/:doctorId/citas", (req, res) => {
  const { doctorId } = req.params;
  const sql = `
    SELECT c.*, u.nombre AS patientName 
    FROM citas c 
    JOIN pacientes p ON c.paciente_id = p.id 
    JOIN usuarios u ON p.id = u.id
    WHERE c.doctor_id = ?
    ORDER BY c.fecha_solicitada ASC`;

  db.query(sql, [doctorId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 2. Aceptar/Rechazar cita (Acción del Doctor)
app.put("/citas/:id/responder", (req, res) => {
  const { id } = req.params;
  const { estado, respuesta_doctor } = req.body; // estado: 'ACEPTADA' o 'RECHAZADA'

  const sql = "UPDATE citas SET estado = ?, respuesta_doctor = ? WHERE id = ?";

  db.query(sql, [estado, respuesta_doctor, id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// 3. Cancelar cita (Acción del Paciente)
app.put("/citas/:id/cancelar", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE citas SET estado = 'CANCELADA' WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});