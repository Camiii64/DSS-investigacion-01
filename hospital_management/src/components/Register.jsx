import { useState } from "react";

function Register({ setShowRegister }) {
  const [formData, setFormData] = useState({
    nombre_completo: "",
    dui: "",
    telefono: "",
    tipo_sangre: "",
    fecha_nacimiento: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validación básica
    if (
      !formData.nombre_completo ||
      !formData.dui ||
      !formData.telefono ||
      !formData.tipo_sangre ||
      !formData.fecha_nacimiento ||
      !formData.email ||
      !formData.password
    ) {
      alert("Todos los campos son obligatorios");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Paciente registrado correctamente");

        // Limpiar formulario
        setFormData({
          nombre_completo: "",
          dui: "",
          telefono: "",
          tipo_sangre: "",
          fecha_nacimiento: "",
          email: "",
          password: "",
        });

        setShowRegister(false);
      } else {
        alert(data.message || "Error al registrar");
      }

    } catch (error) {
      console.error("Error conexión:", error);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Registro de Paciente</h2>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          name="nombre_completo"
          placeholder="Nombre Completo"
          value={formData.nombre_completo}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="dui"
          placeholder="DUI"
          value={formData.dui}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={handleChange}
          required
        />

        <select
          name="tipo_sangre"
          value={formData.tipo_sangre}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione tipo de sangre</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <input
          type="date"
          name="fecha_nacimiento"
          value={formData.fecha_nacimiento}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p>
        ¿Ya tienes cuenta?{" "}
        <span
          onClick={() => setShowRegister(false)}
          className="link"
          style={{ cursor: "pointer", color: "blue" }}
        >
          Inicia sesión
        </span>
      </p>
    </>
  );
}

export default Register;
