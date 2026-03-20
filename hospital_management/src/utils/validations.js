// ============================================================
// Validaciones compartidas — MediConnect
// ============================================================

/** Correo electrónico con formato válido */
export function validateEmail(email) {
  if (!email || !email.trim()) return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
    return "Ingresa un correo válido (ej. nombre@dominio.com).";
  return null;
}

/**
 * Teléfono El Salvador: 8 dígitos, empieza con 2 (fijo), 6 o 7 (móvil).
 * Acepta con o sin guion: 7777-7777 ó 77777777.
 */
export function validateTelefono(tel) {
  if (!tel || !tel.trim()) return null; // opcional en paciente del admin
  const cleaned = tel.replace(/[-\s]/g, "");
  if (!/^[267]\d{7}$/.test(cleaned))
    return "Teléfono inválido. Debe tener 8 dígitos y comenzar con 2, 6 o 7 (ej. 7234-5678).";
  return null;
}

/**
 * Fecha de nacimiento: no puede ser futura, ni mayor a 120 años atrás.
 * Paciente debe tener al menos 1 año.
 */
export function validateFechaNacimiento(fecha) {
  if (!fecha) return "La fecha de nacimiento es obligatoria.";
  const dob = new Date(fecha + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "La fecha de nacimiento no puede ser futura.";
  const hace120 = new Date();
  hace120.setFullYear(hace120.getFullYear() - 120);
  if (dob < hace120) return "Ingresa una fecha de nacimiento válida (máx. 120 años atrás).";
  const hace1 = new Date();
  hace1.setFullYear(hace1.getFullYear() - 1);
  if (dob > hace1) return "El paciente debe tener al menos 1 año de edad.";
  return null;
}

/**
 * Fecha de cita: debe ser hoy o en el futuro.
 * No puede ser un mes pasado ni un año pasado.
 */
export function validateFechaCita(fecha) {
  if (!fecha) return "La fecha de la cita es obligatoria.";
  const selected = new Date(fecha + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) return "La fecha de la cita no puede ser en el pasado.";
  // No más de 1 año hacia adelante
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  if (selected > maxDate) return "La cita no puede programarse con más de 1 año de anticipación.";
  return null;
}

/** Contraseña mínimo 8 caracteres */
export function validatePassword(pwd) {
  if (!pwd) return "La contraseña es obligatoria.";
  if (pwd.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  return null;
}

/** Nombre: mínimo 3 letras, solo letras y espacios */
export function validateNombre(nombre) {
  if (!nombre || !nombre.trim()) return "El nombre es obligatorio.";
  if (nombre.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s''-]+$/.test(nombre.trim()))
    return "El nombre solo puede contener letras y espacios.";
  return null;
}

/** Devuelve la fecha mínima para citas (hoy en formato YYYY-MM-DD) */
export function todayString() {
  return new Date().toISOString().split("T")[0];
}

/** Devuelve la fecha máxima de nacimiento válida (hace 1 año) en YYYY-MM-DD */
export function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
}

/** Devuelve la fecha mínima de nacimiento válida (hace 120 años) en YYYY-MM-DD */
export function minBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0];
}
