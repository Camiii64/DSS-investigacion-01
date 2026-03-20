const getApiUrl = () => {
  // Si estamos en localhost (PC), usamos localhost
  // Si estamos accediendo por IP (Móvil), usamos esa misma IP para el backend
  const hostname = window.location.hostname;
  return `http://${hostname}:3001`;
};

export const API_URL = import.meta.env.VITE_API_URL || getApiUrl();
