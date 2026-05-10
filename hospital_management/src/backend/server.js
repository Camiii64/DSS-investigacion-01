console.log("🔥 SERVIDOR MEDICONNECT - LOGIN, REGISTRO Y GESTIÓN DE CITAS");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: origen no permitido"));
    }
  }
}));
app.use(express.json());

// ================================
// 🔌 CONEXIÓN A MYSQL
// ================================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar que el pool puede conectarse al arrancar
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err.message);
  } else {
    console.log("✅ Conectado a MySQL exitosamente");
    conn.release();
  }
});

const dbPromise = db.promise();


// ==========================================
// 🔐 SISTEMA DE AUTENTICACIÓN
// ==========================================

// LOGIN (ACTUALIZADO CON BCRYPT)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 1. Buscar al usuario SOLO por su email
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Error en login:", err);
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (results.length === 0) {
      return res.json({ success: false, message: "Credenciales incorrectas" });
    }

    const usuario = results[0];

    try {
      // 2. 🔐 COMPARAR LA CONTRASEÑA ESCRITA CON LA ENCRIPTADA
      const match = await bcrypt.compare(password, usuario.password);

      if (match) {
        res.json({
          success: true,
          role: usuario.rol.toLowerCase(),
          id: usuario.id,
          nombre: usuario.nombre
        });
      } else {
        res.json({ success: false, message: "Credenciales incorrectas" });
      }
    } catch (bcryptError) {
      console.error("Error al comparar contraseña:", bcryptError);
      return res.status(500).json({ error: "Error del servidor" });
    }
  });
});


// REGISTRO PACIENTE
app.post("/register", async (req, res) => {
  const { nombre_completo, telefono, tipo_sangre, fecha_nacimiento, email, password } = req.body;

  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  let conn;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    conn = await dbPromise.getConnection();
    await conn.beginTransaction();

    const [resultUsuario] = await conn.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'PACIENTE')",
      [nombre_completo, email, hashedPassword]
    );
    const nuevoId = resultUsuario.insertId;

    await conn.query(
      "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, ?, ?, ?)",
      [nuevoId, fecha_nacimiento || null, telefono || null, tipo_sangre || null]
    );

    await conn.commit();
    res.json({ success: true, message: "Paciente registrado correctamente" });
  } catch (error) {
    if (conn) await conn.rollback();
    if (error.code === "ER_DUP_ENTRY")
      return res.status(400).json({ success: false, message: "El correo ya existe" });
    console.error("Error en registro:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (conn) conn.release();
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
  const { paciente_id, doctorType, date, time, reason, prioridad } = req.body;
  const prioridadFinal = prioridad === "EMERGENCIA" ? "EMERGENCIA" : "NORMAL";
  const estadoFinal = prioridadFinal === "EMERGENCIA" ? "ACEPTADA" : "PENDIENTE";

  const sqlDoctor = "SELECT id FROM doctores WHERE especialidad = ? LIMIT 1";

  db.query(sqlDoctor, [doctorType], (err, doctorResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (doctorResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay doctor disponible para esa especialidad"
      });
    }

    const doctor_id = doctorResults[0].id;
    const fecha_solicitada = `${date} ${time}:00`;

    const sqlInsert = `
      INSERT INTO citas (paciente_id, doctor_id, fecha_solicitada, motivo, estado, prioridad)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInsert, [paciente_id, doctor_id, fecha_solicitada, reason, estadoFinal, prioridadFinal], (err2, result) => {
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
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

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
      c.prioridad,
      c.respuesta_doctor,
      u.nombre AS patientName
    FROM citas c
    JOIN doctores d ON c.doctor_id = d.id
    JOIN pacientes p ON c.paciente_id = p.id
    JOIN usuarios u ON p.id = u.id
    WHERE d.especialidad = (
        SELECT especialidad FROM doctores WHERE id = ?
    )
    ORDER BY FIELD(c.prioridad,'EMERGENCIA','URGENTE','NORMAL'), c.fecha_solicitada ASC
  `;

  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    res.json(results);
  });
});



// RESPONDER CITA
app.put("/citas/:id/responder", (req, res) => {
  const { id } = req.params;
  const { estado, respuesta_doctor } = req.body;

  const estadosPermitidos = ["ACEPTADA", "CANCELADA"];
  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ success: false, message: "Estado inválido" });
  }

  const sql = "UPDATE citas SET estado = ?, respuesta_doctor = ? WHERE id = ?";

  db.query(sql, [estado, respuesta_doctor, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    res.json({ success: true });
  });
});



// ==========================================
// 👑 PANEL DE ADMINISTRADOR
// ==========================================

// 1. Obtener Estadísticas Globales
app.get("/admin/stats", async (req, res) => {
  try {
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
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
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
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.json(results);
  });
});

// 4. Obtener Todas las Citas (Global)
app.get("/admin/citas", (req, res) => {
  const sql = `
    SELECT c.id, c.fecha_solicitada, c.estado, c.prioridad,
           up.nombre AS paciente_nombre, ud.nombre AS doctor_nombre
    FROM citas c
    JOIN usuarios up ON c.paciente_id = up.id
    JOIN usuarios ud ON c.doctor_id = ud.id
    ORDER BY FIELD(c.prioridad,'EMERGENCIA','URGENTE','NORMAL'), c.fecha_solicitada DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.json(results);
  });
});

// Eliminar todas las cuentas temporales de emergencia
app.delete("/admin/usuarios/temporales", (req, res) => {
  db.query("DELETE FROM usuarios WHERE email LIKE '%@mediconnect.tmp'", (err, result) => {
    if (err) {
      console.error("Error eliminando temporales:", err);
      return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
    res.json({ success: true, eliminados: result.affectedRows });
  });
});

// 5. Eliminar un Usuario (Paciente o Doctor)
app.delete("/admin/usuarios/:id", (req, res) => {
  // Gracias al "ON DELETE CASCADE" en tu base de datos, borrar al usuario
  // borrará automáticamente sus citas y su perfil de paciente/doctor.
  db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.json({ success: true });
  });
});

// 6. Eliminar una Cita permanentemente
app.delete("/admin/citas/:id", (req, res) => {
  db.query("DELETE FROM citas WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.json({ success: true });
  });
});

// Helper: genera un código único de 4 dígitos para acceso de emergencia
async function generarCodigoEmergenciaUnico() {
  for (let intento = 0; intento < 20; intento++) {
    const codigo = String(Math.floor(1000 + Math.random() * 9000));
    const [rows] = await dbPromise.query(
      "SELECT id FROM usuarios WHERE codigo_emergencia = ? LIMIT 1",
      [codigo]
    );
    if (rows.length === 0) return codigo;
  }
  throw new Error("No se pudo generar un código de emergencia único");
}

// EMERGENCIA PÚBLICA — paciente sin cuenta pide atención desde la app
app.post("/emergencia", async (req, res) => {
  const { nombre, especialidad, motivo, email } = req.body;
  if (!nombre || !especialidad || !motivo) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  try {
    let pacienteId = null;
    let pacienteNombre = nombre;
    let esNuevo = false;
    let emailUsado = email || null;
    let codigoEmergencia = null;

    // Si mandó email, buscar si ya existe la cuenta
    if (email) {
      const [existing] = await dbPromise.query(
        "SELECT id, nombre FROM usuarios WHERE email = ? AND rol = 'PACIENTE' LIMIT 1", [email]
      );
      if (existing.length > 0) {
        pacienteId = existing[0].id;
        pacienteNombre = existing[0].nombre;
      }
    }

    // Si no existe, crear cuenta temporal + código de 4 dígitos
    let conn;
    if (!pacienteId) {
      esNuevo = true;
      const ts = Date.now();
      emailUsado = email || `temp_${ts}@mediconnect.tmp`;
      // Password aleatorio interno (el usuario nunca lo verá: entra por código)
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      const passwordInterno = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const hashedPassword = await bcrypt.hash(passwordInterno, saltRounds);
      codigoEmergencia = await generarCodigoEmergenciaUnico();

      conn = await dbPromise.getConnection();
      await conn.beginTransaction();
      try {
        const [rU] = await conn.query(
          "INSERT INTO usuarios (nombre, email, password, rol, codigo_emergencia) VALUES (?, ?, ?, 'PACIENTE', ?)",
          [nombre, emailUsado, hashedPassword, codigoEmergencia]
        );
        pacienteId = rU.insertId;
        await conn.query(
          "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, NULL, NULL, NULL)",
          [pacienteId]
        );
        await conn.commit();
      } catch (inner) {
        await conn.rollback();
        if (inner.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ success: false, message: "El correo ya está registrado. Inicia sesión normalmente." });
        }
        throw inner;
      } finally {
        conn.release();
      }
    }

    // Buscar doctor disponible
    const [doctores] = await dbPromise.query(
      "SELECT d.id, u.nombre FROM doctores d JOIN usuarios u ON d.id = u.id WHERE d.especialidad = ? LIMIT 1",
      [especialidad]
    );
    if (doctores.length === 0) {
      return res.status(400).json({ success: false, message: "No hay doctor disponible para esa especialidad" });
    }
    const doctorId = doctores[0].id;
    const doctorNombre = doctores[0].nombre;

    const fechaAhora = new Date().toISOString().slice(0, 19).replace("T", " ");
    await dbPromise.query(
      "INSERT INTO citas (paciente_id, doctor_id, fecha_solicitada, motivo, estado, prioridad) VALUES (?, ?, ?, ?, 'ACEPTADA', 'EMERGENCIA')",
      [pacienteId, doctorId, fechaAhora, motivo]
    );

    res.json({
      success: true,
      pacienteId,
      pacienteNombre,
      doctorNombre,
      codigoEmergencia, // null si era cuenta existente
      esNuevo
    });
  } catch (error) {
    console.error("Error en emergencia pública:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// LOGIN POR CÓDIGO DE EMERGENCIA (límite: 3 usos)
const MAX_USOS_CODIGO = 3;

app.post("/login-codigo", async (req, res) => {
  const { codigo } = req.body;
  if (!codigo || !/^\d{4}$/.test(String(codigo))) {
    return res.status(400).json({ success: false, message: "Código inválido" });
  }
  try {
    const [rows] = await dbPromise.query(
      "SELECT id, nombre, rol, codigo_emergencia_usos FROM usuarios WHERE codigo_emergencia = ? AND rol = 'PACIENTE' LIMIT 1",
      [String(codigo)]
    );
    if (rows.length === 0) {
      return res.json({ success: false, message: "Código no válido o expirado" });
    }
    const u = rows[0];
    const nuevosUsos = (u.codigo_emergencia_usos || 0) + 1;

    if (nuevosUsos >= MAX_USOS_CODIGO) {
      // Último uso permitido: invalida el código y resetea contador
      await dbPromise.query(
        "UPDATE usuarios SET codigo_emergencia = NULL, codigo_emergencia_usos = 0 WHERE id = ?",
        [u.id]
      );
    } else {
      // Solo incrementa el contador
      await dbPromise.query(
        "UPDATE usuarios SET codigo_emergencia_usos = ? WHERE id = ?",
        [nuevosUsos, u.id]
      );
    }

    const usosRestantes = Math.max(0, MAX_USOS_CODIGO - nuevosUsos);
    res.json({
      success: true,
      id: u.id,
      nombre: u.nombre,
      role: u.rol.toLowerCase(),
      usosRestantes,
      codigoExpirado: usosRestantes === 0
    });
  } catch (error) {
    console.error("Error en login por código:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// 7. Emergencia: registro rápido de paciente con cita inmediata
app.post("/admin/emergencia", async (req, res) => {
  const { nombre, especialidad, motivo } = req.body;
  if (!nombre || !especialidad || !motivo) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  const ts = Date.now();
  const emailTemp = `temp_${ts}@mediconnect.tmp`;
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const passwordTemp = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const hashedPassword = await bcrypt.hash(passwordTemp, saltRounds);

  let conn;
  try {
    conn = await dbPromise.getConnection();
    await conn.beginTransaction();

    const [rUsuario] = await conn.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'PACIENTE')",
      [nombre, emailTemp, hashedPassword]
    );
    const pacienteId = rUsuario.insertId;

    await conn.query(
      "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, NULL, NULL, NULL)",
      [pacienteId]
    );

    const [doctores] = await conn.query(
      "SELECT d.id, u.nombre FROM doctores d JOIN usuarios u ON d.id = u.id WHERE d.especialidad = ? LIMIT 1",
      [especialidad]
    );
    if (doctores.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "No hay doctor disponible para esa especialidad" });
    }
    const doctorId = doctores[0].id;
    const doctorNombre = doctores[0].nombre;

    const fechaAhora = new Date().toISOString().slice(0, 19).replace("T", " ");
    await conn.query(
      "INSERT INTO citas (paciente_id, doctor_id, fecha_solicitada, motivo, estado, prioridad) VALUES (?, ?, ?, ?, 'ACEPTADA', 'EMERGENCIA')",
      [pacienteId, doctorId, fechaAhora, motivo]
    );

    await conn.commit();
    res.json({ success: true, pacienteId, doctorNombre, emailTemp, passwordTemp });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("Error en emergencia:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (conn) conn.release();
  }
});

// 7b. Completar datos de paciente temporal
app.put("/admin/pacientes/:id/completar", async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, fecha_nacimiento, tipo_sangre } = req.body;
  try {
    if (nombre || email) {
      await dbPromise.query(
        "UPDATE usuarios SET nombre = COALESCE(NULLIF(?,  ''), nombre), email = COALESCE(NULLIF(?, ''), email) WHERE id = ?",
        [nombre || "", email || "", id]
      );
    }
    await dbPromise.query(
      "UPDATE pacientes SET telefono = COALESCE(NULLIF(?, ''), telefono), fecha_nacimiento = COALESCE(NULLIF(?, ''), fecha_nacimiento), tipo_sangre = COALESCE(NULLIF(?, ''), tipo_sangre) WHERE id = ?",
      [telefono || "", fecha_nacimiento || "", tipo_sangre || "", id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error completando datos:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// 7c. Listar emergencias del día (para el panel admin)
app.get("/admin/emergencias-hoy", async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT c.id, c.fecha_solicitada, c.motivo, u_p.nombre AS paciente_nombre, u_d.nombre AS doctor_nombre,
             c.prioridad, u_p.email AS paciente_email, c.paciente_id
      FROM citas c
      JOIN usuarios u_p ON c.paciente_id = u_p.id
      JOIN usuarios u_d ON c.doctor_id = u_d.id
      WHERE c.prioridad = 'EMERGENCIA' AND DATE(c.created_at) = CURDATE()
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 8. Crear Usuario (Doctor / Paciente / Admin)
app.post("/admin/crear-usuario", async (req, res) => {
  const { tipo, nombre, email, password, especialidad, licencia_medica, fecha_nacimiento, telefono, tipo_sangre } = req.body;

  if (!tipo || !nombre || !email || !password) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
  }

  const rolesValidos = ["doctor", "paciente", "admin"];
  if (!rolesValidos.includes(tipo)) {
    return res.status(400).json({ success: false, message: "Tipo de usuario inválido" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const rol = tipo.toUpperCase();

    // Admin: sólo tabla usuarios
    if (tipo === "admin") {
      const [result] = await dbPromise.query(
        "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'ADMIN')",
        [nombre, email, hashedPassword]
      );
      return res.json({ success: true, id: result.insertId, message: "Administrador creado correctamente" });
    }

    // Doctor y Paciente: transacción (usuarios + tabla secundaria)
    let conn;
    try {
      conn = await dbPromise.getConnection();
      await conn.beginTransaction();

      const [resultUsuario] = await conn.query(
        "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
        [nombre, email, hashedPassword, rol]
      );
      const nuevoId = resultUsuario.insertId;

      if (tipo === "paciente") {
        await conn.query(
          "INSERT INTO pacientes (id, fecha_nacimiento, telefono, tipo_sangre) VALUES (?, ?, ?, ?)",
          [nuevoId, fecha_nacimiento || null, telefono || null, tipo_sangre || null]
        );
      } else if (tipo === "doctor") {
        if (!especialidad) throw new Error("La especialidad es obligatoria para doctores");
        const licencia = licencia_medica || `MC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        await conn.query(
          "INSERT INTO doctores (id, especialidad, licencia_medica) VALUES (?, ?, ?)",
          [nuevoId, especialidad, licencia]
        );
      }

      await conn.commit();
      res.json({ success: true, id: nuevoId, message: `${tipo === "doctor" ? "Doctor" : "Paciente"} creado correctamente` });
    } catch (innerErr) {
      if (conn) await conn.rollback();
      throw innerErr;
    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error("Error creando usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "El correo ya está registrado en el sistema" });
    }
    res.status(500).json({ success: false, message: error.message || "Error interno del servidor" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
