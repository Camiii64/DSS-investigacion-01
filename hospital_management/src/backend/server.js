console.log("🔥 ESTE ES MI SERVIDOR REAL");

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
    console.log("Conectado a MySQL");
  }
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM usuarios WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length > 0) {
      res.json({
        success: true,
        role: results[0].rol,
      });
    } else {
      res.json({ success: false });
    }
  });
});

app.post("/register", (req, res) => {
  console.log("BODY RECIBIDO:", req.body);
  const {
    nombre_completo,
    dui,
    telefono,
    tipo_sangre,
    fecha_nacimiento,
    email,
    password
  } = req.body;

  // Insertar en usuarios
  const sqlUsuario =
    "INSERT INTO usuarios (email, password, rol) VALUES (?, ?, 'paciente')";

  db.query(sqlUsuario, [email, password], (err, resultUsuario) => {
    if (err) {
      console.error("Error usuario:", err);
      return res.status(500).json({ success: false, message: "Error al registrar usuario" });
    }

    const usuarioId = resultUsuario.insertId;

    // Insertar en pacientes
    const sqlPaciente = `
      INSERT INTO pacientes 
      (usuario_id, nombre_completo, dui, telefono, tipo_sangre, fecha_nacimiento)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sqlPaciente,
      [usuarioId, nombre_completo, dui, telefono, tipo_sangre, fecha_nacimiento],
      (err2) => {
        if (err2) {
          console.error("Error paciente:", err2);
          return res.status(500).json({ success: false, message: "Error al registrar paciente" });
        }

        res.json({ success: true });
      }
    );
  });
});

// PUERTO DEL SERVIDOR
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



