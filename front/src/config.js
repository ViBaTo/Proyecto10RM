// API URLs configuration
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

const config = {
  apiURL: isDevelopment ? 'http://localhost:3000/api/v1' : '/api/v1' // Ahora usamos una ruta relativa ya que todo está en el mismo dominio
}

export default config
