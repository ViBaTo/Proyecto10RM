// Importamos las dependencias necesarias
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import usersRouter from './src/api/routes/users.js'
import librosRouter from './src/api/routes/libros.js'
import uploadRouter from './src/api/routes/upload.js'

// Configurar dotenv
dotenv.config()

// Inicializamos Express
const app = express()

// Middleware para parsear JSON y habilitar CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://proyecto10-rm.vercel.app' // Añade aquí tu dominio de frontend en Vercel
]

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.'
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
    credentials: true
  })
)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Rutas base
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Conexión a la base de datos MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Conectado a la base de datos')
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error)
    process.exit(1)
  }
}

// Rutas de la API
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/books', librosRouter)
app.use('/api/v1/upload', uploadRouter)

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.originalUrl} no existe`,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString()
  })
})

// Configuramos el puerto
const PORT = process.env.PORT || 3000

// Conectar a la base de datos y levantar el servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor desplegado en http://localhost:${PORT}`)
  })
})
