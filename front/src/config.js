// API URLs configuration
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

const config = {
  apiURL: isDevelopment
    ? 'http://localhost:3000/api/v1'
    : 'https://proyecto10-rm-backend.vercel.app/api/v1' // URL de tu backend en Vercel
}

export default config
